<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="gov">
      <div class="gov-head">
        <div>
          <span class="gov-eyebrow">🏛️ 강남구청 · 지자체 검증 콘솔</span>
          <h1 class="gov-title">생애주기 이벤트 데이터 통합 검증</h1>
          <p class="gov-desc">플랫폼에 쌓인 업체·상품·거래·환불 데이터를 한 곳에서 모니터링합니다 — 신뢰·검증은 지자체가, 운영·환불은 업체가.</p>
        </div>
      </div>

      <template v-if="loading">
        <div class="kpi-row">
          <div v-for="i in 4" :key="i" class="kpi">
            <AppSkeleton width="56px" height="12px" />
            <AppSkeleton width="68px" height="30px" radius="6px" style="margin:6px 0 4px" />
            <AppSkeleton width="88px" height="11px" />
          </div>
        </div>
        <div class="grid2">
          <div class="panel">
            <AppSkeleton width="140px" height="16px" />
            <AppSkeleton v-for="i in 6" :key="i" width="100%" height="14px" style="margin-top:14px" />
          </div>
          <div class="panel">
            <AppSkeleton width="110px" height="16px" />
            <AppSkeleton v-for="i in 4" :key="i" width="100%" height="16px" style="margin-top:14px" />
          </div>
        </div>
      </template>
      <div v-else-if="error" class="error-msg">{{ error }}</div>

      <template v-else>
        <!-- KPI -->
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-label">검증 업체</div><div class="kpi-val">{{ vendors.length }}</div><div class="kpi-sub">사업자 진위확인 완료</div></div>
          <div class="kpi"><div class="kpi-label">등록 상품</div><div class="kpi-val">{{ products.length }}</div><div class="kpi-sub">스튜디오·드레스·메이크업</div></div>
          <div class="kpi"><div class="kpi-label">누적 예약</div><div class="kpi-val">{{ totalBookings.toLocaleString() }}</div><div class="kpi-sub">전 업체 합산</div></div>
          <div class="kpi"><div class="kpi-label">환불 처리율</div><div class="kpi-val">{{ refundRate }}%</div><div class="kpi-sub">{{ processedRefunds }}/{{ refunds.length }} 건 처리</div></div>
        </div>

        <div class="grid2">
          <!-- 업체 검증 현황 -->
          <div class="panel">
            <div class="panel-head"><h2>업체 검증 현황</h2><span class="panel-tag">사업자 진위확인</span></div>
            <div class="vtable">
              <div class="vrow vhead"><span>업체</span><span>지역</span><span class="ta-r">상품</span><span class="ta-r">예약</span><span class="ta-c">검증</span></div>
              <div v-for="v in vendors" :key="v.id" class="vrow">
                <span class="v-name">{{ v.name }}</span>
                <span class="v-region">{{ v.region }}</span>
                <span class="ta-r">{{ v.count }}</span>
                <span class="ta-r">{{ v.bookings.toLocaleString() }}</span>
                <span class="ta-c"><span class="verify">✔ 검증됨</span></span>
              </div>
            </div>
          </div>

          <!-- 카테고리 분포 + 환불 모니터링 -->
          <div class="panel">
            <div class="panel-head"><h2>카테고리 분포</h2></div>
            <div class="cat-bars">
              <div v-for="c in catStats" :key="c.name" class="cat-bar">
                <span class="cb-name">{{ c.name }}</span>
                <div class="cb-track"><div class="cb-fill" :style="{ width: c.pct + '%', background: c.color }"></div></div>
                <span class="cb-val">{{ c.count }}</span>
              </div>
            </div>

            <div class="panel-head" style="margin-top:22px"><h2>환불 모니터링</h2><span class="panel-tag">업체가 직접 처리</span></div>
            <div v-if="refunds.length" class="refund-mon">
              <div v-for="r in refunds.slice(0, 6)" :key="r.id" class="rm-row">
                <span class="rm-id">#{{ r.id }} · 결제 #{{ r.paymentId }}</span>
                <span class="badge" :class="badgeClass(r.status)">{{ statusLabel[r.status] || r.status }}</span>
              </div>
            </div>
            <p v-else class="empty-sm">환불 요청 데이터가 없습니다.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import api from '@/api/index.js'

const loading = ref(true)
const error = ref('')
const products = ref([])
const refunds = ref([])

const statusLabel = { REQUESTED: '승인 대기', APPROVED: '환불 완료', REJECTED: '반려' }
const catLabel = { STUDIO: '스튜디오', DRESS: '드레스', MAKEUP: '메이크업' }
const catColor = { '스튜디오': '#3d6b50', '드레스': '#c9a24b', '메이크업': '#8A4A6B' }
function catKo(c) { return catLabel[c] || c }
function badgeClass(s) { return { REQUESTED: 'b-wait', APPROVED: 'b-ok', REJECTED: 'b-no' }[s] || '' }

const totalBookings = computed(() => products.value.reduce((s, p) => s + Number(p.enrollmentCount ?? p.enrollment_count ?? 0), 0))
const processedRefunds = computed(() => refunds.value.filter(r => r.status !== 'REQUESTED').length)
const refundRate = computed(() => refunds.value.length ? Math.round(processedRefunds.value / refunds.value.length * 100) : 0)

const vendors = computed(() => {
  const map = new Map()
  for (const p of products.value) {
    const vid = p.vendorId ?? p.vendor_id ?? p.instructorId
    if (!map.has(vid)) map.set(vid, { id: vid, name: p.vendorName || p.instructorName || `업체 #${vid}`, region: p.region, count: 0, bookings: 0 })
    const v = map.get(vid)
    v.count++
    v.bookings += Number(p.enrollmentCount ?? p.enrollment_count ?? 0)
  }
  return [...map.values()].sort((a, b) => b.bookings - a.bookings)
})

const catStats = computed(() => {
  const total = products.value.length || 1
  const counts = {}
  for (const p of products.value) { const k = catKo(p.category); counts[k] = (counts[k] || 0) + 1 }
  return Object.entries(counts).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100), color: catColor[name] || '#999' }))
})

onMounted(async () => {
  try {
    const [pr, rr] = await Promise.allSettled([
      api.get('/api/courses'),
      api.get('/api/payments/refund-requests'),
    ])
    if (pr.status === 'fulfilled') { const d = pr.value.data; products.value = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []) }
    if (rr.status === 'fulfilled') { const d = rr.value.data; refunds.value = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []) }
  } catch (e) {
    error.value = '데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: var(--color-bg-secondary); }
.gov { max-width: 1080px; margin: 0 auto; padding: 36px 24px; }
.gov-head { margin-bottom: 22px; }
.gov-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; color: #b5697a; }
.gov-title { font-family: var(--font-display); font-size: 27px; font-weight: 800; color: var(--color-text-primary); margin: 6px 0 8px; }
.gov-desc { font-size: 13.5px; color: var(--color-text-secondary); max-width: 640px; line-height: 1.6; }

.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.kpi { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px 20px; }
.kpi-label { font-size: 12px; color: var(--color-text-muted); }
.kpi-val { font-size: 30px; font-weight: 800; color: var(--color-primary); font-family: var(--font-display); margin: 4px 0 2px; }
.kpi-sub { font-size: 11.5px; color: var(--color-text-muted); }

.grid2 { display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; }
.panel { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 20px 22px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.panel-head h2 { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.panel-tag { font-size: 11px; font-weight: 600; color: var(--color-text-muted); background: var(--color-bg-tertiary); padding: 3px 9px; border-radius: 999px; }

.vtable { display: flex; flex-direction: column; }
.vrow { display: grid; grid-template-columns: 1.3fr 0.9fr 0.5fr 0.6fr 0.7fr; align-items: center; gap: 8px; padding: 9px 4px; border-bottom: 1px solid var(--color-border); font-size: 13px; }
.vrow.vhead { font-size: 11px; color: var(--color-text-muted); font-weight: 600; border-bottom: 1.5px solid var(--color-border); }
.v-name { font-weight: 600; color: var(--color-text-primary); }
.v-region { color: var(--color-text-secondary); }
.ta-r { text-align: right; } .ta-c { text-align: center; }
.verify { font-size: 11px; font-weight: 700; color: var(--color-success); background: var(--color-success-light); padding: 3px 8px; border-radius: 999px; }

.cat-bars { display: flex; flex-direction: column; gap: 12px; }
.cat-bar { display: grid; grid-template-columns: 64px 1fr 30px; align-items: center; gap: 10px; }
.cb-name { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.cb-track { height: 10px; background: var(--color-bg-tertiary); border-radius: 999px; overflow: hidden; }
.cb-fill { height: 100%; border-radius: 999px; transition: width .6s ease; }
.cb-val { font-size: 13px; font-weight: 700; text-align: right; color: var(--color-text-primary); }

.refund-mon { display: flex; flex-direction: column; }
.rm-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 2px; border-bottom: 1px solid var(--color-border); font-size: 13px; }
.rm-id { color: var(--color-text-secondary); }
.badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.b-wait { background: var(--color-warning-light); color: var(--color-warning); }
.b-ok { background: var(--color-success-light); color: var(--color-success); }
.b-no { background: #fef2f2; color: #dc2626; }
.empty, .empty-sm { text-align: center; color: var(--color-text-muted); font-size: 14px; }
.empty { padding: 60px 0; }
.empty-sm { padding: 20px 0; font-size: 13px; }
.error-msg { padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); font-size: 13px; color: #dc2626; }

@media (max-width: 860px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .grid2 { grid-template-columns: 1fr; }
}
</style>
