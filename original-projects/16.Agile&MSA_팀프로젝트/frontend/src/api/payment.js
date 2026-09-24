import api from './index.js'

export const paymentApi = {
  // 사용자 결제 내역 (환불 시 courseId → paymentId 매핑용)
  getUserPayments(userId) {
    return api.get(`/api/payments/user/${userId}`)
  },
  // 결제 단건 (환불→결제→상품 courseId 매핑)
  getPayment(paymentId) {
    return api.get(`/api/payments/${paymentId}`)
  },
  // 환불 요청 생성 (고객)
  requestRefund(paymentId, reason) {
    return api.post(`/api/payments/${paymentId}/refund-requests`, { reason })
  },
  // 환불 요청 목록 (업체·지자체 화면)
  getRefundRequests() {
    return api.get('/api/payments/refund-requests')
  },
  // 환불 승인 / 반려 (업체가 자기 상품 것 처리)
  approveRefund(id) {
    return api.patch(`/api/payments/refund-requests/${id}/approve`)
  },
  rejectRefund(id) {
    return api.patch(`/api/payments/refund-requests/${id}/reject`)
  },
}
