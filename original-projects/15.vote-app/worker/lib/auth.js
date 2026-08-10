import { HttpError } from './http.js';
import { b64urlDecode, b64urlEncode, hmacHex, randomHex, sha256Hex, timingSafeEqual } from './crypto.js';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12시간

export function randomSalt() {
  return randomHex(16);
}

export async function hashPassword(salt, password) {
  return sha256Hex(`${salt}:${password}`);
}

function secretOf(env) {
  const secret = env.AUTH_SECRET;
  if (!secret) {
    // 시크릿이 없으면 토큰 위조가 가능해지므로 조용히 넘어가면 안 된다.
    throw new HttpError(500, 'AUTH_SECRET이 설정되지 않았습니다. .dev.vars 또는 wrangler secret을 확인하세요.');
  }
  return secret;
}

/** payload: { p: pollId | '*', r: 'owner' | 'global', e: 만료시각(ms) } */
export async function signToken(env, payload) {
  const body = b64urlEncode(JSON.stringify({ ...payload, e: Date.now() + TOKEN_TTL_MS }));
  const sig = await hmacHex(secretOf(env), body);
  return `${body}.${sig}`;
}

export async function verifyToken(env, token) {
  if (typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(secretOf(env), body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body));
    if (!payload || typeof payload.e !== 'number' || Date.now() > payload.e) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Authorization: Bearer <token> 을 읽어 검증한다. 없거나 잘못되면 null. */
export async function readAuth(request, env) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  return verifyToken(env, header.slice(7).trim());
}

export function canManage(auth, pollId) {
  if (!auth) return false;
  if (auth.r === 'global') return true;
  return auth.r === 'owner' && auth.p === pollId;
}

export async function requireManage(request, env, pollId) {
  const auth = await readAuth(request, env);
  if (!canManage(auth, pollId)) {
    throw new HttpError(403, '관리 권한이 필요합니다. 관리 비밀번호로 인증해주세요.');
  }
  return auth;
}

export async function requireGlobal(request, env) {
  const auth = await readAuth(request, env);
  if (!auth || auth.r !== 'global') {
    throw new HttpError(403, '전역 관리자 권한이 필요합니다.');
  }
  return auth;
}
