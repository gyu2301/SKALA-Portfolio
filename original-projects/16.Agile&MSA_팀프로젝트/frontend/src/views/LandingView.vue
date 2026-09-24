<template>
  <div class="landing">
    <AppHeader />

    <section class="hero">
      <span class="hero-badge">강남구청 협력 · 생애주기 이벤트 추천 플랫폼</span>
      <h1 class="hero-title">당신의 <b>생애주기 전체</b>를 책임집니다</h1>
      <p class="hero-desc">결혼부터 장례까지, 인생의 큰 이벤트를 예산 안에서 가장 알맞게. <b>EventFIT</b>이 함께합니다.</p>

      <!-- 생애주기 5개 가로 · 순차 글로우 -->
      <div class="lifecycle-row">
        <div
          v-for="(ev, i) in lifecycle"
          :key="ev.name"
          class="lc-card"
          :class="{ glow: glowIdx === i, live: ev.live }"
        >
          <div class="lc-ic">{{ ev.icon }}</div>
          <div class="lc-name">{{ ev.name }}</div>
          <div class="lc-svc">{{ ev.svc }}</div>
          <div class="lc-tag" :class="{ now: ev.live }">{{ ev.tag }}</div>
        </div>
      </div>

      <div class="hero-actions">
        <template v-if="auth.isAuthenticated">
          <router-link to="/courses" class="btn btn-primary btn-lg">웨딩핏 둘러보기</router-link>
          <router-link to="/onboarding" class="btn btn-outline btn-lg">AI 추천 받기</router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-primary btn-lg">무료로 시작하기</router-link>
        </template>
      </div>
    </section>

    <!-- 업체·상품 쇼케이스 (수평 무한 스크롤) -->
    <section class="showcase">
      <div class="marquee">
        <div class="marquee-track">
          <router-link v-for="(p, i) in row1" :key="'a'+i" to="/courses" class="show-card">
            <img :src="p.photo" :alt="p.name" loading="lazy" />
            <div class="show-overlay">
              <span class="show-cat" :style="{ background: p.color }">{{ p.cat }}</span>
              <span class="show-name">{{ p.name }}</span>
            </div>
          </router-link>
        </div>
      </div>
      <div class="marquee rev">
        <div class="marquee-track">
          <router-link v-for="(p, i) in row2" :key="'b'+i" to="/courses" class="show-card">
            <img :src="p.photo" :alt="p.name" loading="lazy" />
            <div class="show-overlay">
              <span class="show-cat" :style="{ background: p.color }">{{ p.cat }}</span>
              <span class="show-name">{{ p.name }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()

const lifecycle = [
  { icon: '💍', name: '결혼', svc: '스튜디오·드레스·메이크업', tag: 'WeddingFIT · 운영 중', live: true },
  { icon: '👶', name: '출산', svc: '산후조리·돌스냅', tag: '준비 중' },
  { icon: '🎂', name: '돌잔치', svc: '돌상·대여·촬영', tag: '준비 중' },
  { icon: '🎉', name: '환갑', svc: '연회·장소·기념', tag: '준비 중' },
  { icon: '🕊️', name: '장례', svc: '절차·비용 안내', tag: '준비 중' },
]
const glowIdx = ref(0)
let timer = null
onMounted(() => { timer = setInterval(() => { glowIdx.value = (glowIdx.value + 1) % lifecycle.length }, 1400) })
onBeforeUnmount(() => clearInterval(timer))

const ph = (id) => `https://images.unsplash.com/${id}?w=560&q=72&auto=format&fit=crop`
const products = [
  { cat: '스튜디오', name: '로이 클래식 본식', color: '#3d6b50', photo: ph('photo-1519741497674-611481863552') },
  { cat: '드레스', name: '플로렌스 시그니처', color: '#8a5a12', photo: ph('photo-1594552072238-b8a33785b261') },
  { cat: '메이크업', name: '청담이유 브라이덜', color: '#8A4A6B', photo: ph('photo-1487412947147-5cebf100ffc2') },
  { cat: '스튜디오', name: '메이 미니멀 스냅', color: '#3d6b50', photo: ph('photo-1511285560929-80b456fea0bc') },
  { cat: '드레스', name: '아비가일 셀렉션', color: '#8a5a12', photo: ph('photo-1525258946800-98cfd641d0de') },
  { cat: '메이크업', name: '겐그레아 클래식', color: '#8A4A6B', photo: ph('photo-1522337660859-02fbefca4702') },
  { cat: '스튜디오', name: '로이 프리미엄 화보', color: '#3d6b50', photo: ph('photo-1465495976277-4387d4b0b4c6') },
  { cat: '드레스', name: '메종 로맨틱', color: '#8a5a12', photo: ph('photo-1519657337289-077653f724ed') },
  { cat: '메이크업', name: '뮤즈 글램', color: '#8A4A6B', photo: ph('photo-1516975080664-ed2fc6a32937') },
]
// 무한 루프용으로 두 번 이어붙임
const row1 = [...products, ...products]
const row2 = [...[...products].reverse(), ...[...products].reverse()]
</script>

<style scoped>
.landing {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1100px 560px at 50% -10%, #fbf1e8 0%, transparent 60%),
    var(--color-bg-secondary);
}
.hero {
  text-align: center;
  padding: 30px 24px 18px;
  display: flex; flex-direction: column; align-items: center;
}
.hero-badge {
  display: inline-block; font-size: 12.5px; font-weight: 600; color: #a05070;
  background: rgba(181,105,122,0.10); padding: 7px 16px; border-radius: 999px; margin-bottom: 14px;
}
.hero-title {
  font-family: var(--font-display); font-size: 34px; font-weight: 800;
  color: var(--color-text-primary); line-height: 1.3; letter-spacing: -0.5px; margin-bottom: 10px;
}
.hero-title b { color: #b5697a; }
.rot { display: inline-block; color: #b5697a; min-width: 2.4em; }
.hero-desc { font-size: 14.5px; color: var(--color-text-secondary); line-height: 1.65; margin-bottom: 18px; max-width: 620px; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

/* 생애주기 5개 가로 · 순차 글로우 */
.lifecycle-row { display: flex; gap: 12px; justify-content: center; margin: 8px 0 22px; width: 100%; max-width: 940px; }
.lc-card {
  flex: 1; min-width: 0; background: #fff; border: 1px solid var(--color-border);
  border-radius: 16px; padding: 16px 12px 13px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  transition: transform .45s ease, box-shadow .45s ease, border-color .45s ease;
}
.lc-ic { font-size: 30px; line-height: 1; transition: transform .45s ease, filter .45s ease; }
.lc-name { font-size: 16px; font-weight: 800; color: var(--color-text-primary); }
.lc-svc { font-size: 11.5px; color: var(--color-text-muted); line-height: 1.3; }
.lc-tag { margin-top: 4px; font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: var(--color-bg-tertiary); color: var(--color-text-muted); }
.lc-tag.now { background: rgba(212,160,23,0.16); color: #b58a2e; }
.lc-card.live { border-color: rgba(181,105,122,0.35); }
.lc-card.glow {
  border-color: #e7c76a;
  box-shadow: 0 0 0 2px rgba(231,199,106,0.5), 0 12px 30px rgba(231,199,106,0.25);
  transform: translateY(-6px);
}
.lc-card.glow .lc-ic { transform: scale(1.18); filter: drop-shadow(0 4px 10px rgba(231,199,106,0.6)); }
@media (prefers-reduced-motion: reduce) { .lc-card.glow { transform: none; } }

.showcase { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: 18px; padding: 8px 0 28px; }
.marquee { overflow: hidden; width: 100%; -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
.marquee-track { display: flex; gap: 18px; width: max-content; padding: 0 9px; animation: scrollL 48s linear infinite; }
.marquee.rev .marquee-track { animation: scrollR 44s linear infinite; }
.marquee:hover .marquee-track { animation-play-state: paused; }
@keyframes scrollL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes scrollR { from { transform: translateX(-50%); } to { transform: translateX(0); } }

.show-card {
  position: relative; flex-shrink: 0;
  width: 300px; height: 186px; border-radius: 18px; overflow: hidden;
  box-shadow: 0 8px 22px rgba(0,0,0,0.08); text-decoration: none; background: #eee;
}
.show-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
.show-card:hover img { transform: scale(1.06); }
.show-overlay {
  position: absolute; inset: auto 0 0 0; padding: 14px 16px;
  background: linear-gradient(0deg, rgba(0,0,0,0.62), transparent);
  display: flex; flex-direction: column; gap: 5px; align-items: flex-start;
}
.show-cat { font-size: 11px; font-weight: 700; color: #fff; padding: 3px 9px; border-radius: 999px; }
.show-name { font-size: 15px; font-weight: 700; color: #fff; }

@media (max-width: 640px) {
  .hero-title { font-size: 26px; }
  .show-card { width: 240px; height: 150px; }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
</style>
