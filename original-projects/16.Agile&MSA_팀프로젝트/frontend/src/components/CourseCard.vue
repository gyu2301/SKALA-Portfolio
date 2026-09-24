<template>
  <router-link :to="`/courses/${course.id}`" class="course-card">
    <!-- 카테고리 비주얼: 그라데이션+아이콘 바탕 위에 Unsplash 사진(로드 성공 시 페이드인, 실패 시 바탕 유지) -->
    <div class="card-thumb" :style="{ background: `linear-gradient(140deg, ${config.bg} 0%, #ffffff 115%)` }">
      <svg v-if="course.category === '스튜디오'" width="54" height="54" viewBox="0 0 24 24" fill="none" :stroke="config.fg" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/>
      </svg>
      <svg v-else-if="course.category === '드레스'" width="54" height="54" viewBox="0 0 24 24" fill="none" :stroke="config.fg" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 3l3 3 3-3M12 6v3M8 21c0-6 2-8 4-12 2 4 4 6 4 12z"/>
      </svg>
      <svg v-else width="54" height="54" viewBox="0 0 24 24" fill="none" :stroke="config.fg" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 4l5 5-9.5 9.5a3 3 0 01-1.6.85L5 20l.65-3.9a3 3 0 01.85-1.6z"/><path d="M13 6l5 5"/>
      </svg>
      <img v-if="photoUrl" :src="photoUrl" class="thumb-photo" :class="{ show: loaded }" @load="loaded = true" @error="loaded = false" loading="lazy" alt="" />
    </div>

    <div class="card-body">
      <div class="badge-row">
        <span class="badge" :style="{ background: config.bg, color: config.fg }">{{ course.category }}</span>
        <span v-if="course.region" class="badge badge-region">{{ course.region }}</span>
        <span v-if="course.style" class="badge badge-style">{{ course.style }}</span>
      </div>
      <h3 class="card-title">{{ course.title }}</h3>
      <div class="card-meta">
        <span class="enrolled">예약 {{ course.enrollmentCount?.toLocaleString() || 0 }}건</span>
        <span class="price">₩{{ Number(course.price).toLocaleString() }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  course: { type: Object, required: true }
})

const loaded = ref(false)
const photoPool = {
  '스튜디오': ['photo-1519741497674-611481863552', 'photo-1465495976277-4387d4b0b4c6', 'photo-1606216794074-735e91aa2c92', 'photo-1511285560929-80b456fea0bc'],
  '드레스': ['photo-1594552072238-b8a33785b261', 'photo-1519657337289-077653f724ed', 'photo-1525258946800-98cfd641d0de', 'photo-1560750588-73207b1ef5b8'],
  '메이크업': ['photo-1487412947147-5cebf100ffc2', 'photo-1522337660859-02fbefca4702', 'photo-1516975080664-ed2fc6a32937', 'photo-1596704017254-9b121068fb31'],
}
const photoUrl = computed(() => {
  if (props.course.image_url || props.course.imageUrl) return props.course.image_url || props.course.imageUrl
  const pool = photoPool[props.course.category] || []
  if (!pool.length) return null
  return `https://images.unsplash.com/${pool[props.course.id % pool.length]}?w=640&q=72&auto=format&fit=crop`
})

const categoryConfig = {
  '스튜디오': { bg: '#E7F0EA', fg: '#3d6b50' },
  '드레스':   { bg: '#faf0d8', fg: '#8a5a12' },
  '메이크업': { bg: '#F3E8EE', fg: '#8A4A6B' },
}

const config = computed(() => categoryConfig[props.course.category] || { bg: '#F1EFE8', fg: '#6B7A72' })
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
}
.course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}
.card-thumb {
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.thumb-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity .5s ease;
}
.thumb-photo.show { opacity: 1; }
.card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.badge-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
}
.badge-region {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.badge-style {
  background: #fff;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.card-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
}
.card-meta {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.enrolled {
  font-size: 11.5px;
  color: var(--color-text-muted);
}
.price {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
}
</style>
