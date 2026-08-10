import { LIMITS } from '../../shared/constants.js';
import { sha256Hex } from './crypto.js';
import { K } from './kv.js';
import { HttpError } from './http.js';

/**
 * IP를 솔트와 함께 해시한다. 원본 IP는 어디에도 저장하지 않는다.
 * pollId를 섞어서 같은 사람이라도 투표마다 다른 값이 나오게 한다 -- 투표 간 추적 방지.
 */
export async function computeIpHash(env, request, pollId) {
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'local';
  const salt = env.IP_SALT || 'dev-only-salt';
  return (await sha256Hex(`${salt}:${ip}:${pollId}`)).slice(0, 32);
}

/**
 * 기명 투표에서 같은 이름을 다른 사람이 쓰고 있는지 검사한다.
 * 같은 voterId면 본인이 고쳐 쓰는 것이므로 통과시킨다.
 */
export function assertNameAvailable(poll, ballots, { name, voterId }) {
  if (!name) return;
  const conflict = ballots.find((b) => b.n === name && b.voterId !== voterId);
  if (conflict) {
    throw new HttpError(
      409,
      `'${name}' 이름으로 이미 투표한 기록이 있습니다. 본인이라면 처음 투표한 기기/브라우저에서 수정해주세요.`,
    );
  }
}

/**
 * 같은 IP 해시에서 나온 서로 다른 voterId 수를 임계값으로 제한한다.
 *
 * 사내 공용망(NAT)에서는 여러 명이 같은 IP를 쓰므로 기본값을 5로 넉넉히 잡았다.
 * 단일 키 read-modify-write라 동시 요청에서 몇 표가 빠져나갈 수 있지만,
 * 이건 정확성이 필요한 집계가 아니라 어뷰징을 늦추는 보조 장치다.
 */
export async function checkAndRecordIp(env, poll, ipHash, voterId) {
  const key = K.dup(poll.id, poll.round, ipHash);
  const raw = await env.VOTE_KV.get(key);
  const ids = raw ? JSON.parse(raw) : [];

  if (ids.includes(voterId)) return;

  const limit = poll.settings.maxPerIp ?? LIMITS.DEFAULT_MAX_PER_IP;
  if (ids.length >= limit) {
    throw new HttpError(
      429,
      `같은 네트워크에서 이미 ${limit}명이 투표했습니다. 다른 네트워크에서 시도하거나 관리자에게 문의해주세요.`,
    );
  }

  ids.push(voterId);
  await env.VOTE_KV.put(key, JSON.stringify(ids));
}
