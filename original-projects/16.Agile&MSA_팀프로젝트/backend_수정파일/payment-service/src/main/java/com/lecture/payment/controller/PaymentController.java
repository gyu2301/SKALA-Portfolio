package com.lecture.payment.controller;

import com.lecture.payment.dto.PaymentDto;
import com.lecture.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * POST /payments/internal/request - 내부 결제 요청 (Enrollment Service 호출)
     */
    @PostMapping("/internal/request")
    public ResponseEntity<PaymentDto.InternalPaymentResult> processInternalPayment(
            @RequestBody PaymentDto.InternalPaymentRequest request) {

        PaymentDto.InternalPaymentResult result = paymentService.processInternalPayment(request);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /payments/{paymentId}/refund-requests - 환불 요청 생성 (고객)
     * Gateway가 전달한 X-User-Id 헤더를 customer_id로 사용
     */
    @PostMapping("/{paymentId}/refund-requests")
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.RefundRequestResponse>> createRefundRequest(
            @PathVariable Long paymentId,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody PaymentDto.RefundCreateRequest request) {

        PaymentDto.RefundRequestResponse response =
                paymentService.createRefundRequest(paymentId, userId, request.getReason());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(PaymentDto.ApiResponse.success(response));
    }

    /**
     * GET /payments/refund-requests - 환불 요청 목록 조회 (업체 승인·지자체 모니터링용)
     * ?status=REQUESTED|APPROVED|REJECTED 필터 선택, 없으면 전체 히스토리
     */
    @GetMapping("/refund-requests")
    public ResponseEntity<PaymentDto.ApiResponse<List<PaymentDto.RefundRequestResponse>>> getRefundRequests(
            @RequestParam(required = false) String status) {

        return ResponseEntity.ok(
                PaymentDto.ApiResponse.success(paymentService.getRefundRequests(status)));
    }

    /**
     * PATCH /payments/refund-requests/{id}/approve - 환불 승인 (업체 VENDOR)
     * X-User-Id 헤더를 processed_by로 기록, Payment → REFUNDED, 예약 → CANCELLED
     */
    @PatchMapping("/refund-requests/{id}/approve")
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.RefundRequestResponse>> approveRefundRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long vendorId) {

        return ResponseEntity.ok(
                PaymentDto.ApiResponse.success(paymentService.approveRefundRequest(id, vendorId)));
    }

    /**
     * PATCH /payments/refund-requests/{id}/reject - 환불 반려 (업체 VENDOR)
     * Payment는 COMPLETED 유지
     */
    @PatchMapping("/refund-requests/{id}/reject")
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.RefundRequestResponse>> rejectRefundRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long vendorId) {

        return ResponseEntity.ok(
                PaymentDto.ApiResponse.success(paymentService.rejectRefundRequest(id, vendorId)));
    }

    /**
     * GET /payments/{id} - 결제 단건 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto.ApiResponse<PaymentDto.PaymentResponse>> getPayment(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                PaymentDto.ApiResponse.success(paymentService.getPayment(id)));
    }

    /**
     * GET /payments/user/{userId} - 사용자 결제 내역 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<PaymentDto.ApiResponse<List<PaymentDto.PaymentResponse>>> getPaymentsByUser(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                PaymentDto.ApiResponse.success(paymentService.getPaymentsByUser(userId)));
    }
}
