package com.lecture.enrollment.service;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.entity.Enrollment;
import com.lecture.enrollment.entity.ProcessedEvent;
import com.lecture.enrollment.kafka.EnrollmentKafkaProducer;
import com.lecture.enrollment.kafka.KafkaEvent;
import com.lecture.enrollment.repository.EnrollmentRepository;
import com.lecture.enrollment.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    // Kafka 멱등 게이트용 컨슈머 그룹 식별자 (processed_events.consumer_group)
    private static final String CONSUMER_GROUP = "enrollment-service";

    private final EnrollmentRepository enrollmentRepository;
    private final ProcessedEventRepository processedEventRepository;
    private final CourseServiceClient courseServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final EnrollmentKafkaProducer kafkaProducer;
    private final EnrollmentWriteService enrollmentWriteService;

    /**
     * 예약 신청 전체 흐름
     * 1. 상품 존재 확인
     * 2. 중복 예약 확인
     * 3. Enrollment 생성 및 즉시 커밋 (PENDING)
     * 4. 결제 요청
     */
    public EnrollmentDto.EnrollmentResponse enroll(Long userId, Long courseId) {
        if (!courseServiceClient.existsCourse(courseId)) {
            throw new IllegalArgumentException("존재하지 않는 상품입니다: " + courseId);
        }

        if (enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new IllegalArgumentException("이미 예약 신청한 상품입니다");
        }

        Enrollment enrollment = enrollmentWriteService.createPendingEnrollment(userId, courseId);

        paymentServiceClient.requestPayment(userId, courseId, BigDecimal.valueOf(99000));

        log.info("[EnrollmentService] 예약 신청 완료 (결제 대기) - enrollmentId: {}", enrollment.getId());
        return EnrollmentDto.EnrollmentResponse.from(enrollment);
    }

    /**
     * 예약 확정 (eventId 없는 옛 포맷 호환용)
     */
    @Transactional
    public void activateEnrollment(Long userId, Long courseId) {
        activateEnrollment(userId, courseId, null);
    }

    /**
     * 예약 확정 (#14 멱등 처리)
     * - eventId가 있으면 processed_events(event_id, consumer_group) PK 게이트로
     *   이미 처리한 이벤트는 skip → 같은 이벤트 중복 전달에도 부작용 1회만 발생
     * - eventId가 null(옛 포맷)이면 멱등 체크 없이 기존 동작 유지
     * - 멱등 기록과 예약 확정이 같은 트랜잭션 → 처리 실패 시 기록도 함께 롤백
     */
    @Transactional
    public void activateEnrollment(Long userId, Long courseId, String eventId) {
        if (eventId != null) {
            ProcessedEvent.Pk pk = new ProcessedEvent.Pk(eventId, CONSUMER_GROUP);
            if (processedEventRepository.existsById(pk)) {
                log.info("[EnrollmentService] 이미 처리된 이벤트 → skip - eventId: {}, userId: {}, courseId: {}",
                        eventId, userId, courseId);
                return;
            }
            processedEventRepository.save(ProcessedEvent.of(eventId, CONSUMER_GROUP));
        }

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "예약 정보를 찾을 수 없습니다 - userId: " + userId + ", courseId: " + courseId));

        enrollment.activate();

        courseServiceClient.increaseEnrollmentCount(courseId);

        kafkaProducer.publishEnrollmentCompleted(
                KafkaEvent.EnrollmentCompletedEvent.builder()
                        .enrollmentId(enrollment.getId())
                        .userId(userId)
                        .courseId(courseId)
                        .build()
        );

        log.info("[EnrollmentService] 예약 확정 완료 - enrollmentId: {}", enrollment.getId());
    }

    /**
     * 예약 취소 (Payment Service 환불 승인 → internal API 호출)
     */
    @Transactional
    public void cancelEnrollment(Long userId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "예약 정보를 찾을 수 없습니다 - userId: " + userId + ", courseId: " + courseId));

        enrollment.cancel();

        log.info("[EnrollmentService] 예약 취소 완료 (환불 승인) - enrollmentId: {}, userId: {}, courseId: {}",
                enrollment.getId(), userId, courseId);
    }

    /**
     * 사용자 예약 목록 조회
     * - course-service에서 상품 상세 정보를 붙여서 반환
     */
    public List<EnrollmentDto.EnrollmentResponse> getEnrollmentsByUser(Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);

        return enrollments.stream()
                .map(enrollment -> {
                    Map<String, Object> courseInfo = courseServiceClient.getCourse(enrollment.getCourseId());

                    EnrollmentDto.CourseSummary courseSummary = EnrollmentDto.CourseSummary.builder()
                            .id(toLong(courseInfo.get("id")))
                            .title((String) courseInfo.get("title"))
                            .description((String) courseInfo.get("description"))
                            .category(normalizeCategory((String) courseInfo.get("category")))
                            .price(toInteger(courseInfo.get("price")))
                            .thumbnail((String) courseInfo.get("thumbnail"))
                            .instructorName(
                                    firstNonNull(
                                            (String) courseInfo.get("instructorName"),
                                            (String) courseInfo.get("teacherName"),
                                            (String) courseInfo.get("instructor_name")
                                    )
                            )
                            .enrollmentCount(toInteger(
                                    firstNonNullObject(
                                            courseInfo.get("enrollmentCount"),
                                            courseInfo.get("enrollment_count")
                                    )
                            ))
                            .build();

                    return EnrollmentDto.EnrollmentResponse.from(enrollment, courseSummary);
                })
                .collect(Collectors.toList());
    }

    /**
     * 예약 이력 조회 - 추천 서비스용
     */
    public EnrollmentDto.EnrollmentHistoryResponse getEnrollmentHistory(Long userId) {
        List<Long> activeCourseIds = enrollmentRepository
                .findByUserIdAndStatus(userId, Enrollment.Status.ACTIVE)
                .stream()
                .map(Enrollment::getCourseId)
                .collect(Collectors.toList());

        return EnrollmentDto.EnrollmentHistoryResponse.builder()
                .userId(userId)
                .activeCourseIds(activeCourseIds)
                .build();
    }

    private String normalizeCategory(String category) {
        if (category == null) return null;

        return switch (category) {
            case "BACKEND" -> "백엔드";
            case "FRONTEND" -> "프론트엔드";
            case "DEVOPS" -> "DevOps";
            case "DATA" -> "데이터";
            case "AI" -> "AI";
            default -> category;
        };
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(value.toString());
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(value.toString());
    }

    private String firstNonNull(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private Object firstNonNullObject(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }
}
