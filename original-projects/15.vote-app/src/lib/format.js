import { PRICE_BAND_LABEL, PRICE_BAND_MIDPOINT } from '../../shared/constants.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** '2026-08-12' -> '8월 12일 (수)' */
export function formatDate(iso, { short = false } = {}) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAYS[date.getDay()];
  return short ? `${m}/${d} (${weekday})` : `${m}월 ${d}일 (${weekday})`;
}

export function formatDateTime(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`;
}

/** 남은 시간을 '2시간 15분' 같은 형태로. 이미 지났으면 null. */
export function formatRemaining(targetMs, nowMs = Date.now()) {
  const diff = targetMs - nowMs;
  if (diff <= 0) return null;

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (totalMinutes > 0) return `${totalMinutes}분`;
  return `${Math.ceil(diff / 1000)}초`;
}

export function formatRelativePast(ms) {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return formatDateTime(ms);
}

export const priceLabel = (band) => PRICE_BAND_LABEL[band] || '';

/** 선택된 메뉴들의 대표 가격 평균. 가격대가 하나도 없으면 null. */
export function averagePrice(options) {
  const values = options.map((o) => PRICE_BAND_MIDPOINT[o.priceBand]).filter(Boolean);
  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg / 500) * 500;
}

export const formatWon = (won) => `${won.toLocaleString('ko-KR')}원`;

/** datetime-local 입력값('2026-08-12T13:30') <-> epoch ms */
export function toLocalInputValue(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export const todayIso = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
