import { LIMITS } from '../../shared/constants.js';
import { b64urlDecode, b64urlEncode } from './crypto.js';
import { HttpError } from './http.js';

// KV metadata는 내부적으로 HTTP 헤더(CF-KV-Metadata)로 실려 나간다.
// 헤더 값에 한글 같은 비ASCII를 그대로 넣는 건 Fetch 명세를 벗어나는 동작이라
// 이름·제목처럼 사용자가 입력한 문자열은 base64로 감싸 ASCII만 남긴다.
export const encodeField = (s) => (s ? b64urlEncode(s) : '');
export const decodeField = (s) => {
  if (!s) return '';
  try {
    return b64urlDecode(s);
  } catch {
    return '';
  }
};

export const K = {
  poll: (id) => `poll:${id}`,
  pollPrefix: 'poll:',
  ballot: (id, round, voterId) => `ballot:${id}:${round}:${voterId}`,
  ballotPrefix: (id, round) => `ballot:${id}:${round}:`,
  ballotPollPrefix: (id) => `ballot:${id}:`,
  result: (id, round) => `result:${id}:${round}`,
  resultPrefix: (id) => `result:${id}:`,
  dup: (id, round, ipHash) => `dup:${id}:${round}:${ipHash}`,
  dupPollPrefix: (id) => `dup:${id}:`,
};

export async function getPoll(env, id) {
  const raw = await env.VOTE_KV.get(K.poll(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function putPoll(env, poll) {
  await env.VOTE_KV.put(K.poll(poll.id), JSON.stringify(poll), {
    // 전역 관리자 목록 화면이 값 전체를 읽지 않고도 목록을 그릴 수 있도록 요약을 붙인다.
    metadata: {
      title: encodeField(poll.title.slice(0, 80)),
      type: poll.type,
      status: poll.status,
      createdAt: poll.createdAt,
      round: poll.round,
    },
  });
}

/**
 * 한 라운드의 모든 투표지를 가져온다.
 *
 * list()가 각 키의 metadata를 함께 반환하므로 get() 호출이 0회다.
 * 이게 이 설계의 핵심 -- 투표지를 키 하나씩 나눠 저장해 쓰기 충돌을 없애면서도,
 * 집계할 때 서브리퀘스트 한도(무료 플랜 50/요청)에 걸리지 않는다.
 */
export async function listBallots(env, pollId, round) {
  const prefix = K.ballotPrefix(pollId, round);
  const out = [];
  let cursor;
  do {
    const page = await env.VOTE_KV.list({ prefix, cursor, limit: 1000 });
    for (const key of page.keys) {
      if (!key.metadata) continue; // metadata 없이 쓰인 키는 집계할 수 없으므로 건너뛴다
      // 이름은 저장 경계에서 한 번만 디코딩한다. 이후 집계·중복검사 코드는 평문만 다룬다.
      out.push({
        ...key.metadata,
        voterId: key.name.slice(prefix.length),
        n: decodeField(key.metadata.n),
      });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

/**
 * 특정 투표자의 투표지 하나만 정확한 키로 읽는다.
 *
 * list()는 실전에서 새 쓰기가 반영되기까지 수십 초씩 지연될 수 있지만(운영 환경에서 최대 30~60초
 * 관측됨), 정확한 키를 지정한 get()은 같은 조건에서 훨씬 빠르게 일관된다. "내가 방금 던진 표"처럼
 * 정확히 어떤 키를 볼지 아는 경우에는 list()로 찾지 말고 이 함수로 직접 읽어야
 * 투표 직후 본인 화면에서 방금 낸 표가 사라져 보이는 문제를 피할 수 있다.
 */
export async function getBallotMeta(env, pollId, round, voterId) {
  if (!voterId) return null;
  const { metadata } = await env.VOTE_KV.getWithMetadata(K.ballot(pollId, round, voterId));
  if (!metadata) return null;
  return { ...metadata, voterId, n: decodeField(metadata.n) };
}

/**
 * 방금 확인한 투표지(fresh)를 집계용 목록에 병합한다.
 * list()가 아직 그 표를 못 봤더라도, 집계와 "누가 투표했는지" 현황에서 빠지지 않게 한다.
 */
export function withFreshBallot(ballots, fresh) {
  if (!fresh) return ballots;
  return [...ballots.filter((b) => b.voterId !== fresh.voterId), fresh];
}

/** 방금 취소한 투표자를 목록에서 제거한다. list()에 삭제가 아직 반영되지 않았을 수 있어서 필요하다. */
export function withoutVoter(ballots, voterId) {
  return ballots.filter((b) => b.voterId !== voterId);
}

/** metadata가 KV 한도를 넘지 않는지 미리 검사한다. 넘으면 put이 실패한다. */
export function assertMetadataFits(metadata) {
  const size = new TextEncoder().encode(JSON.stringify(metadata)).length;
  if (size > LIMITS.METADATA_BYTES) {
    throw new HttpError(400, '선택 항목이 너무 많습니다. 개수를 줄여주세요.');
  }
  return size;
}

/** prefix에 해당하는 모든 키를 지운다. 투표 삭제에 쓴다. */
export async function deleteByPrefix(env, prefix) {
  let cursor;
  let deleted = 0;
  do {
    const page = await env.VOTE_KV.list({ prefix, cursor, limit: 1000 });
    await Promise.all(page.keys.map((k) => env.VOTE_KV.delete(k.name)));
    deleted += page.keys.length;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return deleted;
}

export async function getResult(env, pollId, round) {
  const raw = await env.VOTE_KV.get(K.result(pollId, round));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function putResult(env, result) {
  await env.VOTE_KV.put(K.result(result.pollId, result.round), JSON.stringify(result));
}
