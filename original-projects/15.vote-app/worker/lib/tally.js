import { decodeSlots, totalSlots } from '../../shared/slots.js';

/**
 * 이번 라운드에 살아있는 선택지.
 * activeOptionIds가 null이면 전체, 배열이면 재투표로 남은 것만.
 */
export function activeOptions(poll) {
  if (!poll.activeOptionIds) return poll.options;
  const alive = new Set(poll.activeOptionIds);
  return poll.options.filter((o) => alive.has(o.id));
}

/** 이번 라운드에 살아있는 슬롯 인덱스 배열 */
export function activeSlotIndices(poll) {
  const total = totalSlots(poll.schedule);
  if (!poll.activeSlots) return Array.from({ length: total }, (_, i) => i);
  return poll.activeSlots.filter((i) => i >= 0 && i < total);
}

export function computeTally(poll, ballots) {
  return poll.type === 'schedule' ? tallySchedule(poll, ballots) : tallyChoice(poll, ballots);
}

export function tallyChoice(poll, ballots) {
  const options = activeOptions(poll);
  const counts = {};
  const voters = {};
  for (const o of options) {
    counts[o.id] = 0;
    voters[o.id] = [];
  }

  let abstain = 0;
  const abstainNames = [];

  for (const b of ballots) {
    if (b.a) {
      abstain++;
      if (b.n) abstainNames.push(b.n);
      continue;
    }
    // 재투표로 탈락한 선택지에 찍힌 표는 무시된다(이전 라운드 투표지가 남아있을 경우 대비).
    const seen = new Set();
    for (const id of b.s || []) {
      if (!(id in counts) || seen.has(id)) continue;
      seen.add(id);
      counts[id]++;
      if (b.n) voters[id].push(b.n);
    }
  }

  const values = options.map((o) => counts[o.id]);
  const max = values.length ? Math.max(...values) : 0;
  // 아무도 표를 던지지 않았으면 승자가 없다. 0표끼리를 동점으로 보면 안 된다.
  const leaders = max > 0 ? options.filter((o) => counts[o.id] === max).map((o) => o.id) : [];

  return {
    kind: 'choice',
    counts,
    voters,
    abstain,
    abstainNames,
    totalBallots: ballots.length,
    max,
    leaders,
    tied: leaders.length > 1,
  };
}

export function tallySchedule(poll, ballots) {
  const total = totalSlots(poll.schedule);
  const pool = activeSlotIndices(poll);
  const inPool = new Set(pool);

  const counts = new Array(total).fill(0);
  const voters = Array.from({ length: total }, () => []);

  let abstain = 0;
  const abstainNames = [];

  for (const b of ballots) {
    if (b.a) {
      abstain++;
      if (b.n) abstainNames.push(b.n);
      continue;
    }
    for (const i of decodeSlots(b.b, total)) {
      if (!inPool.has(i)) continue;
      counts[i]++;
      if (b.n) voters[i].push(b.n);
    }
  }

  const max = pool.length ? Math.max(...pool.map((i) => counts[i])) : 0;
  const leaders = max > 0 ? pool.filter((i) => counts[i] === max) : [];

  return {
    kind: 'schedule',
    counts,
    voters,
    abstain,
    abstainNames,
    totalBallots: ballots.length,
    max,
    leaders,
    tied: leaders.length > 1,
  };
}

/**
 * 결과 공개 정책. 프론트에서 숨기는 방식은 개발자도구로 뚫리므로 서버에서 강제한다.
 */
export function canSeeResults(poll, myBallot) {
  if (poll.status === 'closed') return true;
  switch (poll.settings.resultVisibility) {
    case 'always':
      return true;
    case 'afterVote':
      return Boolean(myBallot);
    case 'afterClose':
      return false;
    default:
      return false;
  }
}

/** 익명 투표에서는 이름이 붙은 필드를 응답에서 제거한다. */
export function redactTally(poll, tally) {
  if (!tally) return null;
  if (!poll.settings.anonymous) return tally;
  const { voters, abstainNames, ...rest } = tally;
  return rest;
}
