<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="onboarding">
      <div class="ob-card fade-in-up">
        <h1 class="ob-title">우리 결혼, 예산부터 정해볼까요?</h1>
        <p class="ob-desc">식장을 제외한 웨딩 총예산을 알려주시면, AI가 예산 안에서 조합을 설계합니다.</p>

        <div class="ai-note">
          <div class="ai-note-title">AI는 이렇게 추천합니다</div>
          <div class="ai-note-row"><b>1</b> 실제 등록된 강남구 업체 상품만 후보로 씁니다 — 없는 상품·가격을 만들지 않습니다</div>
          <div class="ai-note-row"><b>2</b> 예산 초과 조합은 먼저 제외하고, 스타일·우선순위·지역·인기를 점수로 계산합니다</div>
          <div class="ai-note-row"><b>3</b> 스·드·메 1개씩 묶은 조합 3개를 총액·잔액·추천 이유와 함께 보여드립니다</div>
        </div>

        <!-- 1. 총예산 -->
        <div class="ob-section">
          <div class="ob-label">1. 웨딩 총예산 <span class="ob-hint">(식장 제외)</span></div>
          <div class="budget-input">
            <input v-model.number="form.totalBudget" type="number" step="100000" min="0" class="form-input" placeholder="3000000" />
            <span class="budget-unit">원</span>
          </div>
          <div class="budget-chips">
            <button v-for="b in budgetPresets" :key="b" type="button" class="chip" :class="{ active: form.totalBudget === b }" @click="form.totalBudget = b">
              {{ (b / 10000).toLocaleString() }}만원
            </button>
          </div>
        </div>

        <!-- 2. 우선순위 -->
        <div class="ob-section">
          <div class="ob-label">2. 어디에 더 투자할까요? <span class="ob-hint">(누르는 순서 = 우선순위)</span></div>
          <div class="prio-row">
            <button v-for="c in ['STUDIO','DRESS','MAKEUP']" :key="c" type="button" class="prio-btn" :class="{ active: form.priority.includes(c) }" @click="togglePriority(c)">
              <span class="prio-rank" v-if="form.priority.includes(c)">{{ form.priority.indexOf(c) + 1 }}순위</span>
              <span class="prio-name">{{ catLabel[c] }}</span>
            </button>
          </div>
        </div>

        <!-- 3. 스타일 -->
        <div class="ob-section">
          <div class="ob-label">3. 원하는 분위기 <span class="ob-hint">(선택)</span></div>
          <div v-for="c in ['STUDIO','DRESS','MAKEUP']" :key="c" class="style-row">
            <span class="style-cat">{{ catLabel[c] }}</span>
            <button v-for="st in styleOptions[c]" :key="st" type="button" class="chip" :class="{ active: form.styleTags[c] === st }" @click="form.styleTags[c] = form.styleTags[c] === st ? '' : st">
              {{ st }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>
        <button class="btn btn-primary btn-full" :disabled="loading" @click="submit">
          <span v-if="loading">AI가 조합을 설계하는 중...</span>
          <span v-else>예산 안에서 조합 추천받기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const catLabel = { STUDIO: '스튜디오', DRESS: '드레스', MAKEUP: '메이크업' }
const budgetPresets = [2000000, 3000000, 5000000]
const styleOptions = {
  STUDIO: ['클래식', '내추럴', '시네마틱'],
  DRESS: ['클래식', '미니멀', '로맨틱'],
  MAKEUP: ['내추럴', '글램', '클린']
}

const form = reactive({
  totalBudget: 3000000,
  priority: ['DRESS', 'STUDIO', 'MAKEUP'],
  styleTags: { STUDIO: '', DRESS: '', MAKEUP: '' }
})

function togglePriority(c) {
  const i = form.priority.indexOf(c)
  if (i >= 0) form.priority.splice(i, 1)
  else form.priority.push(c)
}

function submit() {
  error.value = ''
  if (!form.totalBudget || form.totalBudget < 100000) {
    error.value = '총예산을 10만원 이상 입력해 주세요.'
    return
  }
  if (form.priority.length !== 3) {
    error.value = '세 카테고리의 우선순위를 모두 선택해 주세요.'
    return
  }
  sessionStorage.setItem('onboarding', JSON.stringify({
    totalBudget: form.totalBudget,
    priority: [...form.priority],
    styleTags: { ...form.styleTags }
  }))
  router.push('/recommendations')
}
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: var(--color-bg-secondary); }
.onboarding { max-width: 680px; margin: 0 auto; padding: 48px 24px; }
.ob-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 36px;
  display: flex; flex-direction: column; gap: 26px;
}
.ob-title { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--color-primary); }
.ob-desc { font-size: 14px; color: var(--color-text-secondary); margin-top: -14px; }
.ai-note {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px 18px;
  display: flex; flex-direction: column; gap: 8px;
}
.ai-note-title { font-size: 13px; font-weight: 700; color: var(--color-accent-deep); }
.ai-note-row { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
.ai-note-row b { color: var(--color-text-primary); margin-right: 6px; }
.ob-section { display: flex; flex-direction: column; gap: 12px; }
.ob-label { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.ob-hint { font-size: 12px; font-weight: 400; color: var(--color-text-muted); }
.budget-input { display: flex; align-items: center; gap: 10px; }
.form-input {
  flex: 1; padding: 12px 14px; font-size: 16px; font-weight: 600;
  border: 1.5px solid var(--color-border); border-radius: var(--radius-md);
  color: var(--color-text-primary); background: var(--color-bg-primary); outline: none;
  font-family: var(--font-sans); transition: var(--transition);
}
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.budget-unit { font-size: 15px; color: var(--color-text-secondary); }
.budget-chips, .style-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.style-cat { width: 64px; font-size: 13px; color: var(--color-text-secondary); }
.chip {
  padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
  border: 1.5px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-secondary); transition: var(--transition);
}
.chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.chip.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.prio-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.prio-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 16px 10px; border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border); background: var(--color-bg-primary);
  transition: var(--transition);
}
.prio-btn.active { border-color: var(--color-primary); background: var(--color-primary-light); box-shadow: 0 0 0 1px var(--color-primary); }
.prio-rank { font-size: 11px; font-weight: 700; color: var(--color-accent-deep); }
.prio-name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); }
.btn-full { width: 100%; padding: 14px; font-size: 15px; justify-content: center; }
.error-msg {
  padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: var(--radius-md); font-size: 13px; color: #dc2626;
}
</style>
