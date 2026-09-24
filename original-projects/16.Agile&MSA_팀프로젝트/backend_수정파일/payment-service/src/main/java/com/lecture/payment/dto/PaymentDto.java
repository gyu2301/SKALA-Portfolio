package com.lecture.payment.dto;

import com.lecture.payment.entity.Payment;
import com.lecture.payment.entity.RefundRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PaymentDto {

    // 결제 요청 (외부 클라이언트용)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentRequest {
        @NotNull(message = "상품 ID는 필수입니다")
        private Long courseId;

        @NotNull(message = "금액은 필수입니다")
        @Positive(message = "금액은 양수여야 합니다")
        private BigDecimal amount;
    }

    // 내부 서비스 결제 요청 (Enrollment Service → Payment Service)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InternalPaymentRequest {
        private Long userId;
        private Long courseId;
        private BigDecimal amount;
    }

    // 결제 응답
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentResponse {
        private Long paymentId;
        private Long userId;
        private Long courseId;
        private BigDecimal amount;
        private Payment.Status status;
        private String transactionId;
        private LocalDateTime createdAt;

        public static PaymentResponse from(Payment payment) {
            return PaymentResponse.builder()
                    .paymentId(payment.getId())
                    .userId(payment.getUserId())
                    .courseId(payment.getCourseId())
                    .amount(payment.getAmount())
                    .status(payment.getStatus())
                    .transactionId(payment.getTransactionId())
                    .createdAt(payment.getCreatedAt())
                    .build();
        }
    }

    // 내부 서비스 결제 결과 응답
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InternalPaymentResult {
        private Long paymentId;
        private String status;
    }

    // 환불 요청 생성 (고객)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundCreateRequest {
        @NotBlank(message = "환불 사유는 필수입니다")
        private String reason;
    }

    // 환불 요청 응답 (업체 목록·처리 결과 공용)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundRequestResponse {
        private Long id;
        private Long paymentId;
        private Long customerId;
        private String reason;
        private RefundRequest.Status status;
        private Long processedBy;
        private LocalDateTime processedAt;
        private LocalDateTime createdAt;

        public static RefundRequestResponse from(RefundRequest refundRequest) {
            return RefundRequestResponse.builder()
                    .id(refundRequest.getId())
                    .paymentId(refundRequest.getPaymentId())
                    .customerId(refundRequest.getCustomerId())
                    .reason(refundRequest.getReason())
                    .status(refundRequest.getStatus())
                    .processedBy(refundRequest.getProcessedBy())
                    .processedAt(refundRequest.getProcessedAt())
                    .createdAt(refundRequest.getCreatedAt())
                    .build();
        }
    }

    // 공통 API 응답 래퍼
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> success(T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message("성공")
                    .data(data)
                    .build();
        }

        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder()
                    .success(false)
                    .message(message)
                    .build();
        }
    }
}
