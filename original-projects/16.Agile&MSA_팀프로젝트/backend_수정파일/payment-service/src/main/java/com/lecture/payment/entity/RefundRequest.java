package com.lecture.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 환불 요청 — Human-in-the-loop 감사 추적 (결정 D-009: 결제는 즉시 완료, 환불만 업체(VENDOR) 승인)
 * init-db/03_sprint2.sql 의 refund_requests 테이블에 매핑
 */
@Entity
@Table(name = "refund_requests")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_id", nullable = false)
    private Long paymentId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.REQUESTED;

    // 처리한 업체(VENDOR) user id
    @Column(name = "processed_by")
    private Long processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Status {
        REQUESTED,  // 환불 요청 접수
        APPROVED,   // 업체 승인 (결제 REFUNDED 전환)
        REJECTED    // 업체 반려 (결제 COMPLETED 유지)
    }

    public void approve(Long vendorId) {
        this.status = Status.APPROVED;
        this.processedBy = vendorId;
        this.processedAt = LocalDateTime.now();
    }

    public void reject(Long vendorId) {
        this.status = Status.REJECTED;
        this.processedBy = vendorId;
        this.processedAt = LocalDateTime.now();
    }
}
