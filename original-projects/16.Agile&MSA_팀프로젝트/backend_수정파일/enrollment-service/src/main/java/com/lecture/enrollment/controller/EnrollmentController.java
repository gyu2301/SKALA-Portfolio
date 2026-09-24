package com.lecture.enrollment.controller;

import com.lecture.enrollment.dto.EnrollmentDto;
import com.lecture.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * POST /enrollments - 예약 신청
     * Gateway에서 X-User-Id 헤더로 사용자 ID 전달
     */
    @PostMapping
    public ResponseEntity<EnrollmentDto.ApiResponse<EnrollmentDto.EnrollmentResponse>> enroll(
            @Valid @RequestBody EnrollmentDto.EnrollRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        EnrollmentDto.EnrollmentResponse response =
                enrollmentService.enroll(userId, request.getCourseId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EnrollmentDto.ApiResponse.success(response));
    }

    /**
     * GET /enrollments/my - 내 예약 목록 조회
     * Gateway가 전달한 X-User-Id 헤더를 사용
     */
    @GetMapping("/my")
    public ResponseEntity<EnrollmentDto.ApiResponse<List<EnrollmentDto.EnrollmentResponse>>> getMyEnrollments(
            @RequestHeader("X-User-Id") Long userId) {

        List<EnrollmentDto.EnrollmentResponse> response =
                enrollmentService.getEnrollmentsByUser(userId);
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(response));
    }

    /**
     * GET /enrollments/user/{userId} - 특정 사용자 예약 목록 조회
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<EnrollmentDto.ApiResponse<List<EnrollmentDto.EnrollmentResponse>>> getEnrollments(
            @PathVariable Long userId) {

        List<EnrollmentDto.EnrollmentResponse> response =
                enrollmentService.getEnrollmentsByUser(userId);
        return ResponseEntity.ok(EnrollmentDto.ApiResponse.success(response));
    }

    /**
     * PATCH /enrollments/internal/cancel - 예약 취소 (Payment Service 환불 승인 시 호출)
     * 서비스 간 내부 호출용 — userId + courseId 로 대상 예약을 특정해 CANCELLED 전환
     */
    @PatchMapping("/internal/cancel")
    public ResponseEntity<Void> cancelEnrollmentInternal(
            @RequestParam Long userId,
            @RequestParam Long courseId) {

        enrollmentService.cancelEnrollment(userId, courseId);
        return ResponseEntity.ok().build();
    }

    /**
     * GET /enrollments/internal/history/{userId} - 예약 이력 조회 (Recommend Service용)
     */
    @GetMapping("/internal/history/{userId}")
    public ResponseEntity<EnrollmentDto.EnrollmentHistoryResponse> getEnrollmentHistory(
            @PathVariable Long userId) {

        return ResponseEntity.ok(enrollmentService.getEnrollmentHistory(userId));
    }
}
