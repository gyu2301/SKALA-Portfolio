package com.lecture.course.dto;

import com.lecture.course.entity.Course;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CourseDto {

    // 상품 등록 요청
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {

        @NotBlank(message = "상품 제목은 필수입니다")
        private String title;

        private String description;

        @NotNull(message = "카테고리는 필수입니다")
        private Course.Category category; // STUDIO | DRESS | MAKEUP

        @NotBlank(message = "지역은 필수입니다")
        private String region; // 청담동 | 신사동 | 삼성동 | 선릉로 등

        private String style; // 화려 | 미니멀 | 클래식 | 모던 등

        @NotNull(message = "가격은 필수입니다")
        @PositiveOrZero(message = "가격은 0 이상이어야 합니다")
        private BigDecimal price;
    }

    // 상품 응답
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CourseResponse {
        private Long id;
        private String title;
        private String description;
        private Course.Category category;
        private String region;
        private String style;
        private BigDecimal price;
        private Long vendorId;
        private Integer enrollmentCount; // 예약 수 (서비스 간 계약상 필드명 유지)
        private Course.Status status;
        private LocalDateTime createdAt;

        public static CourseResponse from(Course course) {
            return CourseResponse.builder()
                    .id(course.getId())
                    .title(course.getTitle())
                    .description(course.getDescription())
                    .category(course.getCategory())
                    .region(course.getRegion())
                    .style(course.getStyle())
                    .price(course.getPrice())
                    .vendorId(course.getVendorId())
                    .enrollmentCount(course.getEnrollmentCount())
                    .status(course.getStatus())
                    .createdAt(course.getCreatedAt())
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

    // 추천 서비스용 응답 (카테고리 기반 미예약 상품 목록)
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecommendResponse {
        private List<CourseResponse> courses;
        private Course.Category category;
    }
}
