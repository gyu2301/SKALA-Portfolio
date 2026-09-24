<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="reco">
      <div class="reco-head">
        <div>
          <h1 class="reco-title">AI 조합 추천</h1>
          <p class="reco-desc" v-if="input">
            총예산 <b>₩{{ input.totalBudget.toLocaleString() }}</b> · 우선순위 {{ input.priority.map(c => catLabel[c]).join(' > ') }}
          </p>
        </div>
        <router-link to="/onboarding" class="btn btn-outline">조건 다시 입력</router-link>
      </div>

      <div v-if="loading" class="combo-list">
        <div v-for="i in 2" :key="i" class="combo-card">
          <div class="combo-head"><AppSkeleton width="110px" height="22px" /><AppSkeleton width="150px" height="26px" /></div>
          <div class="combo-items">
            <div v-for="j in 3" :key="j" class="combo-item" style="border-color:transparent">
              <AppSkeleton width="18px" height="18px" radius="5px" />
              <AppSkeleton width="55%" height="16px" />
              <AppSkeleton width="80px" height="16px" />
              <AppSkeleton width="72px" height="32px" radius="8px" />
            </div>
          </div>
          <AppSkeleton width="90%" height="14px" />
        </div>
      </div>
      <div v-else-if="error" class="error-msg">{{ error }}</div>

      <div v-else class="combo-list">
        <div v-for="(combo, i) in combos" :key="i" class="combo-card fade-in-up" :class="{ best: i === 0 }">
          <div class="combo-head">
            <span class="combo-rank">{{ i === 0 ? '베스트 조합' : `조합 ${i + 1}` }}</span>
            <div class="combo-price">
              <span class="total">₩{{ Number(combo.totalPrice).toLocaleString() }}</span>
              <span class="remain" v-if="combo.remainingBudget >= 0">예산 잔액 ₩{{ Number(combo.remainingBudget).toLocaleString() }}</span>
              <span class="remain over" v-else>예산 ₩{{ Number(-combo.remainingBudget).toLocaleString() }} 초과 — 가장 근접한 조합</span>
            </div>
          </div>

          <div class="combo-items">
            <div v-for="item in combo.items" :key="item.id" class="combo-item" :class="{ checked: selected.includes(item.id) }">
              <label class="ci-check">
                <input type="checkbox" :value="item.id" v-model="selected" />
                <span class="ci-box"></span>
              </label>
              <router-link :to="`/courses/${item.id}`" class="ci-main">
                <span class="ci-cat">{{ catLabel[item.category] || item.category }}</span>
                <span class="ci-title">{{ item.title }}</span>
                <span class="ci-meta">{{ item.region }}<template v-if="item.style"> · {{ item.style }}</template></span>
              </router-link>
              <span class="ci-price">₩{{ Number(item.price).toLocaleString() }}</span>
              <button class="ci-pay" :disabled="paying" @click="pay([item])">개별 결제</button>
            </div>
          </div>

          <p class="combo-reason">{{ combo.reason }}</p>

          <div class="combo-actions">
            <button class="btn btn-outline" :disabled="paying || !selectedIn(combo).length" @click="pay(selectedIn(combo))">
              선택 결제 ({{ selectedIn(combo).length }})
            </button>
            <button class="btn btn-primary combo-pay-all" :disabled="paying" @click="pay(combo.items)">
              전체 결제 · ₩{{ Number(combo.totalPrice).toLocaleString() }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <PaymentSuccess
      v-if="showSuccess"
      :subtitle="successSubtitle"
      @close="showSuccess = false"
      @go="router.push('/enrollments')"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import PaymentSuccess from '@/components/PaymentSuccess.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'
import api from '@/api/index.js'
import { enrollmentApi } from '@/api/enrollment.js'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const combos = ref([])
const input = ref(null)

const selected = ref([])
const paying = ref(false)
const showSuccess = ref(false)
const successSubtitle = ref('')

const catLabel = { STUDIO: '스튜디오', DRESS: '드레스', MAKEUP: '메이크업' }

function selectedIn(combo) {
  return combo.items.filter(it => selected.value.includes(it.id))
}

async function pay(items) {
  if (!items.length || paying.value) return
  paying.value = true
  error.value = ''
  try {
    // 각 상품 예약 신청 → 백엔드가 결제·Kafka로 자동 승인(PENDING→ACTIVE)
    for (const it of items) {
      await enrollmentApi.enroll(it.id)
    }
    const sum = items.reduce((s, x) => s + Number(x.price), 0)
    successSubtitle.value = `${items.length}개 상품 · ₩${sum.toLocaleString()} 결제가 승인되었습니다.`
    selected.value = selected.value.filter(id => !items.some(it => it.id === id))
    showSuccess.value = true
  } catch (e) {
    console.error('[Recommend] 결제 실패:', e)
    error.value = e.response?.data?.message || '결제에 실패했습니다. 이미 예약한 상품일 수 있어요.'
  } finally {
    paying.value = false
  }
}

onMounted(async () => {
  const saved = sessionStorage.getItem('onboarding')
  if (!saved) {
    router.replace('/onboarding')
    return
  }
  input.value = JSON.parse(saved)
  try {
    const res = await api.post('/api/recommend/wedding', input.value)
    const data = res.data?.data ?? res.data
    combos.value = data?.combinations ?? data?.combos ?? (Array.isArray(data) ? data : [])
    if (!combos.value.length) error.value = data?.message || '조건에 맞는 조합을 찾지 못했습니다. 예산을 조정해 보세요.'
  } catch (e) {
    console.error('[Recommend] 실패:', e)
    error.value = e.response?.data?.message || '추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: var(--color-bg-secondary); }
.reco { max-width: 860px; margin: 0 auto; padding: 40px 24px; }
.reco-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
.reco-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--color-primary); }
.reco-desc { margin-top: 8px; font-size: 14px; color: var(--color-text-secondary); }
.reco-loading { text-align: center; padding: 80px 0; color: var(--color-text-muted); font-size: 15px; }
.combo-list { display: flex; flex-direction: column; gap: 20px; }
.combo-card {
  background: var(--color-bg-primary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
}
.combo-card.best { border-color: var(--color-accent-deep); box-shadow: 0 0 0 1px var(--color-accent-deep); }
.combo-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.combo-rank { font-size: 15px; font-weight: 700; color: var(--color-accent-deep); }
.combo-card.best .combo-rank { background: var(--color-accent); color: #6b5a2e; padding: 4px 12px; border-radius: 999px; }
.combo-price { display: flex; align-items: baseline; gap: 12px; }
.total { font-size: 22px; font-weight: 700; color: var(--color-primary); }
.remain { font-size: 13px; color: var(--color-success); font-weight: 500; }
.remain.over { color: var(--color-danger); }

.combo-items { display: flex; flex-direction: column; gap: 8px; }
.combo-item {
  display: grid; grid-template-columns: 24px 1fr auto auto; align-items: center; gap: 14px;
  padding: 12px 14px; background: var(--color-bg-secondary);
  border-radius: var(--radius-md); transition: var(--transition);
  border: 1.5px solid transparent;
}
.combo-item.checked { border-color: var(--color-primary); background: var(--color-primary-light); }
.ci-check { display: flex; align-items: center; cursor: pointer; }
.ci-check input { position: absolute; opacity: 0; width: 0; height: 0; }
.ci-box { width: 18px; height: 18px; border: 1.8px solid var(--color-border-hover); border-radius: 5px; transition: var(--transition); position: relative; }
.ci-check input:checked + .ci-box { background: var(--color-primary); border-color: var(--color-primary); }
.ci-check input:checked + .ci-box::after { content: ''; position: absolute; left: 5px; top: 1.5px; width: 5px; height: 9px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.ci-main { display: flex; align-items: center; gap: 10px; min-width: 0; text-decoration: none; }
.ci-cat { font-size: 12px; font-weight: 700; color: var(--color-primary); flex-shrink: 0; }
.ci-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-meta { font-size: 12px; color: var(--color-text-muted); flex-shrink: 0; }
.ci-price { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
.ci-pay {
  font-size: 12.5px; font-weight: 600; padding: 7px 12px; border-radius: var(--radius-md);
  background: #fff; border: 1.5px solid var(--color-primary); color: var(--color-primary);
  cursor: pointer; transition: var(--transition); white-space: nowrap;
}
.ci-pay:hover:not(:disabled) { background: var(--color-primary); color: #fff; }
.ci-pay:disabled { opacity: .5; cursor: default; }

.combo-reason { font-size: 13.5px; color: var(--color-text-secondary); line-height: 1.6; border-top: 1px solid var(--color-border); padding-top: 12px; }
.combo-actions { display: flex; gap: 10px; justify-content: flex-end; }
.combo-pay-all { font-weight: 700; }
.error-msg {
  padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: var(--radius-md); font-size: 14px; color: #dc2626;
}
</style>
