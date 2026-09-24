package com.lecture.course.repository;

import com.lecture.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    // 카테고리별 상품 조회 (추천 서비스 사용)
    List<Course> findByCategoryAndStatus(Course.Category category, Course.Status status);

    // 업체별 상품 조회
    List<Course> findByVendorId(Long vendorId);

    // 활성 상품 전체 조회
    List<Course> findByStatus(Course.Status status);

    // 카테고리별 + 특정 ID 제외 조회 (추천 서비스: 이미 예약한 상품 제외)
    List<Course> findByCategoryAndStatusAndIdNotIn(
            Course.Category category,
            Course.Status status,
            List<Long> excludeIds
    );
}
