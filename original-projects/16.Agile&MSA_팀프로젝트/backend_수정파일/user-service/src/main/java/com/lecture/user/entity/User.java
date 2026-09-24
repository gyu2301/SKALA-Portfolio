package com.lecture.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    // auth-server(수정 불가 인프라)가 파싱하는 컬럼 — legacy 값(STUDENT/INSTRUCTOR)만 저장한다.
    // 도메인 역할은 userType에 저장 (트러블슈팅 로그 #8: No enum constant ...Role.CUSTOMER)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // 도메인 역할 — 예비부부/웨딩업체/운영자 (응답·화면 분기는 전부 이 값 기준)
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UserType userType;

    // 사업자등록번호 — VENDOR 가입 시 필수, 국세청 진위확인 API 검증 대상 (Sprint 2)
    @Column(length = 20)
    private String businessRegNo;

    // 상호명 — VENDOR 전용
    @Column(length = 100)
    private String businessName;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum Role {
        STUDENT, INSTRUCTOR // auth-server enum과 동일해야 함 — 다른 값을 저장하면 로그인이 깨진다 (절대 확장 금지)
    }

    public enum UserType {
        CUSTOMER,   // 예비부부 (B2C) — DB role은 STUDENT로 저장
        VENDOR,     // 웨딩업체 (B2B) — DB role은 INSTRUCTOR로 저장
        ADMIN       // 운영자 — DB role은 INSTRUCTOR로 저장
    }

    /** 도메인 역할 — userType이 없으면(auth-server 자동 생성 계정) legacy role에서 유추 */
    public UserType resolveUserType() {
        if (userType != null) return userType;
        return role == Role.INSTRUCTOR ? UserType.VENDOR : UserType.CUSTOMER;
    }
}
