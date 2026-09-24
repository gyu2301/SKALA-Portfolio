package com.lecture.user.dto;

import com.lecture.user.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class UserDto {

    // 회원가입 요청
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다")
        @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다")
        private String password;

        @NotBlank(message = "이름은 필수입니다")
        private String name;

        private User.UserType role; // CUSTOMER(예비부부) | VENDOR(웨딩업체) | ADMIN(운영자) — JSON 키는 role 유지

        // VENDOR 전용 — 사업자등록번호·상호명 (CUSTOMER는 생략)
        private String businessRegNo;
        private String businessName;
    }

    // 사용자 정보 응답
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserResponse {
        private Long id;
        private String email;
        private String name;
        private User.UserType role; // 응답은 항상 도메인 역할 (DB legacy 값은 auth 호환용 내부 구현)
        private String businessName; // VENDOR 상호명 (사업자등록번호는 민감정보라 응답 미노출)
        private LocalDateTime createdAt;

        public static UserResponse from(User user) {
            return UserResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.resolveUserType())
                    .businessName(user.getBusinessName())
                    .createdAt(user.getCreatedAt())
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
