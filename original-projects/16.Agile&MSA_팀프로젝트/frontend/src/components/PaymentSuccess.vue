<template>
  <div class="pay-overlay" @click.self="$emit('close')">
    <canvas ref="cv" class="confetti"></canvas>
    <div class="pay-modal">
      <div class="pay-check">
        <svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" fill="none" stroke="#2f855a" stroke-width="3" class="pc-ring"/><path d="M16 27l7 7 14-15" fill="none" stroke="#2f855a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="pc-tick"/></svg>
      </div>
      <h2>결제 완료되었습니다!</h2>
      <p>{{ subtitle }}</p>
      <div class="pay-actions">
        <button class="btn btn-primary" @click="$emit('go')">내 예약 보기</button>
        <button class="btn btn-ghost" @click="$emit('close')">계속 둘러보기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
defineProps({ subtitle: { type: String, default: '' } })
defineEmits(['close', 'go'])

const cv = ref(null)
let raf = null
let parts = []

onMounted(() => {
  const c = cv.value
  if (!c) return
  const ctx = c.getContext('2d')
  c.width = window.innerWidth
  c.height = window.innerHeight
  const colors = ['#d4a017', '#b5697a', '#2f855a', '#c9a24b', '#e8c56a', '#8A4A6B']
  const cx = c.width / 2, cy = c.height / 2 - 30
  for (let i = 0; i < 170; i++) {
    parts.push({
      x: cx + (Math.random() - 0.5) * 160, y: cy,
      vx: (Math.random() - 0.5) * 15, vy: Math.random() * -17 - 3,
      g: 0.28 + Math.random() * 0.22, s: 4 + Math.random() * 7,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.34,
      color: colors[i % colors.length]
    })
  }
  const tick = () => {
    ctx.clearRect(0, 0, c.width, c.height)
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
      ctx.fillStyle = p.color; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62)
      ctx.restore()
    })
    parts = parts.filter(p => p.y < c.height + 24)
    if (parts.length) raf = requestAnimationFrame(tick)
  }
  tick()
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<style scoped>
.pay-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(22, 18, 20, 0.55); backdrop-filter: blur(4px);
}
.confetti { position: fixed; inset: 0; pointer-events: none; }
.pay-modal {
  position: relative; background: #fff; border-radius: 24px;
  padding: 38px 44px 32px; text-align: center; max-width: 420px; width: calc(100% - 48px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
  animation: pop .42s cubic-bezier(.22, 1.4, .4, 1);
}
.pay-check { margin-bottom: 10px; }
.pc-ring { stroke-dasharray: 151; stroke-dashoffset: 151; animation: draw .5s ease .05s forwards; }
.pc-tick { stroke-dasharray: 40; stroke-dashoffset: 40; animation: draw .35s ease .45s forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
.pay-modal h2 { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; }
.pay-modal p { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 22px; line-height: 1.6; }
.pay-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
@keyframes pop { from { opacity: 0; transform: scale(.85) translateY(12px); } to { opacity: 1; transform: none; } }
</style>
