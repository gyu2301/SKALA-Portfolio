// 계정 없이 "나"를 알아보기 위한 브라우저 로컬 상태.
// 서버는 이 voterId를 1차 키로 써서 재방문 시 본인 투표를 수정할 수 있게 한다.

const VOTER_KEY = 'vote:voterId';
const NAME_KEY = 'vote:name';
const RECENT_KEY = 'vote:recent';
const ADMIN_KEY = 'vote:adminToken';
const tokenKey = (id) => `vote:token:${id}`;

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // 시크릿 모드 등에서 localStorage가 막혀 있을 수 있다
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* 저장 실패해도 투표 자체는 진행되어야 한다 */
  }
}

let memoryVoterId = null;

export function getVoterId() {
  const saved = read(VOTER_KEY);
  if (saved) return saved;
  // localStorage를 못 쓰는 환경에서도 한 세션 동안은 일관된 id를 유지한다.
  if (!memoryVoterId) memoryVoterId = crypto.randomUUID();
  write(VOTER_KEY, memoryVoterId);
  return memoryVoterId;
}

export const getSavedName = () => read(NAME_KEY) || '';
export const setSavedName = (name) => write(NAME_KEY, name || null);

export const getPollToken = (id) => read(tokenKey(id)) || '';
export const setPollToken = (id, token) => write(tokenKey(id), token || null);

export const getAdminToken = () => read(ADMIN_KEY) || '';
export const setAdminToken = (token) => write(ADMIN_KEY, token || null);

export function getRecentPolls() {
  try {
    const parsed = JSON.parse(read(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 최근 만든/참여한 투표를 최대 20개까지 기억한다. 서버에 계정이 없으므로 이 목록이 곧 내 기록이다. */
export function rememberPoll(entry) {
  const list = getRecentPolls().filter((p) => p.id !== entry.id);
  list.unshift({ ...entry, seenAt: Date.now() });
  write(RECENT_KEY, JSON.stringify(list.slice(0, 20)));
}

export function forgetPoll(id) {
  write(RECENT_KEY, JSON.stringify(getRecentPolls().filter((p) => p.id !== id)));
  setPollToken(id, null);
}
