// 프론트엔드와 Worker가 함께 쓰는 상수. 어느 쪽에서도 import 할 수 있도록 순수 JS만 둔다.

export const POLL_TYPES = ['choice', 'schedule'];

/**
 * 투표 화면의 분위기. 데이터·로직은 전부 동일하고 화면 표현만 달라진다.
 * simple = 기본값(화이트+그린), sticker = 보드에 스티커 붙이기, chat = 채팅 말풍선,
 * arcade = 게임 카드 스타일.
 */
export const POLL_THEMES = ['simple', 'sticker', 'chat', 'arcade'];

export const RESULT_VISIBILITY = ['always', 'afterVote', 'afterClose'];

/** 무승부 처리 방식. manual = 마감 후 관리자가 룰렛/재투표 중 선택 */
export const TIEBREAK_MODES = ['roulette', 'runoff', 'manual'];

export const LIMITS = {
  TITLE: 80,
  DESCRIPTION: 500,
  OPTION_LABEL: 60,
  OPTION_PLACE: 40,
  OPTION_NOTE: 80,
  NAME: 20,
  // 4자리 숫자(예: 1234) 같은 값은 로그인 시도 제한이 없다면 순식간에 뚫린다.
  // 8자 이상을 강제하고, 시도 횟수 제한(ratelimit.js)을 함께 적용해 이중으로 막는다.
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 64,
  MAX_OPTIONS: 30,
  MAX_ROSTER: 100,
  MAX_DATES: 14,
  MAX_SLOTS: 672, // 14일 × 48슬롯(30분 단위, 24시간)
  /** KV metadata 하드 리밋. 초과하면 put이 실패하므로 서버에서 미리 막는다. */
  METADATA_BYTES: 1024,
  /** 같은 IP 해시에서 허용할 서로 다른 voterId 수. 사내 공용망(NAT) 오탐을 감안해 넉넉히 잡는다. */
  DEFAULT_MAX_PER_IP: 5,
};

/** 가격대 프리셋. value는 저장값, label은 표시값. */
export const PRICE_BANDS = [
  { value: 'under7', label: '~7천원' },
  { value: '7to10', label: '7천~1만원' },
  { value: '10to15', label: '1만~1.5만원' },
  { value: 'over15', label: '1.5만원~' },
];

export const PRICE_BAND_LABEL = Object.fromEntries(PRICE_BANDS.map((b) => [b.value, b.label]));

/** 가격대 요약을 계산할 때 쓰는 대표값(원). */
export const PRICE_BAND_MIDPOINT = {
  under7: 6000,
  '7to10': 8500,
  '10to15': 12500,
  over15: 18000,
};

export const SLOT_MINUTES = [30, 60];
