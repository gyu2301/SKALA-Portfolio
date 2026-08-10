import { hashPassword, randomSalt, requireManage, signToken } from '../lib/auth.js';
import { shortId, timingSafeEqual } from '../lib/crypto.js';
import { HttpError, json, readJson } from '../lib/http.js';
import {
  K,
  deleteByPrefix,
  getBallotMeta,
  getPoll,
  getResult,
  listBallots,
  putPoll,
  withFreshBallot,
} from '../lib/kv.js';
import {
  applyTiebreakChoice,
  closePoll,
  ensureClosed,
  participation,
  publicPoll,
} from '../lib/poll.js';
import { computeIpHash } from '../lib/dedupe.js';
import { assertNotLocked, clearAuthFailures, recordAuthFailure } from '../lib/ratelimit.js';
import { validateCreatePoll } from '../lib/schema.js';
import { canSeeResults, computeTally, redactTally } from '../lib/tally.js';
import { LIMITS } from '../../shared/constants.js';

/** KV metadata 형태의 투표지를 클라이언트가 쓰는 형태로 바꾼다. */
export function ballotToClient(meta) {
  if (!meta) return null;
  return {
    voterId: meta.voterId,
    name: meta.n || '',
    abstain: Boolean(meta.a),
    selections: meta.s || [],
    slots: meta.b || '',
    updatedAt: meta.t || null,
  };
}

async function loadPoll(env, id) {
  const poll = await getPoll(env, id);
  if (!poll) throw new HttpError(404, '투표를 찾을 수 없습니다. 링크가 정확한지 확인해주세요.');
  return poll;
}

export async function createPoll(request, env) {
  const body = await readJson(request);
  const draft = validateCreatePoll(body);

  // id 충돌은 사실상 없지만(32^7), 만에 하나 겹치면 다시 뽑는다.
  let id = shortId();
  for (let i = 0; i < 5 && (await env.VOTE_KV.get(K.poll(id))); i++) id = shortId();

  const salt = randomSalt();
  const poll = {
    id,
    ...draft,
    createdAt: Date.now(),
    closedAt: null,
    round: 1,
    status: 'open',
    activeOptionIds: null,
    activeSlots: null,
    rounds: [],
    adminSalt: salt,
    adminHash: await hashPassword(salt, body.password),
  };

  await putPoll(env, poll);
  const adminToken = await signToken(env, { p: id, r: 'owner' });
  return json({ id, adminToken, poll: publicPoll(poll) }, 201);
}

export async function readPoll(request, env, id, url) {
  const poll = await ensureClosed(env, await loadPoll(env, id));
  const voterId = url.searchParams.get('voterId') || '';

  // list()는 실전에서 새 표가 반영되기까지 수십 초씩 지연될 수 있다. "내 표"는 정확한 키로
  // 따로 읽고 목록에 병합해서, list()가 아직 못 따라잡았어도 내 화면에서는 바로 보이게 한다.
  const [ballots, mine] = await Promise.all([
    listBallots(env, poll.id, poll.round),
    getBallotMeta(env, poll.id, poll.round, voterId),
  ]);
  const merged = withFreshBallot(ballots, mine);

  const visible = canSeeResults(poll, mine);
  const tally = visible ? redactTally(poll, computeTally(poll, merged)) : null;
  const result = poll.status === 'closed' ? await getResult(env, poll.id, poll.round) : null;

  return json({
    poll: publicPoll(poll),
    myBallot: ballotToClient(mine),
    participation: participation(poll, merged),
    tally,
    resultsVisible: visible,
    result: result ? { ...result, tally: redactTally(poll, result.tally) } : null,
    serverTime: Date.now(),
  });
}

export async function readRoundResult(request, env, id, round) {
  const poll = await loadPoll(env, id);
  const n = Number(round);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, '라운드 번호가 올바르지 않습니다.');
  const result = await getResult(env, poll.id, n);
  if (!result) throw new HttpError(404, '해당 라운드의 결과가 없습니다.');
  return json({ result: { ...result, tally: redactTally(poll, result.tally) } });
}

export async function authenticatePoll(request, env, id) {
  const poll = await loadPoll(env, id);
  const body = await readJson(request);
  const password = typeof body.password === 'string' ? body.password : '';

  const ipHash = await computeIpHash(env, request, poll.id);
  const scope = `poll:${poll.id}`;
  await assertNotLocked(env, scope, ipHash);

  const candidate = await hashPassword(poll.adminSalt, password);
  if (!timingSafeEqual(candidate, poll.adminHash)) {
    await recordAuthFailure(env, scope, ipHash);
    throw new HttpError(401, '관리 비밀번호가 올바르지 않습니다.');
  }
  await clearAuthFailures(env, scope, ipHash);
  return json({ adminToken: await signToken(env, { p: poll.id, r: 'owner' }) });
}

export async function updatePoll(request, env, id) {
  await requireManage(request, env, id);
  const poll = await loadPoll(env, id);
  const body = await readJson(request);

  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) throw new HttpError(400, '제목을 입력해주세요.');
    if (title.length > LIMITS.TITLE) throw new HttpError(400, `제목은 ${LIMITS.TITLE}자 이내로 입력해주세요.`);
    poll.title = title;
  }
  if (typeof body.description === 'string') {
    if (body.description.length > LIMITS.DESCRIPTION) {
      throw new HttpError(400, `설명은 ${LIMITS.DESCRIPTION}자 이내로 입력해주세요.`);
    }
    poll.description = body.description.trim();
  }

  await putPoll(env, poll);
  return json({ poll: publicPoll(poll) });
}

export async function deleteOption(request, env, id, optionId) {
  await requireManage(request, env, id);
  const poll = await loadPoll(env, id);

  if (poll.type !== 'choice') throw new HttpError(400, '날짜 조율 투표에는 선택지 삭제가 없습니다.');
  if (poll.status !== 'open') throw new HttpError(409, '마감된 투표는 선택지를 바꿀 수 없습니다.');

  const remaining = poll.options.filter((o) => o.id !== optionId);
  if (remaining.length === poll.options.length) throw new HttpError(404, '선택지를 찾을 수 없습니다.');
  if (remaining.length < 2) throw new HttpError(400, '선택지는 2개 이상 남아 있어야 합니다.');

  poll.options = remaining;
  if (poll.activeOptionIds) {
    poll.activeOptionIds = poll.activeOptionIds.filter((oid) => oid !== optionId);
  }
  await putPoll(env, poll);

  // 삭제된 선택지에 찍힌 표는 집계 단계에서 무시되므로 투표지를 손댈 필요가 없다.
  return json({ poll: publicPoll(poll) });
}

export async function closePollRoute(request, env, id) {
  await requireManage(request, env, id);
  const poll = await loadPoll(env, id);
  if (poll.status !== 'open') throw new HttpError(409, '이미 마감된 투표입니다.');

  const result = await closePoll(env, poll, 'manual');
  return json({ poll: publicPoll(poll), result: { ...result, tally: redactTally(poll, result.tally) } });
}

export async function tiebreakRoute(request, env, id) {
  await requireManage(request, env, id);
  const poll = await loadPoll(env, id);
  const body = await readJson(request);

  const result = await applyTiebreakChoice(env, poll, body.mode);
  return json({ poll: publicPoll(poll), result: { ...result, tally: redactTally(poll, result.tally) } });
}

export async function deletePoll(request, env, id) {
  await requireManage(request, env, id);
  await loadPoll(env, id);
  await purgePoll(env, id);
  return json({ ok: true });
}

/** 투표 본체와 그에 딸린 모든 키(투표지·결과·중복기록)를 지운다. */
export async function purgePoll(env, id) {
  await Promise.all([
    deleteByPrefix(env, K.ballotPollPrefix(id)),
    deleteByPrefix(env, K.resultPrefix(id)),
    deleteByPrefix(env, K.dupPollPrefix(id)),
  ]);
  await env.VOTE_KV.delete(K.poll(id));
}
