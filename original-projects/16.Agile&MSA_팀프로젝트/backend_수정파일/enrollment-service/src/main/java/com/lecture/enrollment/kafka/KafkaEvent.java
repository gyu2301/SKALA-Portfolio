package com.lecture.enrollment.kafka;

import lombok.*;

/**
 * Kafka 이벤트 메시지 DTO
 */
public class KafkaEvent {

    /**
     * Payment Service → Enrollment Service
     * 결제 완료 이벤트 수신
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentCompletedEvent {
        private Long paymentId;
        private Long userId;
        private Long courseId;
        private String status; // COMPLETED

        // Sprint 2 payload 확장 (#14) — 옛 포맷(필드 없음)과 호환 (null 허용)
        private String eventId;   // 멱등 처리용 UUID
        private String category;  // STUDIO | DRESS | MAKEUP
        private String region;
    }

    /**
     * Enrollment Service → Recommend Service
     * 예약 확정 완료 이벤트 발행
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EnrollmentCompletedEvent {
        private Long enrollmentId;
        private Long userId;
        private Long courseId;
    }
}
