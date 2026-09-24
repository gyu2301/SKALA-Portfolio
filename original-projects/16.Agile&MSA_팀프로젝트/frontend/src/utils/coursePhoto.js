// 상품 카테고리별 Unsplash 사진 (한글·영문 카테고리 모두 지원, 항상 사진 보장)
const photoPool = {
  STUDIO: ['photo-1519741497674-611481863552', 'photo-1465495976277-4387d4b0b4c6', 'photo-1606216794074-735e91aa2c92', 'photo-1511285560929-80b456fea0bc'],
  DRESS: ['photo-1594552072238-b8a33785b261', 'photo-1519657337289-077653f724ed', 'photo-1525258946800-98cfd641d0de', 'photo-1560750588-73207b1ef5b8'],
  MAKEUP: ['photo-1487412947147-5cebf100ffc2', 'photo-1522337660859-02fbefca4702', 'photo-1516975080664-ed2fc6a32937', 'photo-1596704017254-9b121068fb31'],
}
const KO = { 스튜디오: 'STUDIO', 드레스: 'DRESS', 메이크업: 'MAKEUP' }
const ALL = [...photoPool.STUDIO, ...photoPool.DRESS, ...photoPool.MAKEUP]

// 상품 하나에 대해 항상 Unsplash 사진 URL을 반환 (카테고리 없거나 미매칭이어도 폴백)
export function coursePhoto(course, w = 800) {
  if (!course) return null
  const cat = KO[course.category] || course.category
  const pool = photoPool[cat] || ALL
  const id = Number(course.id ?? course.courseId ?? 0) || 0
  const pick = pool[Math.abs(id) % pool.length]
  return `https://images.unsplash.com/${pick}?w=${w}&q=74&auto=format&fit=crop`
}
