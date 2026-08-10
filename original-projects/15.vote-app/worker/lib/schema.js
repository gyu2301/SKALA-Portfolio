import {
  LIMITS,
  PRICE_BANDS,
  POLL_THEMES,
  POLL_TYPES,
  RESULT_VISIBILITY,
  SLOT_MINUTES,
  TIEBREAK_MODES,
} from '../../shared/constants.js';
import { slotsPerDay, totalSlots } from '../../shared/slots.js';
import { HttpError } from './http.js';

const PRICE_VALUES = new Set(PRICE_BANDS.map((b) => b.value));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function bad(message) {
  throw new HttpError(400, message);
}

function str(value, { field, max, required = false, min = 0 }) {
  if (value === undefined || value === null || value === '') {
    if (required) bad(`${field}을(를) 입력해주세요.`);
    return '';
  }
  if (typeof value !== 'string') bad(`${field} 형식이 올바르지 않습니다.`);
  const trimmed = value.trim();
  // "아예 안 씀"과 "썼는데 너무 짧음"은 다른 메시지를 줘야 한다. 예전 코드는 min이 1보다
  // 크면 짧게 쓴 경우에도 "입력해주세요"로만 나와서, 비밀번호를 4자 썼는데 왜 막히는지
  // 알 수 없었다.
  if (required && !trimmed) bad(`${field}을(를) 입력해주세요.`);
  if (min && trimmed.length < min) bad(`${field}은(는) ${min}자 이상이어야 합니다.`);
  if (trimmed.length > max) bad(`${field}은(는) ${max}자 이내로 입력해주세요.`);
  return trimmed;
}

function bool(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function int(value, { field, min, max, fallback = null }) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== null) return fallback;
    bad(`${field}을(를) 입력해주세요.`);
  }
  const n = Number(value);
  if (!Number.isInteger(n)) bad(`${field}은(는) 정수여야 합니다.`);
  if (n < min || n > max) bad(`${field}은(는) ${min} 이상 ${max} 이하여야 합니다.`);
  return n;
}

function pick(value, allowed, fallback, field) {
  if (value === undefined || value === null) return fallback;
  if (!allowed.includes(value)) bad(`${field} 값이 올바르지 않습니다.`);
  return value;
}

/** 중복을 제거한 이름 목록. 순서는 입력 순서를 지킨다. */
function normalizeRoster(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const entry of raw) {
    const name = str(entry, { field: '참여자 이름', max: LIMITS.NAME });
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
    if (out.length > LIMITS.MAX_ROSTER) bad(`참여자 명단은 ${LIMITS.MAX_ROSTER}명까지 등록할 수 있습니다.`);
  }
  return out;
}

function validateOptions(raw) {
  if (!Array.isArray(raw) || raw.length < 2) bad('선택지를 2개 이상 입력해주세요.');
  if (raw.length > LIMITS.MAX_OPTIONS) bad(`선택지는 ${LIMITS.MAX_OPTIONS}개까지 만들 수 있습니다.`);

  const labels = new Set();
  return raw.map((entry, i) => {
    const o = entry && typeof entry === 'object' ? entry : {};
    const label = str(o.label, { field: '선택지 이름', max: LIMITS.OPTION_LABEL, required: true });
    const place = str(o.place, { field: '가게명', max: LIMITS.OPTION_PLACE });
    const note = str(o.note, { field: '메모', max: LIMITS.OPTION_NOTE });
    const priceBand = o.priceBand ? pick(o.priceBand, [...PRICE_VALUES], '', '가격대') : '';

    const dedupeKey = `${label}|${place}`;
    if (labels.has(dedupeKey)) bad(`선택지가 중복됩니다: ${label}`);
    labels.add(dedupeKey);

    return { id: `o${i + 1}`, label, place, priceBand, note };
  });
}

function validateSchedule(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const dates = Array.isArray(s.dates) ? [...new Set(s.dates)] : [];
  if (dates.length < 1) bad('후보 날짜를 1개 이상 선택해주세요.');
  if (dates.length > LIMITS.MAX_DATES) bad(`날짜는 ${LIMITS.MAX_DATES}일까지 선택할 수 있습니다.`);
  for (const d of dates) {
    if (typeof d !== 'string' || !DATE_RE.test(d) || Number.isNaN(Date.parse(d))) {
      bad('날짜 형식이 올바르지 않습니다.');
    }
  }
  dates.sort();

  const slotMin = pick(s.slotMin, SLOT_MINUTES, 30, '슬롯 길이');
  const startMin = int(s.startMin, { field: '시작 시각', min: 0, max: 24 * 60 - 1, fallback: 9 * 60 });
  const endMin = int(s.endMin, { field: '종료 시각', min: 1, max: 24 * 60, fallback: 18 * 60 });
  if (endMin <= startMin) bad('종료 시각은 시작 시각보다 뒤여야 합니다.');
  if ((endMin - startMin) % slotMin !== 0) bad('시간 범위가 슬롯 길이로 나누어떨어져야 합니다.');

  const schedule = { dates, startMin, endMin, slotMin };
  if (slotsPerDay(schedule) < 1) bad('시간 범위가 너무 짧습니다.');
  if (totalSlots(schedule) > LIMITS.MAX_SLOTS) bad('시간대가 너무 많습니다. 날짜나 시간 범위를 줄여주세요.');
  return schedule;
}

function validateSettings(raw, { type, rosterSize }) {
  const s = raw && typeof raw === 'object' ? raw : {};

  const anonymous = bool(s.anonymous, false);
  const allowAbstain = bool(s.allowAbstain, true);
  // 기본값은 "한 번만 투표 가능"이다. 대부분의 설문/투표 도구가 이 기본값을 따르고,
  // 재투표를 허용하려면 생성자가 명시적으로 켜야 한다.
  const allowChange = bool(s.allowChange, false);

  const multiEnabled = bool(s.multiSelect?.enabled, type === 'schedule');
  // 날짜 조율은 여러 시간대를 고르는 게 본질이라 복수선택을 끌 수 없다.
  // max: 0은 "상한 없음"을 뜻하는 정상값이다(끄면 프론트가 0을 보낸다) — min을 1로 두면
  // 복수선택을 켜지 않은 기본 생성 흐름이 전부 막히므로 0을 허용해야 한다.
  // 상한도 종류별로 다르다: 선택지 투표는 옵션 개수(<=30), 날짜 조율은 슬롯 개수(<=672)가 기준이다.
  const multiSelect = {
    enabled: type === 'schedule' ? true : multiEnabled,
    max: int(s.multiSelect?.max, {
      field: '최대 선택 개수',
      min: 0,
      max: type === 'schedule' ? LIMITS.MAX_SLOTS : LIMITS.MAX_OPTIONS,
      fallback: 0,
    }),
  };

  const resultVisibility = pick(s.resultVisibility, RESULT_VISIBILITY, 'afterVote', '결과 공개 시점');
  const tiebreak = pick(s.tiebreak, TIEBREAK_MODES, 'manual', '무승부 처리 방식');
  // 데이터·로직에는 영향이 없는 순수 표현 설정. 검증만 하고 그대로 저장한다.
  const theme = pick(s.theme, POLL_THEMES, 'simple', '테마');

  let closeAt = null;
  if (s.closeAt !== undefined && s.closeAt !== null && s.closeAt !== '') {
    const n = Number(s.closeAt);
    if (!Number.isFinite(n)) bad('마감 시각이 올바르지 않습니다.');
    if (n <= Date.now()) bad('마감 시각은 현재보다 뒤여야 합니다.');
    if (n > Date.now() + 365 * 24 * 60 * 60 * 1000) bad('마감 시각은 1년 이내로 설정해주세요.');
    closeAt = Math.round(n);
  }

  // 익명 모드에서는 "누가 투표했는지"를 알 수 없으므로 명단 기반 기능을 켤 수 없다.
  const closeWhenAllVoted = !anonymous && rosterSize > 0 && bool(s.closeWhenAllVoted, false);

  const maxPerIp = int(s.maxPerIp, {
    field: '같은 네트워크 허용 인원',
    min: 1,
    max: 100,
    fallback: LIMITS.DEFAULT_MAX_PER_IP,
  });

  return {
    anonymous,
    allowAbstain,
    allowChange,
    multiSelect,
    resultVisibility,
    tiebreak,
    theme,
    closeAt,
    closeWhenAllVoted,
    maxPerIp,
    // 재투표 라운드에 같은 길이의 마감 시간을 다시 주기 위해 보관한다.
    roundDurationMs: closeAt ? closeAt - Date.now() : null,
  };
}

export function validateCreatePoll(body) {
  const type = pick(body.type, POLL_TYPES, 'choice', '투표 종류');
  const title = str(body.title, { field: '제목', max: LIMITS.TITLE, required: true });
  const description = str(body.description, { field: '설명', max: LIMITS.DESCRIPTION });
  const password = str(body.password, {
    field: '관리 비밀번호',
    max: LIMITS.PASSWORD_MAX,
    min: LIMITS.PASSWORD_MIN,
    required: true,
  });

  const roster = normalizeRoster(body.roster);
  const settings = validateSettings(body.settings, { type, rosterSize: roster.length });

  if (settings.anonymous && roster.length > 0) {
    bad('익명 투표에서는 참여자 명단을 쓸 수 없습니다. 익명을 끄거나 명단을 비워주세요.');
  }

  const poll = {
    type,
    title,
    description,
    roster: settings.anonymous ? [] : roster,
    settings,
    options: [],
    schedule: null,
  };

  if (type === 'choice') {
    poll.options = validateOptions(body.options);
    if (settings.multiSelect.enabled && settings.multiSelect.max > poll.options.length) {
      settings.multiSelect.max = poll.options.length;
    }
  } else {
    poll.schedule = validateSchedule(body.schedule);
  }

  return poll;
}

export function validateBallot(poll, body) {
  const voterId = str(body.voterId, { field: '참여자 식별자', max: 64, required: true });

  let name = '';
  if (!poll.settings.anonymous) {
    name = str(body.name, { field: '이름', max: LIMITS.NAME, required: true });
    if (poll.roster.length > 0 && !poll.roster.includes(name)) {
      bad('참여자 명단에 없는 이름입니다. 명단에 있는 이름으로 참여해주세요.');
    }
  }

  const abstain = bool(body.abstain, false);
  if (abstain && !poll.settings.allowAbstain) bad('이 투표는 기권을 허용하지 않습니다.');

  const ballot = { voterId, name, abstain, selections: [], slots: [] };
  if (abstain) return ballot;

  if (poll.type === 'choice') {
    const valid = new Set((poll.activeOptionIds ?? poll.options.map((o) => o.id)));
    const raw = Array.isArray(body.selections) ? body.selections : [];
    const selections = [...new Set(raw)].filter((id) => valid.has(id));
    if (selections.length === 0) bad('선택지를 1개 이상 골라주세요.');
    if (!poll.settings.multiSelect.enabled && selections.length > 1) {
      bad('이 투표는 하나만 고를 수 있습니다.');
    }
    const max = poll.settings.multiSelect.max;
    if (poll.settings.multiSelect.enabled && max > 0 && selections.length > max) {
      bad(`최대 ${max}개까지 고를 수 있습니다.`);
    }
    ballot.selections = selections;
  } else {
    const total = totalSlots(poll.schedule);
    const allowed = poll.activeSlots ? new Set(poll.activeSlots) : null;
    const raw = Array.isArray(body.slots) ? body.slots : [];
    const slots = [...new Set(raw)]
      .filter((i) => Number.isInteger(i) && i >= 0 && i < total)
      .filter((i) => !allowed || allowed.has(i))
      .sort((a, b) => a - b);
    if (slots.length === 0) bad('가능한 시간대를 1개 이상 선택해주세요.');
    ballot.slots = slots;
  }

  return ballot;
}
