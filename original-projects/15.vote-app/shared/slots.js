// 날짜 조율(schedule) 투표의 시간 슬롯 <-> 비트마스크 변환.
//
// 왜 비트마스크인가: 집계용 요약을 KV metadata(키당 1024바이트)에 넣어야
// list() 한 번으로 전체 집계를 끝낼 수 있다. 슬롯 인덱스 배열을 그대로 넣으면
// 슬롯이 많을 때 1024바이트를 넘기므로, 비트마스크 -> base64 로 압축한다.
// 최대 규모(14일 × 48슬롯 = 672비트 = 84바이트)라도 base64 112자에 들어간다.

/** 하루당 슬롯 개수 */
export function slotsPerDay(schedule) {
  return Math.max(0, Math.floor((schedule.endMin - schedule.startMin) / schedule.slotMin));
}

/** 전체 슬롯 개수 (날짜 × 하루당 슬롯) */
export function totalSlots(schedule) {
  return schedule.dates.length * slotsPerDay(schedule);
}

/** (날짜 인덱스, 하루 안에서의 슬롯 인덱스) -> 전체 슬롯 인덱스 */
export function slotIndex(schedule, dayIdx, rowIdx) {
  return dayIdx * slotsPerDay(schedule) + rowIdx;
}

/** 전체 슬롯 인덱스 -> { dayIdx, rowIdx, date, startMin, endMin } */
export function describeSlot(schedule, index) {
  const per = slotsPerDay(schedule);
  const dayIdx = Math.floor(index / per);
  const rowIdx = index % per;
  const startMin = schedule.startMin + rowIdx * schedule.slotMin;
  return {
    dayIdx,
    rowIdx,
    date: schedule.dates[dayIdx],
    startMin,
    endMin: startMin + schedule.slotMin,
  };
}

/** 분(minutes) -> "HH:MM" */
export function formatMinutes(min) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 선택된 슬롯 인덱스 배열 -> base64 비트마스크.
 * 범위를 벗어나거나 중복된 인덱스는 무시한다.
 */
export function encodeSlots(indices, total) {
  const bytes = new Uint8Array(Math.ceil(total / 8));
  for (const i of indices) {
    if (!Number.isInteger(i) || i < 0 || i >= total) continue;
    bytes[i >> 3] |= 1 << (i & 7);
  }
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** base64 비트마스크 -> 선택된 슬롯 인덱스 배열 (오름차순) */
export function decodeSlots(b64, total) {
  const out = [];
  if (!b64) return out;
  let binary;
  try {
    binary = atob(b64);
  } catch {
    return out;
  }
  for (let i = 0; i < total; i++) {
    const byte = binary.charCodeAt(i >> 3);
    if (Number.isNaN(byte)) break;
    if (byte & (1 << (i & 7))) out.push(i);
  }
  return out;
}

/** 슬롯별 선택 여부 boolean 배열. 그리드 렌더링에 쓴다. */
export function decodeSlotFlags(b64, total) {
  const flags = new Array(total).fill(false);
  for (const i of decodeSlots(b64, total)) flags[i] = true;
  return flags;
}
