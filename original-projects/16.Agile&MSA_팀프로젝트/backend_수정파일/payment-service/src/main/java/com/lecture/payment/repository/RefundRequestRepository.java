package com.lecture.payment.repository;

import com.lecture.payment.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {

    // 같은 결제 건에 처리 대기(REQUESTED) 요청이 이미 있는지 — 중복 요청 차단용
    boolean existsByPaymentIdAndStatus(Long paymentId, RefundRequest.Status status);

    // 업체 승인·지자체 모니터링 화면용 전체 히스토리 (최신순)
    List<RefundRequest> findAllByOrderByCreatedAtDesc();

    // 상태 필터 조회 (최신순)
    List<RefundRequest> findByStatusOrderByCreatedAtDesc(RefundRequest.Status status);
}
