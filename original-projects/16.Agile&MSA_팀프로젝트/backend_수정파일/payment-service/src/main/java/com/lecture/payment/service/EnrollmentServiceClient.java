package com.lecture.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Payment Service → Enrollment Service 동기 REST 클라이언트
 * (enrollment-service 의 PaymentServiceClient 패턴을 따름)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EnrollmentServiceClient {

    private final WebClient.Builder webClientBuilder;

    /**
     * Enrollment Service: 예약 취소 (환불 승인 시 호출)
     * PATCH /api/enrollments/internal/cancel?userId=&courseId=
     */
    public void cancelEnrollment(Long userId, Long courseId) {
        try {
            webClientBuilder.build()
                    .patch()
                    .uri("http://enrollment-service/api/enrollments/internal/cancel?userId={userId}&courseId={courseId}",
                            userId, courseId)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("[EnrollmentServiceClient] 예약 취소 완료 - userId: {}, courseId: {}",
                    userId, courseId);
        } catch (Exception e) {
            log.error("[EnrollmentServiceClient] 예약 취소 실패 - userId: {}, courseId: {}, error: {}",
                    userId, courseId, e.getMessage(), e);
            throw new RuntimeException("Enrollment Service 연결 실패");
        }
    }
}
