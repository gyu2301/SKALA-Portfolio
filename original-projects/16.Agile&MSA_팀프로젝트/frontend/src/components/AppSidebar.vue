<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">메뉴</div>

      <!-- 기업(업체) -->
      <template v-if="isVendor">
        <router-link to="/mypage?tab=products" class="sidebar-item" :class="{ active: isMypage && vtab !== 'refunds' }">
          <svg class="si-ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>
          상품 관리
        </router-link>
        <router-link to="/mypage?tab=refunds" class="sidebar-item" :class="{ active: isMypage && vtab === 'refunds' }">
          <svg class="si-ic" viewBox="0 0 24 24"><path d="M3 7v6h6"/><path d="M3.5 13a9 9 0 1 0 2.6-7.6L3 8"/></svg>
          교환·환불 관리
        </router-link>
        <router-link to="/courses/new" class="sidebar-item" :class="{ active: $route.path === '/courses/new' }">
          <svg class="si-ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          상품 등록
        </router-link>
      </template>

      <!-- 관리자(지자체) -->
      <router-link v-else-if="isAdmin" to="/admin/refunds" class="sidebar-item" :class="{ active: $route.path.startsWith('/admin') }">
        <svg class="si-ic" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
        지자체 콘솔
      </router-link>

      <!-- 개인(예비부부) -->
      <template v-else>
        <router-link to="/courses" class="sidebar-item" :class="{ active: $route.path.startsWith('/courses') }">
          <svg class="si-ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>
          웨딩 상품
        </router-link>
        <router-link to="/onboarding" class="sidebar-item" :class="{ active: $route.path === '/onboarding' || $route.path === '/recommendations' }">
          <svg class="si-ic" viewBox="0 0 24 24"><path d="M12 3l2.1 4.9L19 10l-4.9 2.1L12 17l-2.1-4.9L5 10l4.9-2.1z"/><path d="M18.5 14.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/></svg>
          AI 추천
        </router-link>
        <router-link to="/enrollments" class="sidebar-item" :class="{ active: $route.path === '/enrollments' }">
          <svg class="si-ic" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/><path d="M8.5 14.5l2.5 2.5 4.5-4.5"/></svg>
          내 예약
        </router-link>
      </template>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">계정</div>
      <router-link to="/mypage" class="sidebar-item" :class="{ active: $route.path === '/mypage' }">
        <svg class="si-ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/></svg>
        마이페이지
      </router-link>
      <button class="sidebar-item sidebar-btn" @click="handleLogout">
        <svg class="si-ic" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
        로그아웃
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const isVendor = computed(() => ['VENDOR', 'INSTRUCTOR'].includes(auth.user?.role))
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const isMypage = computed(() => route.path === '/mypage')
const vtab = computed(() => route.query.tab || 'products')

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.sidebar { display: flex; flex-direction: column; gap: 4px; }
.sidebar-section { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
.sidebar-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--color-text-muted); padding: 8px 12px 4px;
}
.sidebar-item {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 12px; border-radius: var(--radius-md);
  font-size: 14px; color: var(--color-text-secondary);
  transition: var(--transition);
  background: none; border: none; width: 100%;
  text-align: left; cursor: pointer; font-family: var(--font-sans); text-decoration: none;
}
.sidebar-item:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); }
.sidebar-item.active { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; }
.si-ic { width: 19px; height: 19px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.sidebar-btn { color: var(--color-text-secondary); }
</style>
