package com.lecture.payment.service;

import com.lecture.payment.dto.PaymentDto;
import com.lecture.payment.entity.Payment;
import com.lecture.payment.entity.RefundRequest;
import com.lecture.payment.kafka.PaymentKafkaProducer;
import com.lecture.payment.repository.PaymentRepository;
import com.lecture.payment.repository.RefundRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final PaymentKafkaProducer kafkaProducer;
    private final EnrollmentServiceClient enrollmentServiceClient;

    /**
     * 내부 결제 요청 (Enrollment Service → Payment Service REST 호출)
     * 실습 환경에서는 PG 연동 없이 항상 성공으로 처리
     *
     * 처리 흐름:
     * 1. Payment 생성 (PENDING)
     * 2. PG 결제 처리 (실습: UUID 트랜잭션 ID 발급으로 대체)
     * 3. Payment 상태 → COMPLETED
     * 4. payment.completed 이벤트 발행 → Kafka
     */
    @Transactional
    public PaymentDto.InternalPaymentResult processInternalPayment(
            PaymentDto.InternalPaymentRequest request) {

        log.info("[PaymentService] 결제 요청 - userId: {}, courseId: {}, amount: {}",
                request.getUserId(), request.getCourseId(), request.getAmount());

        Payment payment = paymentRepository.save(
                Payment.builder()
                        .userId(request.getUserId())
                        .courseId(request.getCourseId())
                        .amount(request.getAmount())
                        .build()
        );

        try {
            String transactionId = UUID.randomUUID().toString();

            payment.complete(transactionId);
            log.info("[PaymentService] 결제 완료 처리 - paymentId: {}, transactionId: {}",
                    payment.getId(), transactionId);

            kafkaProducer.publishPaymentCompleted(
                    PaymentKafkaProducer.PaymentCompletedEvent.builder()
                            .paymentId(payment.getId())
                            .userId(request.getUserId())
                            .courseId(request.getCourseId())
                            .status("COMPLETED")
                            // #14 payload 확장 — eventId는 필수, category/region은
                            // payment가 course 정보를 갖고 있지 않아 null 허용
                            .eventId(UUID.randomUUID().toString())
                            .build()
            );

            log.info("[PaymentService] 결제 최종 성공 - paymentId: {}", payment.getId());

            return PaymentDto.InternalPaymentResult.builder()
                    .paymentId(payment.getId())
                    .status("COMPLETED")
                    .build();

        } catch (Exception e) {
            payment.fail();

            log.error("[PaymentService] 결제 실패 - paymentId: {}, userId: {}, courseId: {}, error: {}",
                    payment.getId(),
                    request.getUserId(),
                    request.getCourseId(),
                    e.getMessage(),
                    e);

            return PaymentDto.InternalPaymentResult.builder()
                    .paymentId(payment.getId())
                    .status("FAILED")
                    .build();
        }
    }

    /**
     * 결제 단건 조회
     */
    public PaymentDto.PaymentResponse getPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다: " + id));
        return PaymentDto.PaymentResponse.from(payment);
    }

    /**
     * 사용자 결제 내역 조회
     */
    public List<PaymentDto.PaymentResponse> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(PaymentDto.PaymentResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 환불 요청 생성 (결정 D-009: 결제는 즉시 완료, 환불만 업체(VENDOR) 승인)
     * - COMPLETED 결제만 환불 요청 가능
     * - 같은 결제 건에 처리 대기(REQUESTED) 요청이 이미 있으면 400
     */
    @Transactional
    public PaymentDto.RefundRequestResponse createRefundRequest(
            Long paymentId, Long customerId, String reason) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("결제 정보를 찾을 수 없습니다: " + paymentId));

        if (payment.getStatus() != Payment.Status.COMPLETED) {
            throw new IllegalArgumentException(
                    "완료된 결제만 환불 요청할 수 있습니다. 현재 상태: " + payment.getStatus());
        }

        if (refundRequestRepository.existsByPaymentIdAndStatus(
                paymentId, RefundRequest.Status.REQUESTED)) {
            throw new IllegalArgumentException("이미 처리 대기 중인 환불 요청이 있습니다: " + paymentId);
        }

        RefundRequest refundRequest = refundRequestRepository.save(
                RefundRequest.builder()
                        .paymentId(paymentId)
                        .customerId(customerId)
                        .reason(reason)
                        .build()
        );

        log.info("[PaymentService] 환불 요청 생성 - refundRequestId: {}, paymentId: {}, customerId: {}",
                refundRequest.getId(), paymentId, customerId);

        return PaymentDto.RefundRequestResponse.from(refundRequest);
    }

    /**
     * 환불 요청 목록 조회 (업체 승인·지자체 모니터링용, 승인/반려 히스토리 포함)
     * @param status REQUESTED | APPROVED | REJECTED (null이면 전체)
     */
    public List<PaymentDto.RefundRequestResponse> getRefundRequests(String status) {
        List<RefundRequest> refundRequests;

        if (status == null || status.isBlank()) {
            refundRequests = refundRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            RefundRequest.Status parsedStatus;
            try {
                parsedStatus = RefundRequest.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("유효하지 않은 환불 상태입니다: " + status);
            }
            refundRequests = refundRequestRepository.findByStatusOrderByCreatedAtDesc(parsedStatus);
        }

        return refundRequests.stream()
                .map(PaymentDto.RefundRequestResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 환불 요청 승인 (업체 VENDOR)
     * 1. RefundRequest → APPROVED (processed_by, processed_at 기록)
     * 2. Payment → REFUNDED
     * 3. enrollment-service 내부 API 호출로 해당 예약 CANCELLED 전환
     *    (호출 실패 시 예외 → 트랜잭션 롤백으로 승인 자체가 취소됨)
     */
    @Transactional
    public PaymentDto.RefundRequestResponse approveRefundRequest(Long refundRequestId, Long vendorId) {
        RefundRequest refundRequest = getProcessableRefundRequest(refundRequestId);

        Payment payment = paymentRepository.findById(refundRequest.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "결제 정보를 찾을 수 없습니다: " + refundRequest.getPaymentId()));

        refundRequest.approve(vendorId);
        payment.refund();

        enrollmentServiceClient.cancelEnrollment(payment.getUserId(), payment.getCourseId());

        log.info("[PaymentService] 환불 승인 - refundRequestId: {}, paymentId: {}, vendorId: {}",
                refundRequestId, payment.getId(), vendorId);

        return PaymentDto.RefundRequestResponse.from(refundRequest);
    }

    /**
     * 환불 요청 반려 (업체 VENDOR) — Payment는 COMPLETED 유지
     */
    @Transactional
    public PaymentDto.RefundRequestResponse rejectRefundRequest(Long refundRequestId, Long vendorId) {
        RefundRequest refundRequest = getProcessableRefundRequest(refundRequestId);

        refundRequest.reject(vendorId);

        log.info("[PaymentService] 환불 반려 - refundRequestId: {}, paymentId: {}, vendorId: {}",
                refundRequestId, refundRequest.getPaymentId(), vendorId);

        return PaymentDto.RefundRequestResponse.from(refundRequest);
    }

    private RefundRequest getProcessableRefundRequest(Long refundRequestId) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "환불 요청을 찾을 수 없습니다: " + refundRequestId));

        if (refundRequest.getStatus() != RefundRequest.Status.REQUESTED) {
            throw new IllegalArgumentException(
                    "이미 처리된 환불 요청입니다. 현재 상태: " + refundRequest.getStatus());
        }

        return refundRequest;
    }
}
