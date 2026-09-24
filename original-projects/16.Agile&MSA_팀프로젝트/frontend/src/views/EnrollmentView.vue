<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <h1 class="page-title">내 예약 목록</h1>

        <div v-if="loading" class="enrollment-list">
          <div v-for="i in 3" :key="i" class="enrollment-card">
            <AppSkeleton width="72px" height="72px" radius="12px" />
            <div class="enroll-info" style="flex:1; gap:8px">
              <AppSkeleton width="56px" height="20px" radius="999px" />
              <AppSkeleton width="55%" height="18px" />
              <AppSkeleton width="30%" height="13px" />
            </div>
            <AppSkeleton width="90px" height="34px" radius="8px" />
          </div>
        </div>

        <div v-else-if="enrollments.length" class="enrollment-list fade-in">
          <div v-for="item in enrollments" :key="item.id" class="enrollment-card">
            <div class="enroll-thumb" :style="thumbStyle(item.course?.category)">
              <span class="et-cat">{{ catKo(item.course?.category) }}</span>
              <img v-if="photoFor(item.course)" :src="photoFor(item.course)" class="et-photo" @error="$event.target.remove()" loading="lazy" alt="" />
            </div>

            <div class="enroll-info">
              <span class="badge" :style="badgeStyle(item.course?.category)">
                {{ catKo(item.course?.category) }}
              </span>
              <h3 class="enroll-title">{{ item.course?.title }}</h3>
              <p class="enroll-instructor" v-if="item.course?.instructorName || item.course?.vendorName">
                업체: {{ item.course?.instructorName || item.course?.vendorName }}
              </p>
            </div>

            <div class="enroll-status">
              <span :class="['status-badge', item.status === 'ACTIVE' ? 'status-active' : 'status-pending']">
                {{ item.status === 'ACTIVE' ? '예약 완료' : '대기 중' }}
              </span>
              <div class="enroll-actions">
                <router-link :to="`/courses/${item.courseId}`" class="btn btn-ghost btn-sm">상품 보기</router-link>
                <button
                  v-if="item.status === 'ACTIVE'"
                  class="btn btn-sm"
                  :class="refundedIds.includes(item.id) ? 'refund-done' : 'btn-outline'"
                  :disabled="refundedIds.includes(item.id) || refundingId === item.id"
                  @click="requestRefund(item)"
                >
                  {{ refundedIds.includes(item.id) ? '✓ 환불 요청됨' : (refundingId === item.id ? '요청 중...' : '환불 요청') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p class="empty-icon">📭</p>
          <p>예약 중인 상품가 없습니다.</p>
          <router-link to="/courses" class="btn btn-primary" style="margin-top:16px;">
            상품 둘러보기
          </router-link>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from '@/components/AppSidebar.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { enrollmentApi } from '@/api/enrollment.js'
import { paymentApi } from '@/api/payment.js'
import { useAuthStore } from '@/store/auth.js'

const router = useRouter()
const auth = useAuthStore()

const enrollments = ref([])
const payments = ref([])
const refundedIds = ref([])
const refundingId = ref(null)
const loading = ref(true)

const isInstructor = computed(() => ['VENDOR', 'INSTRUCTOR'].includes(auth.user?.role))

const catKoMap = { STUDIO: '스튜디오', DRESS: '드레스', MAKEUP: '메이크업' }
function catKo(cat) { return catKoMap[cat] || cat || '상품' }
const catColor = {
  '스튜디오': ['#E7F0EA', '#3d6b50'],
  '드레스': ['#faf0d8', '#8a5a12'],
  '메이크업': ['#F3E8EE', '#8A4A6B'],
}
function thumbStyle(cat) {
  const c = catColor[catKo(cat)] || ['#F1EFE8', '#6B7A72']
  return { background: `linear-gradient(140deg, ${c[0]} 0%, #ffffff 120%)`, color: c[1] }
}
function badgeStyle(cat) {
  const c = catColor[catKo(cat)] || ['#F1EFE8', '#6B7A72']
  return { background: c[0], color: c[1] }
}
const photoPool = {
  '스튜디오': ['photo-1519741497674-611481863552', 'photo-1465495976277-4387d4b0b4c6', 'photo-1606216794074-735e91aa2c92', 'photo-1511285560929-80b456fea0bc'],
  '드레스': ['photo-1594552072238-b8a33785b261', 'photo-1519657337289-077653f724ed', 'photo-1525258946800-98cfd641d0de', 'photo-1560750588-73207b1ef5b8'],
  '메이크업': ['photo-1487412947147-5cebf100ffc2', 'photo-1522337660859-02fbefca4702', 'photo-1516975080664-ed2fc6a32937', 'photo-1596704017254-9b121068fb31'],
}
function photoFor(course) {
  if (!course) return null
  const pool = photoPool[catKo(course.category)] || []
  if (!pool.length) return null
  return `https://images.unsplash.com/${pool[(course.id || 0) % pool.length]}?w=220&q=70&auto=format&fit=crop`
}

// 환불 요청: enrollment(courseId) → 사용자 결제내역에서 paymentId 매핑 → 환불 요청 생성
async function requestRefund(item) {
  if (refundingId.value || refundedIds.value.includes(item.id)) return
  const pay = payments.value.find(
    p => Number(p.courseId ?? p.course_id) === Number(item.courseId) &&
         (p.status === 'COMPLETED' || p.status === 'ACTIVE' || !p.status)
  )
  if (!pay) {
    alert('결제 내역을 찾지 못했습니다. 결제 완료된 예약만 환불 요청할 수 있어요.')
    return
  }
  refundingId.value = item.id
  try {
    await paymentApi.requestRefund(pay.id ?? pay.paymentId, '고객 요청 환불')
    refundedIds.value.push(item.id)
  } catch (e) {
    alert(e.response?.data?.message || '환불 요청에 실패했습니다.')
  } finally {
    refundingId.value = null
  }
}

onMounted(async () => {
  // 강사는 이 페이지 접근 불가 → 마이페이지로 이동
  if (isInstructor.value) {
    console.warn('[EnrollmentView] instructor tried to access /enrollments, redirect to /mypage')
    router.replace('/mypage')
    return
  }

  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[EnrollmentView] my enrollments response:', res.data)

    if (Array.isArray(res.data?.data)) {
      enrollments.value = res.data.data
    } else if (Array.isArray(res.data)) {
      enrollments.value = res.data
    } else {
      enrollments.value = []
    }

    try {
      if (auth.user?.id) {
        const pres = await paymentApi.getUserPayments(auth.user.id)
        payments.value = Array.isArray(pres.data?.data) ? pres.data.data : (Array.isArray(pres.data) ? pres.data : [])
      }
    } catch (e) {
      console.warn('[EnrollmentView] payments load failed:', e)
    }
  } catch (error) {
    console.error('[EnrollmentView] failed to load enrollments:', error)
    enrollments.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 28px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.sidebar-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: var(--transition);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-sans);
  text-decoration: none;
}

.sidebar-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

.si-icon {
  font-size: 15px;
}

.main-content {
  min-width: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 24px;
}

.enrollment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enrollment-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: var(--transition);
}

.enrollment-card:hover {
  box-shadow: var(--shadow-sm);
}

.enroll-thumb {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}
.et-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

.enroll-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}
.et-cat { font-size: 12.5px; font-weight: 700; letter-spacing: 0.01em; }
.enroll-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.refund-done {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid transparent;
  opacity: 1 !important;
  cursor: default;
  font-weight: 600;
}

.thumb-teal {
  background: #E1F5EE;
}

.thumb-blue {
  background: #E6F1FB;
}

.thumb-purple {
  background: #EEEDFE;
}

.thumb-pink {
  background: #FBEAF0;
}

.thumb-gray {
  background: #F1EFE8;
}

.enroll-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.enroll-title {
  font-size: 15px;
  font-weight: 600;
}

.enroll-instructor {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.enroll-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #E1F5EE;
  color: #0F6E56;
}

.status-pending {
  background: #FAEEDA;
  color: #854F0B;
}

.btn-sm {
  padding: 7px 14px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
