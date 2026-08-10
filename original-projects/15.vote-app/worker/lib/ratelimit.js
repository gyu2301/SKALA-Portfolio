import { HttpError } from './http.js';

const WINDOW_MS = 15 * 60 * 1000; // 15분
const MAX_ATTEMPTS = 8;

const key = (scope, ipHash) => `authfail:${scope}:${ipHash}`;

/**
 * 관리 비밀번호 로그인 시도 횟수를 제한한다.
 *
 * 투표별 관리 비밀번호는 사용자가 직접 정하는 값이라 아주 짧고 약할 수 있다(최소 길이만
 * 강제된다). 시도 횟수 제한이 없으면 그 길이 제한은 무의미해진다 — 예를 들어 숫자 8자리는
 * 시도 제한 없이는 몇 시간이면 전수조사로 뚫린다. 15분에 8번으로 막아 무차별 대입을 사실상
 * 막으면서도, 실수로 몇 번 잘못 입력한 정상 사용자는 거의 영향받지 않게 한다.
 */
export async function assertNotLocked(env, scope, ipHash) {
  const raw = await env.VOTE_KV.get(key(scope, ipHash));
  if (!raw) return;
  const state = JSON.parse(raw);
  if (Date.now() - state.firstAt > WINDOW_MS) return; // 창이 지났으면 다시 시도 가능
  if (state.count >= MAX_ATTEMPTS) {
    const waitMin = Math.max(1, Math.ceil((state.firstAt + WINDOW_MS - Date.now()) / 60000));
    throw new HttpError(429, `비밀번호를 너무 많이 틀렸습니다. ${waitMin}분 뒤 다시 시도해주세요.`);
  }
}

export async function recordAuthFailure(env, scope, ipHash) {
  const k = key(scope, ipHash);
  const raw = await env.VOTE_KV.get(k);
  const now = Date.now();
  let state = raw ? JSON.parse(raw) : null;
  if (!state || now - state.firstAt > WINDOW_MS) state = { count: 0, firstAt: now };
  state.count += 1;
  await env.VOTE_KV.put(k, JSON.stringify(state), { expirationTtl: Math.ceil(WINDOW_MS / 1000) + 60 });
}

export async function clearAuthFailures(env, scope, ipHash) {
  await env.VOTE_KV.delete(key(scope, ipHash));
}
