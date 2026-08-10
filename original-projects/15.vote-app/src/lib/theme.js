// 투표 화면의 분위기 메타데이터. 데이터/로직은 테마와 무관하고 표현만 달라진다.

export const THEMES = [
  {
    id: 'simple',
    emoji: '🌿',
    label: '심플',
    tagline: '깔끔한 화이트 + 그린',
    description: '군더더기 없이 결과가 한눈에 보이는 기본 스타일.',
  },
  {
    id: 'sticker',
    emoji: '🧷',
    label: '스티커보드',
    tagline: '보드에 스티커를 콕 붙이는 느낌',
    description: '흰 보드 위에 참여자가 스티커를 붙여요. 같이 정하는 느낌이 잘 살아요.',
  },
  {
    id: 'chat',
    emoji: '💬',
    label: '채팅',
    tagline: '단톡방에서 정하는 느낌',
    description: '닉네임 말풍선으로 누가 뭘 골랐는지 대화하듯 보여줘요.',
  },
  {
    id: 'arcade',
    emoji: '🎮',
    label: '아케이드',
    tagline: '게임처럼 신나게',
    description: '카드가 통통 튀고 게이지가 차올라요. 1위에는 트로피 🏆.',
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);

export const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
