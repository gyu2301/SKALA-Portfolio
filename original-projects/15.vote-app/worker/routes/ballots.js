import { encodeSlots, totalSlots } from '../../shared/slots.js';
import { assertNameAvailable, checkAndRecordIp, computeIpHash } from '../lib/dedupe.js';
import { HttpError, json, readJson } from '../lib/http.js';
import {
  K,
  assertMetadataFits,
  encodeField,
  getBallotMeta,
  listBallots,
  withFreshBallot,
  withoutVoter,
} from '../lib/kv.js';
import {
  ensureClosed,
  maybeCloseWhenAllVoted,
  participation,
  publicPoll,
} from '../lib/poll.js';
import { getPoll, getResult } from '../lib/kv.js';
import { validateBallot } from '../lib/schema.js';
import { canSeeResults, computeTally, redactTally } from '../lib/tally.js';
import { ballotToClient } from './polls.js';

async function loadOpenPoll(env, id) {
  const poll = await getPoll(env, id);
  if (!poll) throw new HttpError(404, '투표를 찾을 수 없습니다.');
  await ensureClosed(env, poll);
  if (poll.status !== 'open') throw new HttpError(409, '마감된 투표입니다. 더 이상 참여할 수 없습니다.');
  return poll;
}

/**
 * 투표/취소 후 클라이언트가 바로 화면을 갱신할 수 있도록 GET과 같은 모양으로 응답한다.
 *
 * list()는 방금 쓴/지운 표를 곧바로 못 볼 수 있다(실전에서 수십 초 지연 관측됨). 그래서
 * "방금 무슨 일이 있었는지"를 이미 알고 있는 이 함수에서는 list() 결과를 그대로 믿지 않고
 * freshEntry를 병합(또는 voterId를 제거)해서, 투표 직후 본인 화면에서 결과가 안 보이거나
 * 방금 낸 표가 사라져 보이는 일이 없게 한다.
 */
async function viewAfterWrite(env, poll, voterId, freshEntry) {
  const ballots = await listBallots(env, poll.id, poll.round);
  const merged = freshEntry ? withFreshBallot(ballots, freshEntry) : withoutVoter(ballots, voterId);
  const mine = freshEntry || null;
  const visible = canSeeResults(poll, mine);
  const result = poll.status === 'closed' ? await getResult(env, poll.id, poll.round) : null;

  return {
    poll: publicPoll(poll),
    myBallot: ballotToClient(mine),
    participation: participation(poll, merged),
    tally: visible ? redactTally(poll, computeTally(poll, merged)) : null,
    resultsVisible: visible,
    result: result ? { ...result, tally: redactTally(poll, result.tally) } : null,
    serverTime: Date.now(),
  };
}

export async function castBallot(request, env, id) {
  const poll = await loadOpenPoll(env, id);
  const body = await readJson(request);
  const ballot = validateBallot(poll, body);

  // "이미 투표했는지"는 list()가 아니라 정확한 키로 직접 확인한다. list()는 방금 쓴 표를
  // 곧바로 못 볼 수 있어서(실전에서 수십 초 지연 관측됨), 그 틈에 재투표 금지 설정이
  // 무력화되고 같은 사람이 한 번 더 투표해버릴 수 있기 때문이다.
  const [existing, mine] = await Promise.all([
    listBallots(env, poll.id, poll.round),
    getBallotMeta(env, poll.id, poll.round, ballot.voterId),
  ]);

  if (mine && !poll.settings.allowChange) {
    throw new HttpError(409, '이 투표는 한 번 참여하면 수정할 수 없습니다.');
  }
  assertNameAvailable(poll, existing, ballot);

  const ipHash = await computeIpHash(env, request, poll.id);
  await checkAndRecordIp(env, poll, ipHash, ballot.voterId);

  // 집계에 필요한 최소 정보만 metadata에 담는다. list()가 이걸 함께 돌려주므로
  // 결과를 낼 때 get() 호출이 한 번도 필요 없다.
  const metadata = { t: Date.now() };
  if (ballot.name) metadata.n = encodeField(ballot.name);
  if (ballot.abstain) {
    metadata.a = 1;
  } else if (poll.type === 'choice') {
    metadata.s = ballot.selections;
  } else {
    metadata.b = encodeSlots(ballot.slots, totalSlots(poll.schedule));
  }
  assertMetadataFits(metadata);

  await env.VOTE_KV.put(
    K.ballot(poll.id, poll.round, ballot.voterId),
    JSON.stringify({ ...ballot, updatedAt: metadata.t }),
    { metadata },
  );

  await maybeCloseWhenAllVoted(env, poll, ballot.name);

  // list()로 다시 찾지 않고, 방금 쓴 내용을 그대로 "내 표"로 돌려준다.
  const freshEntry = { ...metadata, voterId: ballot.voterId, n: ballot.name };
  return json(await viewAfterWrite(env, poll, ballot.voterId, freshEntry));
}

export async function retractBallot(request, env, id, url) {
  const poll = await loadOpenPoll(env, id);
  const voterId = url.searchParams.get('voterId') || '';
  if (!voterId) throw new HttpError(400, '참여자 식별자가 필요합니다.');
  if (!poll.settings.allowChange) {
    throw new HttpError(409, '이 투표는 참여 후 취소할 수 없습니다.');
  }

  await env.VOTE_KV.delete(K.ballot(poll.id, poll.round, voterId));
  return json(await viewAfterWrite(env, poll, voterId));
}
