package com.lecture.course.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    // 지역 — 강남구 내 세부 지역 (청담동·신사동·삼성동·선릉로 등)
    @Column(nullable = false, length = 50)
    private String region;

    // 스타일 태그 — 화려 · 미니멀 · 클래식 · 모던 등 (AI 추천 매칭 기준)
    @Column(length = 50)
    private String style;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // 판매 업체 ID (users 테이블의 VENDOR 참조 - 직접 JOIN 없이 ID만 보관)
    @Column(nullable = false)
    private Long vendorId;

    // 예약 수 (추천 서비스 정렬 기준 — API 필드명 enrollmentCount는 서비스 간 계약 유지)
    @Column(nullable = false)
    @Builder.Default
    private Integer enrollmentCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum Category {
        STUDIO,   // 스튜디오 촬영
        DRESS,    // 드레스
        MAKEUP    // 메이크업
    }

    public enum Status {
        ACTIVE, INACTIVE
    }

    public void increaseEnrollmentCount() {
        this.enrollmentCount++;
    }
}
