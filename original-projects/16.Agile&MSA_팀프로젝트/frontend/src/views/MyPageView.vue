<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <AppSidebar />

      <main class="main-content">
        <!-- 프로필 카드 -->
        <div class="profile-card fade-in-up">
          <div class="profile-avatar">{{ auth.user?.name?.charAt(0) || '?' }}</div>
          <div class="profile-info">
            <template v-if="!editing">
              <h2 class="profile-name">{{ auth.user?.name || '사용자' }}</h2>
              <p class="profile-email">{{ auth.user?.email || '-' }}</p>
              <span class="badge" :class="roleBadgeClass">{{ roleLabel }}</span>
            </template>
            <template v-else>
              <input v-model="editName" class="profile-edit-input" placeholder="이름을 입력하세요" />
              <p class="profile-email">{{ auth.user?.email || '-' }} · 이메일은 변경할 수 없습니다</p>
              <span class="badge" :class="roleBadgeClass">{{ roleLabel }}</span>
            </template>
          </div>
          <div class="profile-actions">
            <button v-if="!editing" class="btn btn-outline btn-sm" @click="startEdit">내 정보 변경</button>
            <template v-else>
              <button class="btn btn-primary btn-sm" @click="saveProfile">저장</button>
              <button class="btn btn-ghost btn-sm" @click="editing = false">취소</button>
            </template>
          </div>
        </div>

        <!-- 학생 화면 -->
        <section v-if="!isInstructor" class="recommend-section">
          <h3 class="section-title">나를 위한 추천 상품</h3>

          <p v-if="recommendMessage" class="recommend-message">
            {{ recommendMessage }}
          </p>

          <div v-if="recommendLoading" class="loading-row">
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="recommendations.length" class="recommend-grid fade-in">
            <CourseCard v-for="c in recommendations" :key="c.id" :course="c" />
          </div>

          <p v-else-if="recommendError" class="empty-text">
            {{ recommendError }}
          </p>

          <p v-else class="empty-text">
            온보딩에서 예산을 입력하면 맞춤 상품을 추천해 드려요.
          </p>
        </section>

        <!-- 강사 화면 -->
        <section v-else class="instructor-section">
          <div class="vendor-tab-head">
            <h2 class="vt-title">{{ vtab === 'refunds' ? '교환·환불 관리' : '상품 관리' }}</h2>
            <router-link v-if="vtab !== 'refunds'" to="/courses/new" class="btn btn-primary btn-sm">+ 상품 등록</router-link>
          </div>

          <template v-if="vtab !== 'refunds'">
          <div class="section-head">
            <h3 class="section-title">내가 등록한 웨딩 상품</h3>
            <span class="section-subtitle">등록한 상품과 상품별 예약 수를 확인할 수 있습니다.</span>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">등록 상품 수</div>
              <div class="summary-value">{{ myCourses.length }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">총 예약 수</div>
              <div class="summary-value">{{ totalEnrollmentCount }}</div>
            </div>
          </div>

          <div v-if="instructorLoading" class="loading-row instructor-loading">
            <div v-for="i in 3" :key="i" class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>

          <div v-else-if="myCourses.length" class="instructor-course-list fade-in">
            <div
              v-for="course in myCourses"
              :key="course.id"
              class="instructor-course-card"
            >
              <div class="ic-thumb">
                <img :src="coursePhoto(course, 640)" :alt="course.title" loading="lazy" @error="$event.target.style.display='none'" />
                <span class="ic-cat">{{ course.category || '상품' }}</span>
              </div>
              <div class="course-card-top">
                <div>
                  <h4 class="course-title">{{ course.title }}</h4>
                  <p class="course-desc">{{ course.description || '설명이 없습니다.' }}</p>
                </div>
                <span
                  class="status-badge"
                  :class="course.status === 'ACTIVE' ? 'status-active' : 'status-inactive'"
                >
                  {{ course.status || 'UNKNOWN' }}
                </span>
              </div>

              <div class="course-meta-grid">
                <div class="meta-box">
                  <div class="meta-label">카테고리</div>
                  <div class="meta-value">{{ course.category || '-' }}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">가격</div>
                  <div class="meta-value">{{ formatPrice(course.price) }}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">예약 수</div>
                  <div class="meta-value">
                    {{ course.enrollment_count ?? course.enrollmentCount ?? 0 }}건
                  </div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">상품 ID</div>
                  <div class="meta-value">#{{ course.id }}</div>
                </div>
              </div>

              <div class="course-card-actions">
                <router-link :to="`/courses/${course.id}`" class="action-btn action-primary">
                  상품 보기
                </router-link>
              </div>
            </div>
          </div>

          <p v-else-if="instructorError" class="empty-text">
            {{ instructorError }}
          </p>

          <p v-else class="empty-text">
            아직 등록한 상품이 없습니다.
          </p>
          </template>

          <!-- 교환·환불 관리 (업체가 직접 처리) -->
          <div v-if="vtab === 'refunds'" class="vendor-refunds">
            <p class="refund-note">고객 환불 요청을 <b>직접 승인·반려</b>합니다. 지자체는 전체 데이터를 검증·모니터링만 합니다.</p>
            <div v-if="refundLoading">
              <AppSkeleton v-for="i in 2" :key="i" width="100%" height="66px" radius="12px" style="margin-bottom:10px" />
            </div>
            <div v-else-if="myRefunds.length" class="refund-list">
              <div v-for="r in myRefunds" :key="r.id" class="vr-card">
                <div class="vr-info">
                  <div class="vr-title">{{ refundCourseTitle(r) }}</div>
                  <div class="vr-meta">환불요청 #{{ r.id }} · 결제 #{{ r.paymentId }} · {{ r.reason || '사유 미기재' }}</div>
                </div>
                <div class="vr-right">
                  <span class="status-badge" :class="r.status === 'APPROVED' ? 'status-active' : (r.status === 'REJECTED' ? 'status-inactive' : 'status-pending')">{{ refundStatusLabel[r.status] || r.status }}</span>
                  <div v-if="r.status === 'REQUESTED'" class="vr-actions">
                    <button class="btn btn-primary btn-sm" :disabled="refundActing === r.id" @click="actRefund(r.id, 'approve')">승인</button>
                    <button class="btn btn-outline btn-sm" :disabled="refundActing === r.id" @click="actRefund(r.id, 'reject')">반려</button>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="empty-text" style="padding:24px 0">접수된 환불 요청이 없습니다.</p>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import AppSidebar from '@/components/AppSidebar.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import CourseCard from '@/components/CourseCard.vue'
import { coursePhoto } from '@/utils/coursePhoto.js'
import { useAuthStore } from '@/store/auth.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'
import { paymentApi } from '@/api/payment.js'
import AppSkeleton from '@/components/AppSkeleton.vue'

const router = useRouter()
const auth = useAuthStore()

const route = useRoute()
const vtab = computed(() => route.query.tab || 'products')
const isInstructor = computed(() => ['VENDOR', 'INSTRUCTOR'].includes(auth.user?.role))
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const roleLabel = computed(() => isAdmin.value ? '운영자' : (isInstructor.value ? '웨딩업체' : '예비부부'))
const roleBadgeClass = computed(() => isAdmin.value ? 'badge-ink' : (isInstructor.value ? 'badge-amber' : 'badge-blue'))

// 내 정보 변경 (데모: 클라이언트 반영 — 백엔드 회원수정 API 연동은 다음 단계)
const editing = ref(false)
const editName = ref('')
function startEdit() {
  editName.value = auth.user?.name || ''
  editing.value = true
}
function saveProfile() {
  const name = editName.value.trim()
  if (name) auth.setUser({ ...auth.user, name })
  editing.value = false
}

/* 학생용 */
const recommendations = ref([])
const recommendLoading = ref(true)
const recommendError = ref('')
const recommendMessage = ref('')

/* 강사용 */
const myCourses = ref([])
const instructorLoading = ref(true)
const myRefunds = ref([])
const refundLoading = ref(false)
const refundActing = ref(null)
const instructorError = ref('')

const totalEnrollmentCount = computed(() =>
  myCourses.value.reduce((sum, course) => {
    const count = Number(course.enrollment_count ?? course.enrollmentCount ?? 0)
    return sum + (Number.isNaN(count) ? 0 : count)
  }, 0)
)

function handleLogout() {
  auth.logout()
  router.push('/')
}

function formatPrice(price) {
  const value = Number(price ?? 0)
  if (Number.isNaN(value)) return '-'
  return `${value.toLocaleString()}원`
}

/**
 * course 객체에서 강사 식별자 추출
 */
function getCourseInstructorId(course) {
  return (
    course.vendorId ?? course.instructorId ??
    course.instructor_id ??
    course.instructor ??
    course.teacherId ??
    course.teacher_id ??
    null
  )
}

async function loadStudentRecommendations() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] auth.user is missing')
      recommendError.value = '추천 강의를 준비 중입니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] auth.user.id is missing:', auth.user)
      recommendError.value = '추천 강의를 준비 중입니다.'
      return
    }

    const res = await enrollmentApi.getRecommendations(auth.user.id)
    console.log('[MyPage] recommendation response:', res.data)

    const payload = res.data

    if (Array.isArray(payload?.recommendedCourses)) {
      recommendations.value = payload.recommendedCourses
      recommendMessage.value = payload.message ?? ''
    } else if (Array.isArray(payload?.data)) {
      recommendations.value = payload.data
      recommendMessage.value = payload.message ?? ''
    } else if (Array.isArray(payload)) {
      recommendations.value = payload
      recommendMessage.value = ''
    } else {
      console.warn('[MyPage] unexpected recommendation response shape:', payload)
      recommendations.value = []
      recommendMessage.value = ''
    }
  } catch (error) {
    console.error('[MyPage] failed to load recommendations:', error)
    recommendError.value = '현재 추천 강의를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    recommendLoading.value = false
  }
}

async function loadInstructorCourses() {
  try {
    if (!auth.user) {
      console.warn('[MyPage] instructor auth.user is missing')
      instructorError.value = '강좌 정보를 불러오지 못했습니다.'
      return
    }

    if (!auth.user.id) {
      console.warn('[MyPage] instructor auth.user.id is missing:', auth.user)
      instructorError.value = '강좌 정보를 불러오지 못했습니다.'
      return
    }

    const res = await courseApi.getCourses()
    console.log('[MyPage] course list response:', res.data)

    let courses = []

    if (Array.isArray(res.data?.data)) {
      courses = res.data.data
    } else if (Array.isArray(res.data)) {
      courses = res.data
    } else {
      console.warn('[MyPage] unexpected course response shape:', res.data)
    }

    console.log('[MyPage] auth.user =', auth.user)
    console.log('[MyPage] courses =', courses)
    console.log('[MyPage] first course =', courses[0])

    courses.forEach(course => {
      console.log('[MyPage] instructor fields check:', {
        courseId: course.id,
        instructorId: course.vendorId ?? course.instructorId,
        instructor_id: course.instructor_id,
        instructor: course.instructor,
        teacherId: course.teacherId,
        teacher_id: course.teacher_id,
        rawCourse: course
      })
    })

    const instructorId = Number(auth.user.id)

    myCourses.value = courses.filter(course => {
      const courseInstructorId = Number(getCourseInstructorId(course))
      return !Number.isNaN(courseInstructorId) && courseInstructorId === instructorId
    })

    console.log('[MyPage] filtered myCourses =', myCourses.value)
  } catch (error) {
    console.error('[MyPage] failed to load instructor courses:', error)
    instructorError.value = '현재 강좌 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    instructorLoading.value = false
  }
}

// 업체 self-환불: 전체 환불 요청 → 결제로 courseId 조회 → 내 상품 것만 필터
async function loadVendorRefunds() {
  refundLoading.value = true
  try {
    const myIds = new Set(myCourses.value.map(c => Number(c.id)))
    const res = await paymentApi.getRefundRequests()
    const all = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
    const enriched = await Promise.all(all.map(async r => {
      try {
        const pr = await paymentApi.getPayment(r.paymentId)
        const pd = pr.data?.data ?? pr.data
        return { ...r, courseId: pd?.courseId ?? pd?.course_id }
      } catch { return { ...r, courseId: null } }
    }))
    myRefunds.value = enriched.filter(r => r.courseId && myIds.has(Number(r.courseId)))
  } catch (e) {
    console.warn('[MyPage] vendor refunds load failed:', e)
  } finally {
    refundLoading.value = false
  }
}
async function actRefund(id, action) {
  refundActing.value = id
  try {
    if (action === 'approve') await paymentApi.approveRefund(id)
    else await paymentApi.rejectRefund(id)
    await loadVendorRefunds()
  } catch (e) {
    alert(e.response?.data?.message || '처리에 실패했습니다.')
  } finally {
    refundActing.value = null
  }
}
function refundCourseTitle(r) {
  const c = myCourses.value.find(c => Number(c.id) === Number(r.courseId))
  return c?.title || `상품 #${r.courseId}`
}
const refundStatusLabel = { REQUESTED: '승인 대기', APPROVED: '환불 완료', REJECTED: '반려됨' }

onMounted(async () => {
  if (isInstructor.value) {
    recommendLoading.value = false
    await loadInstructorCourses()
    await loadVendorRefunds()
  } else {
    instructorLoading.value = false
    await loadStudentRecommendations()
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
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-sm);
}
.profile-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.profile-edit-input {
  font-size: 20px; font-weight: 700; padding: 6px 12px;
  border: 1.5px solid var(--color-border); border-radius: 8px; width: 220px;
  font-family: var(--font-display); color: var(--color-text-primary);
  margin-bottom: 6px;
}
.profile-edit-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }

.vendor-tab-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.vt-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--color-text-primary); }
.refund-note { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px; background: var(--color-bg-tertiary); padding: 12px 15px; border-radius: 10px; line-height: 1.5; }
.vendor-refunds { margin-top: 4px; }
.refund-list { display: flex; flex-direction: column; gap: 10px; }
.vr-card { display: flex; align-items: center; justify-content: space-between; gap: 14px; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 15px 18px; }
.vr-title { font-size: 14.5px; font-weight: 600; color: var(--color-text-primary); }
.vr-meta { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }
.vr-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.vr-actions { display: flex; gap: 6px; }
.status-pending { background: var(--color-warning-light); color: var(--color-warning); }

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
}

.profile-email {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-ink { background: #111; color: #fff; }
.badge-blue {
  background: #e8f1ff;
  color: #2563eb;
}

.badge-amber {
  background: #f7edd8;
  color: #9a6700;
}

.section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
}

.section-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
}

.recommend-message {
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.loading-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.instructor-loading {
  margin-bottom: 20px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.skeleton-thumb {
  height: 110px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-line.short {
  width: 40%;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 220px));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.instructor-course-list {
  display: grid;
  gap: 18px;
}

.instructor-course-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow-sm);
}
.ic-thumb {
  position: relative;
  height: 140px;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 16px;
  background: linear-gradient(140deg, #f1efe8, #fff);
}
.ic-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ic-cat {
  position: absolute; left: 12px; bottom: 12px;
  font-size: 11px; font-weight: 700; color: #fff;
  background: rgba(20, 20, 24, 0.55); backdrop-filter: blur(4px);
  padding: 4px 11px; border-radius: 999px;
}

.course-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.course-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.course-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  white-space: pre-line;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #eaf8ef;
  color: #0f8a3b;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.course-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.meta-box {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 14px;
}

.meta-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.meta-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.course-card-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: var(--transition);
}

.action-primary {
  background: var(--color-primary);
  color: white;
}

.action-primary:hover {
  opacity: 0.92;
}

.empty-text {
  color: var(--color-text-muted);
  font-size: 14px;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 992px) {
  .page-layout {
    grid-template-columns: 1fr;
  }

  .recommend-grid,
  .loading-row,
  .course-meta-grid {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .profile-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-card-top {
    flex-direction: column;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
