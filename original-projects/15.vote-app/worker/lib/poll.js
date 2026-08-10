import { getResult, listBallots, putPoll, putResult } from './kv.js';
import { computeTally } from './tally.js';
import { ballotSetHash, pickWinnerIndex } from './tiebreak.js';
import { HttpError } from './http.js';

/** 관리 비밀번호 해시 등 밖으로 나가면 안 되는 필드를 제거한다. */
export function publicPoll(poll) {
  const { adminHash, adminSalt, ...rest } = poll;
  return rest;
}

export function isDue(poll) {
  return Boolean(poll.settings.closeAt) && Date.now() >= poll.settings.closeAt;
}

/**
 * 마감 시각이 지났으면 마감 처리한다.
 * Cron Trigger 없이, 투표를 읽을 때마다 확인하는 지연 평가 방식.
 */
export async function ensureClosed(env, poll) {
  if (poll.status === 'open' && isDue(poll)) {
    await closePoll(env, poll, 'deadline');
  }
  return poll;
}

/**
 * 현재 라운드를 마감하고 그 시점의 집계를 동결 저장한다.
 * poll 객체는 제자리에서(in-place) 갱신된다.
 */
export async function closePoll(env, poll, reason) {
  const ballots = await listBallots(env, poll.id, poll.round);
  const tally = computeTally(poll, ballots);
  const setHash = await ballotSetHash(ballots);

  const result = {
    pollId: poll.id,
    round: poll.round,
    closedAt: Date.now(),
    reason,
    tally,
    leaders: tally.leaders,
    tied: tally.tied,
    setHash,
    winner: null,
    tiebreak: null,
    rouletteIndex: null,
    // manual 모드에서 관리자가 룰렛/재투표를 고를 때까지 대기하는 상태
    pending: false,
  };

  if (tally.leaders.length === 1) {
    result.winner = tally.leaders[0];
  } else if (tally.leaders.length > 1) {
    const mode = poll.settings.tiebreak;
    if (mode === 'roulette') {
      await applyRoulette(env, result);
    } else if (mode === 'runoff') {
      result.tiebreak = 'runoff';
    } else {
      result.pending = true;
    }
  }

  poll.status = 'closed';
  poll.closedAt = result.closedAt;

  await putResult(env, result);
  if (result.tiebreak === 'runoff') startRunoff(poll, result.leaders);
  await putPoll(env, poll);

  return result;
}

async function applyRoulette(env, result) {
  const idx = await pickWinnerIndex(env, result.pollId, result.round, result.setHash, result.leaders.length);
  result.rouletteIndex = idx;
  result.winner = result.leaders[idx];
  result.tiebreak = 'roulette';
}

/** 동점 항목만 남기고 다음 라운드를 연다. URL은 그대로 유지된다. */
function startRunoff(poll, leaders) {
  poll.rounds = [...(poll.rounds || []), { round: poll.round, tiebreak: 'runoff', closedAt: poll.closedAt }];
  poll.round += 1;
  poll.status = 'open';
  poll.closedAt = null;
  if (poll.type === 'choice') {
    poll.activeOptionIds = leaders;
  } else {
    poll.activeSlots = leaders;
  }
  // 원래 투표에 마감 시간이 있었다면 재투표 라운드에도 같은 길이를 다시 준다.
  // 없었다면 null로 두고 수동 마감이나 전원 완료로 끝낸다.
  poll.settings.closeAt = poll.settings.roundDurationMs ? Date.now() + poll.settings.roundDurationMs : null;
}

/** manual 모드에서 관리자가 룰렛/재투표를 고를 때 호출한다. */
export async function applyTiebreakChoice(env, poll, mode) {
  const result = await getResult(env, poll.id, poll.round);
  if (!result || !result.pending) {
    throw new HttpError(409, '무승부 처리를 기다리는 상태가 아닙니다.');
  }
  if (mode === 'roulette') {
    await applyRoulette(env, result);
  } else if (mode === 'runoff') {
    result.tiebreak = 'runoff';
  } else {
    throw new HttpError(400, '무승부 처리 방식이 올바르지 않습니다.');
  }
  result.pending = false;

  await putResult(env, result);
  if (mode === 'runoff') {
    startRunoff(poll, result.leaders);
    await putPoll(env, poll);
  }
  return result;
}

/**
 * 명단 전원이 투표를 마쳤으면 자동 마감한다.
 *
 * justVotedName을 따로 받는 이유: KV는 결과적 일관성이라 방금 쓴 투표지가
 * 바로 뒤따르는 list()에 안 보일 수 있다. 그 한 표를 손으로 더해준다.
 */
export async function maybeCloseWhenAllVoted(env, poll, justVotedName) {
  const s = poll.settings;
  if (poll.status !== 'open') return null;
  if (!s.closeWhenAllVoted || s.anonymous || poll.roster.length === 0) return null;

  const ballots = await listBallots(env, poll.id, poll.round);
  const voted = new Set(ballots.map((b) => b.n).filter(Boolean));
  if (justVotedName) voted.add(justVotedName);

  if (poll.roster.every((name) => voted.has(name))) {
    return closePoll(env, poll, 'allVoted');
  }
  return null;
}

/** 명단 대비 참여 현황. 익명 투표에서는 인원수만 돌려준다. */
export function participation(poll, ballots) {
  if (poll.settings.anonymous) {
    return { total: ballots.length, voted: null, missing: null, roster: [] };
  }
  const voted = ballots.map((b) => b.n).filter(Boolean);
  const votedSet = new Set(voted);
  return {
    total: ballots.length,
    voted,
    roster: poll.roster,
    missing: poll.roster.length ? poll.roster.filter((n) => !votedSet.has(n)) : null,
  };
}
