<template>
  <div class="login-page">
    <div class="login-layout">
      <!-- 좌측 브랜딩 -->
      <div class="login-left">
        <router-link to="/" class="brand">
          <svg width="34" height="34" viewBox="0 0 30 30" fill="none">
            <circle cx="12" cy="17" r="8" stroke="#d4a017" stroke-width="2"/>
            <circle cx="19" cy="13" r="8" stroke="#fff" stroke-width="2"/>
          </svg>
          <span class="brand-name">EventFIT</span>
        </router-link>
        <div class="brand-content">
          <h2 class="brand-h2">당신의 <span class="hl">생애주기 전체</span>를<br>EventFIT이 책임집니다</h2>
          <p class="brand-p">결혼부터 장례까지, 인생의 큰 이벤트를 예산 안에서 가장 알맞게.</p>
          <div class="lc-strip">
            <div
              v-for="(ev, i) in lifecycle"
              :key="ev.name"
              class="lc-card"
              :class="{ glow: eventIdx === i, live: ev.live }"
            >
              <span class="lc-ic">{{ ev.icon }}</span>
              <div class="lc-body">
                <span class="lc-name">{{ ev.name }}</span>
                <span class="lc-svc">{{ ev.svc }}</span>
              </div>
              <span class="lc-tag" :class="{ now: ev.live }">{{ ev.tag }}</span>
            </div>
          </div>
        </div>
        <div class="brand-foot">서울 강남구 — 청담 · 신사 · 삼성 · 선릉</div>
      </div>

      <!-- 우측 -->
      <div class="login-right">
        <div class="login-box fade-in-up">
          <router-link to="/" class="back-link">← 홈으로</router-link>

          <!-- 로그인 -->
          <div v-if="!showRegister" class="section">
            <h3 class="section-title">로그인</h3>

            <div class="role-tabs role-tabs-3" role="tablist">
              <button type="button" class="role-tab" :class="{ active: loginRole === 'CUSTOMER' }" @click="setLoginRole('CUSTOMER')">
                <span class="role-tab-title">개인</span>
                <span class="role-tab-desc">예비부부</span>
              </button>
              <button type="button" class="role-tab" :class="{ active: loginRole === 'VENDOR' }" @click="setLoginRole('VENDOR')">
                <span class="role-tab-title">기업</span>
                <span class="role-tab-desc">웨딩업체</span>
              </button>
              <button type="button" class="role-tab" :class="{ active: loginRole === 'ADMIN' }" @click="setLoginRole('ADMIN')">
                <span class="role-tab-title">관리자</span>
                <span class="role-tab-desc">운영자</span>
              </button>
            </div>

            <form @submit.prevent="handleLogin" class="form login-reveal">
              <div class="form-group">
                <label class="form-label">이메일</label>
                <input v-model="loginForm.username" type="email" class="form-input" :placeholder="rolePlaceholder" autocomplete="username" required autofocus />
              </div>
              <div class="form-group">
                <label class="form-label">비밀번호</label>
                <input v-model="loginForm.password" type="password" class="form-input" placeholder="비밀번호" autocomplete="current-password" required />
              </div>
              <div v-if="loginError" class="error-msg">{{ loginError }}</div>
              <button type="submit" class="btn btn-primary btn-full" :disabled="loginLoading">
                <span v-if="loginLoading">로그인 중...</span>
                <span v-else>{{ roleLoginLabel }}</span>
              </button>
            </form>
            <div class="switch-link">
              계정이 없으신가요?
              <button class="text-btn" @click="showRegister = true">회원가입</button>
            </div>
          </div>

          <!-- 회원가입 (개인 / 기업 분기) -->
          <div v-else class="section">
            <h3 class="section-title">회원가입</h3>

            <div class="role-tabs" role="tablist">
              <button
                type="button"
                class="role-tab"
                :class="{ active: registerForm.role === 'CUSTOMER' }"
                @click="registerForm.role = 'CUSTOMER'"
              >
                <span class="role-tab-title">예비부부</span>
                <span class="role-tab-desc">상품 비교와 AI 추천</span>
              </button>
              <button
                type="button"
                class="role-tab"
                :class="{ active: registerForm.role === 'VENDOR' }"
                @click="registerForm.role = 'VENDOR'"
              >
                <span class="role-tab-title">웨딩업체</span>
                <span class="role-tab-desc">웨딩 상품 등록·판매</span>
              </button>
            </div>

            <form @submit.prevent="handleRegister" class="form">
              <div class="form-group">
                <label class="form-label">{{ isVendorForm ? '담당자 이름' : '이름' }}</label>
                <input v-model="registerForm.name" type="text" class="form-input" placeholder="홍길동" required />
              </div>
              <div class="form-group">
                <label class="form-label">이메일</label>
                <input v-model="registerForm.email" type="email" class="form-input" placeholder="user@example.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">비밀번호</label>
                <input v-model="registerForm.password" type="password" class="form-input" placeholder="8자 이상" required />
              </div>

              <template v-if="isVendorForm">
                <div class="form-group">
                  <label class="form-label">상호명</label>
                  <input v-model="registerForm.businessName" type="text" class="form-input" placeholder="예: 로이스튜디오" required />
                </div>
                <div class="form-group">
                  <label class="form-label">사업자등록번호</label>
                  <input v-model="registerForm.businessRegNo" type="text" class="form-input" placeholder="000-00-00000" required />
                  <p class="form-hint">국세청 진위확인 대상입니다. 등록번호는 화면에 노출되지 않습니다.</p>
                </div>
              </template>

              <div v-if="error" class="error-msg">{{ error }}</div>
              <div v-if="success" class="success-msg">{{ success }}</div>
              <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
                <span v-if="loading">가입 중...</span>
                <span v-else>{{ isVendorForm ? '웨딩업체로 가입' : '예비부부로 가입' }}</span>
              </button>
            </form>
            <div class="switch-link">
              이미 계정이 있으신가요?
              <button class="text-btn" @click="showRegister = false">로그인</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { authApi } from '@/api/auth.js'

// 이벤트별 라인드로잉 (결혼·출산·돌잔치·환갑·장례) — 위 롤링 단어와 함께 바뀜
const _svg = (inner) => `<svg viewBox="0 0 240 210" fill="none" stroke="#d4a017" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
const eventArt = [
  _svg('<ellipse cx="120" cy="142" rx="40" ry="40"/><path d="M103 74 h34 l-6 -14 h-22 Z"/><path d="M103 74 l17 26 17 -26"/><path d="M114 60 l-4 14 M126 60 l4 14 M120 74 v26" stroke-width="1.8"/>'),
  _svg('<path d="M88 160 c0 -33 14 -44 32 -44 s32 11 32 44 Z"/><circle cx="120" cy="84" r="30"/><path d="M118 54 q9 -6 2 -13 q-5 4 0 9"/><path d="M106 82 q5 5 10 0" stroke-width="2.2"/><path d="M124 82 q5 5 10 0" stroke-width="2.2"/><path d="M110 98 q10 8 20 0"/><circle cx="103" cy="94" r="3.5" fill="#d4a017" stroke="none"/><circle cx="137" cy="94" r="3.5" fill="#d4a017" stroke="none"/>'),
  _svg('<path d="M66 156 v-42 h108 v42"/><path d="M66 120 q13 12 27 0 t27 0 t27 0 t27 0"/><line x1="120" y1="112" x2="120" y2="86"/><path d="M120 86 q-9 -9 0 -18 q9 9 0 18 Z"/><line x1="56" y1="156" x2="184" y2="156"/>'),
  _svg('<path d="M74 134 a46 30 0 0 1 92 0"/><path d="M74 134 q46 15 92 0"/><path d="M120 106 l13 8 v15 l-13 8 -13 -8 v-15 Z"/><path d="M120 106 v-7 M108 114 l-14 -3 M132 114 l14 -3 M107 130 l-13 4 M133 130 l13 4"/><path d="M166 125 q17 0 19 -12 q-1 -8 -11 -7 q-9 1 -8 11"/><circle cx="179" cy="109" r="2" fill="#d4a017" stroke="none"/><path d="M88 142 l-5 15 M110 148 l-2 15 M132 148 l2 15 M152 142 l5 15"/><path d="M74 138 q-12 3 -14 12"/>'),
  _svg('<ellipse cx="120" cy="52" rx="7" ry="17"/><ellipse cx="120" cy="108" rx="7" ry="17"/><ellipse cx="92" cy="80" rx="17" ry="7"/><ellipse cx="148" cy="80" rx="17" ry="7"/><ellipse cx="100" cy="60" rx="7" ry="15" transform="rotate(-45 100 60)"/><ellipse cx="140" cy="60" rx="7" ry="15" transform="rotate(45 140 60)"/><ellipse cx="100" cy="100" rx="7" ry="15" transform="rotate(45 100 100)"/><ellipse cx="140" cy="100" rx="7" ry="15" transform="rotate(-45 140 100)"/><circle cx="120" cy="80" r="11"/><path d="M120 97 v58"/><path d="M120 128 q-22 -4 -30 12"/>'),
]

onMounted(() => {
  eventTimer = setInterval(() => { eventIdx.value = (eventIdx.value + 1) % events.length }, 1500)
})
onBeforeUnmount(() => { clearInterval(eventTimer) })

const auth = useAuthStore()
const router = useRouter()

const showRegister = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

// 인앱 로그인
const loginRole = ref('CUSTOMER') // 일반(CUSTOMER) / 기업(VENDOR) 로그인 탭
const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const loginLoading = ref(false)

const rolePlaceholder = computed(() => loginRole.value === 'VENDOR' ? 'company@sdm.kr' : (loginRole.value === 'ADMIN' ? 'admin@sdm.kr' : 'user@sdm.kr'))
const roleLoginLabel = computed(() => loginRole.value === 'VENDOR' ? '웨딩업체로 로그인' : (loginRole.value === 'ADMIN' ? '관리자 로그인' : '로그인'))
function setLoginRole(r) {
  loginRole.value = r
  if (r === 'ADMIN' && !loginForm.value.username) loginForm.value.username = 'admin@sdm.kr'
}

async function handleLogin() {
  loginError.value = ''
  loginLoading.value = true
  auth.logout(false) // 이전 로그인 상태(토큰·유저) 초기화 후 새로 로그인 — 계정 전환 시 잔류 방지
  try {
    await auth.login(loginForm.value.username.trim(), loginForm.value.password)
    // 선택한 탭과 실제 계정 역할이 다르면 로그인 거부
    const actual = auth.isAdmin ? 'ADMIN' : (auth.isVendor ? 'VENDOR' : 'CUSTOMER')
    if (actual !== loginRole.value) {
      const label = { CUSTOMER: '개인(예비부부)', VENDOR: '기업(웨딩업체)', ADMIN: '관리자(운영자)' }
      const tab = { CUSTOMER: '개인', VENDOR: '기업', ADMIN: '관리자' }
      auth.logout(false)
      loginError.value = `이 계정은 ${label[actual]} 계정입니다. "${tab[actual]}" 탭에서 로그인해 주세요.`
      return
    }
    // 역할별 진입 화면 분기
    if (auth.isAdmin) router.push('/admin/refunds')
    else if (auth.isVendor) router.push('/mypage')
    else router.push('/courses')
  } catch (e) {
    loginError.value = e.message || '로그인에 실패했습니다.'
  } finally {
    loginLoading.value = false
  }
}

const registerForm = ref({
  name: '', email: '', password: '',
  role: 'CUSTOMER', businessRegNo: '', businessName: ''
})

const isVendorForm = computed(() => registerForm.value.role === 'VENDOR')

// 생애주기 이벤트 (순차 글로우)
const events = ['결혼', '출산', '돌잔치', '환갑', '장례']
const lifecycle = [
  { icon: '💍', name: '결혼', svc: '스튜디오·드레스·메이크업', tag: '운영 중', live: true },
  { icon: '👶', name: '출산', svc: '산후조리·돌스냅', tag: '준비 중' },
  { icon: '🎂', name: '돌잔치', svc: '돌상·대여·촬영', tag: '준비 중' },
  { icon: '🎉', name: '환갑', svc: '연회·장소·기념', tag: '준비 중' },
  { icon: '🕊️', name: '장례', svc: '절차·비용 안내', tag: '준비 중' },
]
const eventIdx = ref(0)
let eventTimer = null

function handleOAuth() {
  auth.redirectToLogin()
}

async function handleRegister() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const payload = { ...registerForm.value }
    if (!isVendorForm.value) {
      delete payload.businessRegNo
      delete payload.businessName
    }
    await authApi.register(payload)
    success.value = '가입 완료! 로그인 화면으로 이동합니다.'
    registerForm.value = { name: '', email: '', password: '', role: 'CUSTOMER', businessRegNo: '', businessName: '' }
    setTimeout(() => {
      showRegister.value = false
      success.value = ''
    }, 1800)
  } catch (e) {
    error.value = e.response?.data?.message || '가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}
.login-layout {
  display: grid;
  grid-template-columns: 1.12fr 0.88fr;
  width: 100%;
  min-height: 100vh;
}
.login-page { height: 100vh; overflow: hidden; }
.login-left {
  background: linear-gradient(165deg, #000000 0%, #111111 55%, #262626 100%);
  padding: 34px 44px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  overflow: hidden;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-name { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
/* 생애주기 카드 (랜딩 스타일, 한눈에) */
.brand-h2 { font-family: var(--font-display); font-size: 30px; font-weight: 800; color: #fff; line-height: 1.32; letter-spacing: -0.5px; margin-bottom: 12px; }
.brand-h2 .hl { color: #d4a017; }
.brand-p { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 22px; line-height: 1.6; }
.lc-strip { display: flex; flex-direction: column; gap: 12px; }
.lc-card {
  display: flex; align-items: center; gap: 16px;
  background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 14px; padding: 16px 20px;
  transition: transform .45s ease, box-shadow .45s ease, border-color .45s ease, background .45s ease;
}
.lc-ic { font-size: 26px; line-height: 1; flex-shrink: 0; transition: transform .45s ease, filter .45s ease; }
.lc-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.lc-name { font-size: 16.5px; font-weight: 800; color: #fff; }
.lc-svc { font-size: 12px; color: rgba(255,255,255,0.5); }
.lc-tag { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); white-space: nowrap; flex-shrink: 0; }
.lc-tag.now { background: rgba(212,160,23,0.20); color: #e8c56a; }
.lc-card.live { border-color: rgba(212,160,23,0.28); }
.lc-card.glow {
  border-color: #d4a017; background: rgba(212,160,23,0.10);
  box-shadow: inset 3px 0 0 #d4a017, 0 8px 28px rgba(212,160,23,0.18);
  transform: translateX(4px);
}
.lc-card.glow .lc-ic { transform: scale(1.14); filter: drop-shadow(0 3px 8px rgba(212,160,23,0.55)); }
@media (prefers-reduced-motion: reduce) { .lc-card.glow { transform: none; } }
/* 이벤트 라인드로잉 히어로 */
.ring-stage { display: flex; justify-content: center; }
.line-art {
  display: flex; align-items: center; justify-content: center;
  height: 190px; margin: 0;
}
.line-art :deep(svg) {
  width: 210px; height: 190px;
  filter: drop-shadow(0 12px 30px rgba(212,160,23,0.20));
}
.line-art :deep(path),
.line-art :deep(ellipse),
.line-art :deep(circle),
.line-art :deep(line) {
  stroke-dasharray: 640;
  stroke-dashoffset: 640;
  animation: artDraw 1.1s cubic-bezier(.45,0,.2,1) forwards;
}
@keyframes artDraw { to { stroke-dashoffset: 0; } }
.art-enter-active { transition: opacity .25s ease; }
.art-leave-active { transition: opacity .18s ease; }
.art-enter-from, .art-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .line-art :deep(*) { animation: none !important; stroke-dashoffset: 0 !important; }
}
.brand-content { margin-top: 8px; }
.brand-content h2 {
  font-family: var(--font-display);
  font-size: 32px; font-weight: 700; color: #fff;
  line-height: 1.4; margin-bottom: 14px;
}
.brand-content p { font-size: 14.5px; color: rgba(255,255,255,0.62); margin-bottom: 24px; line-height: 1.7; }
/* 헤드라인 이벤트 롤링 */
.rot-word { display: inline-block; color: #d4a017; min-width: 2.2em; }
.roll-enter-active { transition: opacity .28s ease, transform .28s cubic-bezier(.22,1,.36,1); }
.roll-leave-active { transition: opacity .16s ease, transform .16s ease; }
.roll-enter-from { opacity: 0; transform: translateY(12px); }
.roll-leave-to { opacity: 0; transform: translateY(-10px); }

/* 생애주기 이벤트 리스트 (하나씩 등장) */
.event-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.event-list li {
  display: flex; align-items: center; gap: 12px;
  font-size: 15px; color: rgba(255,255,255,0.72);
  position: relative; padding: 8px 12px 8px 14px; border-radius: 10px;
  opacity: 0; animation: evRise .55s cubic-bezier(.22,1,.36,1) forwards;
  transition: background .5s ease, box-shadow .5s ease, color .5s ease;
}
.event-list li.glow {
  color: #fff;
  background: linear-gradient(90deg, rgba(255,224,150,0.16), rgba(255,224,150,0) 76%);
  box-shadow: inset 3px 0 0 #FFE08C, 0 0 24px rgba(255,224,150,0.14);
}
.event-list li.glow .ev-name { text-shadow: 0 0 12px rgba(255,224,150,0.5); }
.event-list li.glow .ev-ic { transform: scale(1.16); filter: drop-shadow(0 0 8px rgba(255,224,150,0.55)); }
.event-list li .ev-ic { transition: transform .5s ease, filter .5s ease; }
@media (prefers-reduced-motion: reduce) { .event-list li.glow { box-shadow: inset 3px 0 0 #FFE08C; } }
.event-list li:nth-child(1) { animation-delay: .15s; }
.event-list li:nth-child(2) { animation-delay: .30s; }
.event-list li:nth-child(3) { animation-delay: .45s; }
.event-list li:nth-child(4) { animation-delay: .60s; }
.event-list li:nth-child(5) { animation-delay: .75s; }
.ev-ic { font-size: 18px; width: 24px; text-align: center; }
.ev-name { font-weight: 600; }
.ev-tag {
  margin-left: auto; font-size: 11px; padding: 3px 9px; border-radius: 999px;
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5);
}
.ev-tag.now { background: rgba(212,160,23,0.18); color: #e8c56a; font-weight: 600; }
@keyframes evRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .event-list li { animation: none; opacity: 1; } }
.brand-foot { margin-top: auto; font-size: 12px; color: rgba(212,160,23,0.7); letter-spacing: 0.05em; }

.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: var(--color-bg-secondary);
}
.login-box { width: 100%; max-width: 420px; }
.back-link {
  display: inline-block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  transition: var(--transition);
}
.back-link:hover { color: var(--color-primary); }

.section { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--color-text-primary); }
.section-desc { font-size: 14px; color: var(--color-text-secondary); }

/* 개인/기업 탭 — Chakra 스타일 카드 라디오 */
.role-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.role-tabs-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.role-tabs-3 .role-tab { padding: 11px 8px; align-items: center; text-align: center; gap: 2px; }
.role-tabs-3 .role-tab-title { font-size: 14px; }
.role-tabs-3 .role-tab-desc { font-size: 11px; }
.role-tab {
  display: flex; flex-direction: column; gap: 3px;
  padding: 13px 14px;
  background: var(--color-bg-primary);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: left;
  transition: var(--transition);
}
.role-tab:hover { border-color: var(--color-primary); }
.role-tab.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: 0 0 0 1px var(--color-primary);
}
.role-tab-title { font-size: 14.5px; font-weight: 700; color: var(--color-text-primary); }
.role-tab-desc { font-size: 12px; color: var(--color-text-secondary); }

.form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.form-hint { font-size: 11.5px; color: var(--color-text-muted); }
.form-input {
  padding: 11px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  transition: var(--transition);
  outline: none;
}
.form-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.btn-full { width: 100%; padding: 12px; font-size: 15px; justify-content: center; margin-top: 4px; }

/* 로그인 필드가 아래에서 올라오는 애니메이션 */
.login-reveal .form-group { animation: fieldRise 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
.login-reveal .form-group:nth-of-type(2) { animation-delay: 0.08s; }
.login-reveal .btn-full { animation: fieldRise 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.14s both; }
@keyframes fieldRise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .login-reveal .form-group, .login-reveal .btn-full { animation: none; }
}

.switch-link { text-align: center; font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
.admin-entry {
  display: block; width: 100%; margin-top: 14px; padding: 10px;
  background: none; border: 1px dashed var(--color-border); border-radius: var(--radius-md);
  font-size: 12px; color: var(--color-text-muted); cursor: pointer; transition: var(--transition);
  font-family: var(--font-sans);
}
.admin-entry:hover { border-color: var(--color-primary); color: var(--color-primary); }
.role-guide { margin-top: 18px; text-align: center; border-top: 1px solid var(--color-border); padding-top: 16px; }
.role-guide span { display: inline-block; font-size: 12px; color: var(--color-text-secondary); margin: 0 7px; font-weight: 500; }
.role-guide p { font-size: 11.5px; color: var(--color-text-muted); margin-top: 7px; line-height: 1.5; }
.text-btn {
  background: none; border: none;
  color: var(--color-primary);
  font-size: 13px; font-weight: 600;
  cursor: pointer; padding: 0 2px;
  text-decoration: underline;
}
.error-msg {
  padding: 10px 14px; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: var(--radius-md);
  font-size: 13px; color: #dc2626;
}
.success-msg {
  padding: 10px 14px; background: var(--color-success-light);
  border: 1px solid #bbe5d2; border-radius: var(--radius-md);
  font-size: 13px; color: var(--color-success);
}

@media (max-width: 900px) {
  .login-layout { grid-template-columns: 1fr; }
  .login-left { display: none; }
}
</style>
