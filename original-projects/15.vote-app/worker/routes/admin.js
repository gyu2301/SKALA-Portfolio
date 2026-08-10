import { requireGlobal, signToken } from '../lib/auth.js';
import { timingSafeEqual } from '../lib/crypto.js';
import { computeIpHash } from '../lib/dedupe.js';
import { HttpError, json, readJson } from '../lib/http.js';
import { K, decodeField } from '../lib/kv.js';
import { assertNotLocked, clearAuthFailures, recordAuthFailure } from '../lib/ratelimit.js';
import { purgePoll } from './polls.js';

const GLOBAL_SCOPE = 'global-admin';

export async function adminLogin(request, env) {
  const body = await readJson(request);
  const expected = env.ADMIN_PASSWORD;
  if (!expected) {
    throw new HttpError(500, 'ADMIN_PASSWORD가 설정되지 않았습니다. wrangler secret으로 등록하세요.');
  }
  const given = typeof body.password === 'string' ? body.password : '';

  const ipHash = await computeIpHash(env, request, GLOBAL_SCOPE);
  await assertNotLocked(env, GLOBAL_SCOPE, ipHash);

  if (!timingSafeEqual(given, expected)) {
    await recordAuthFailure(env, GLOBAL_SCOPE, ipHash);
    throw new HttpError(401, '관리자 비밀번호가 올바르지 않습니다.');
  }
  await clearAuthFailures(env, GLOBAL_SCOPE, ipHash);
  return json({ adminToken: await signToken(env, { p: '*', r: 'global' }) });
}

/**
 * 전체 투표 목록. poll 키의 metadata만 읽으므로 값을 하나도 가져오지 않는다.
 */
export async function adminListPolls(request, env, url) {
  await requireGlobal(request, env);

  const cursor = url.searchParams.get('cursor') || undefined;
  const page = await env.VOTE_KV.list({ prefix: K.pollPrefix, cursor, limit: 200 });

  const polls = page.keys.map((k) => ({
    id: k.name.slice(K.pollPrefix.length),
    title: decodeField(k.metadata?.title) || '(제목 없음)',
    type: k.metadata?.type ?? 'choice',
    status: k.metadata?.status ?? 'open',
    round: k.metadata?.round ?? 1,
    createdAt: k.metadata?.createdAt ?? 0,
  }));
  polls.sort((a, b) => b.createdAt - a.createdAt);

  return json({ polls, cursor: page.list_complete ? null : page.cursor });
}

export async function adminDeletePoll(request, env, id) {
  await requireGlobal(request, env);
  await purgePoll(env, id);
  return json({ ok: true });
}
