import { describe, expect, it } from 'vitest';
import { decodeSlots, encodeSlots, describeSlot, slotsPerDay, totalSlots } from '../shared/slots.js';
import { LIMITS } from '../shared/constants.js';
import { tallyChoice, tallySchedule, canSeeResults, redactTally } from '../worker/lib/tally.js';
import { ballotSetHash, pickWinnerIndex } from '../worker/lib/tiebreak.js';

const env = { AUTH_SECRET: 'test-auth-secret' };

function choicePoll(overrides = {}) {
  return {
    id: 'p1',
    type: 'choice',
    options: [
      { id: 'o1', label: '김치찌개' },
      { id: 'o2', label: '돈까스' },
      { id: 'o3', label: '파스타' },
    ],
    activeOptionIds: null,
    settings: { anonymous: false, resultVisibility: 'afterVote' },
    status: 'open',
    ...overrides,
  };
}

describe('slots 비트마스크', () => {
  const schedule = { dates: ['2026-08-12', '2026-08-13'], startMin: 660, endMin: 840, slotMin: 30 };

  it('하루 슬롯 수와 전체 슬롯 수를 계산한다', () => {
    expect(slotsPerDay(schedule)).toBe(6); // 11:00~14:00, 30분 단위
    expect(totalSlots(schedule)).toBe(12);
  });

  it('인코딩과 디코딩이 왕복한다', () => {
    const picked = [0, 3, 5, 11];
    expect(decodeSlots(encodeSlots(picked, 12), 12)).toEqual(picked);
  });

  it('범위를 벗어난 인덱스는 버린다', () => {
    expect(decodeSlots(encodeSlots([-1, 2, 99], 12), 12)).toEqual([2]);
  });

  it('최대 규모에서도 metadata 한도 안에 들어간다', () => {
    const big = { dates: Array.from({ length: 14 }, (_, i) => `2026-08-${String(i + 1).padStart(2, '0')}`), startMin: 0, endMin: 1440, slotMin: 30 };
    const total = totalSlots(big);
    expect(total).toBe(LIMITS.MAX_SLOTS);

    const all = Array.from({ length: total }, (_, i) => i);
    const metadata = { n: '가'.repeat(LIMITS.NAME), b: encodeSlots(all, total), t: Date.now() };
    const bytes = new TextEncoder().encode(JSON.stringify(metadata)).length;
    expect(bytes).toBeLessThan(LIMITS.METADATA_BYTES);
  });

  it('슬롯 인덱스를 날짜/시간으로 되돌린다', () => {
    expect(describeSlot(schedule, 7)).toMatchObject({ dayIdx: 1, rowIdx: 1, date: '2026-08-13', startMin: 690 });
  });
});

describe('tallyChoice', () => {
  it('복수선택과 기권을 함께 집계한다', () => {
    const poll = choicePoll();
    const t = tallyChoice(poll, [
      { voterId: 'v1', n: '가', s: ['o1', 'o2'] },
      { voterId: 'v2', n: '나', s: ['o1'] },
      { voterId: 'v3', n: '다', a: 1 },
    ]);
    expect(t.counts).toEqual({ o1: 2, o2: 1, o3: 0 });
    expect(t.abstain).toBe(1);
    expect(t.abstainNames).toEqual(['다']);
    expect(t.totalBallots).toBe(3);
    expect(t.leaders).toEqual(['o1']);
    expect(t.tied).toBe(false);
    expect(t.voters.o1).toEqual(['가', '나']);
  });

  it('한 투표지 안의 중복 선택은 한 번만 센다', () => {
    const t = tallyChoice(choicePoll(), [{ voterId: 'v1', s: ['o1', 'o1', 'o1'] }]);
    expect(t.counts.o1).toBe(1);
  });

  it('동점이면 leaders가 여러 개다', () => {
    const t = tallyChoice(choicePoll(), [
      { voterId: 'v1', s: ['o1'] },
      { voterId: 'v2', s: ['o2'] },
    ]);
    expect(t.leaders.sort()).toEqual(['o1', 'o2']);
    expect(t.tied).toBe(true);
  });

  it('아무도 표를 던지지 않으면 승자가 없다 (0표끼리는 동점이 아니다)', () => {
    const t = tallyChoice(choicePoll(), [{ voterId: 'v1', a: 1 }]);
    expect(t.leaders).toEqual([]);
    expect(t.tied).toBe(false);
    expect(t.max).toBe(0);
  });

  it('재투표 라운드에서는 살아있는 선택지만 집계한다', () => {
    const poll = choicePoll({ activeOptionIds: ['o1', 'o2'] });
    const t = tallyChoice(poll, [
      { voterId: 'v1', s: ['o3'] }, // 탈락한 선택지 -> 무시
      { voterId: 'v2', s: ['o1'] },
    ]);
    expect(t.counts).toEqual({ o1: 1, o2: 0 });
    expect(t.leaders).toEqual(['o1']);
  });
});

describe('tallySchedule', () => {
  const schedule = { dates: ['2026-08-12'], startMin: 660, endMin: 840, slotMin: 30 };
  const poll = { type: 'schedule', schedule, activeSlots: null, settings: { anonymous: false } };

  it('슬롯별 겹치는 인원을 센다', () => {
    const t = tallySchedule(poll, [
      { voterId: 'v1', n: '가', b: encodeSlots([0, 1, 2], 6) },
      { voterId: 'v2', n: '나', b: encodeSlots([1, 2, 3], 6) },
      { voterId: 'v3', n: '다', b: encodeSlots([2], 6) },
    ]);
    expect(t.counts).toEqual([1, 2, 3, 1, 0, 0]);
    expect(t.leaders).toEqual([2]);
    expect(t.voters[2]).toEqual(['가', '나', '다']);
  });

  it('최다 슬롯이 여러 개면 동점 처리된다', () => {
    const t = tallySchedule(poll, [{ voterId: 'v1', b: encodeSlots([0, 4], 6) }]);
    expect(t.leaders).toEqual([0, 4]);
    expect(t.tied).toBe(true);
  });
});

describe('결과 공개 정책', () => {
  it('afterVote는 투표해야 보인다', () => {
    const poll = choicePoll({ settings: { resultVisibility: 'afterVote' } });
    expect(canSeeResults(poll, null)).toBe(false);
    expect(canSeeResults(poll, { voterId: 'v1' })).toBe(true);
  });

  it('afterClose는 마감 전에는 투표해도 안 보인다', () => {
    const poll = choicePoll({ settings: { resultVisibility: 'afterClose' } });
    expect(canSeeResults(poll, { voterId: 'v1' })).toBe(false);
    expect(canSeeResults({ ...poll, status: 'closed' }, null)).toBe(true);
  });

  it('익명 투표에서는 이름 필드를 지운다', () => {
    const poll = choicePoll({ settings: { anonymous: true } });
    const t = redactTally(poll, tallyChoice(poll, [{ voterId: 'v1', n: '가', s: ['o1'] }]));
    expect(t.counts.o1).toBe(1);
    expect(t.voters).toBeUndefined();
    expect(t.abstainNames).toBeUndefined();
  });
});

describe('무승부 룰렛', () => {
  it('같은 입력이면 항상 같은 승자를 뽑는다', async () => {
    const hash = await ballotSetHash([{ voterId: 'v2' }, { voterId: 'v1' }]);
    const runs = await Promise.all(
      Array.from({ length: 10 }, () => pickWinnerIndex(env, 'p1', 1, hash, 3)),
    );
    expect(new Set(runs).size).toBe(1);
  });

  it('투표지 순서가 달라도 같은 해시가 나온다', async () => {
    const a = await ballotSetHash([{ voterId: 'v1' }, { voterId: 'v2' }]);
    const b = await ballotSetHash([{ voterId: 'v2' }, { voterId: 'v1' }]);
    expect(a).toBe(b);
  });

  it('라운드가 다르면 다른 승자가 나올 수 있다', async () => {
    const hash = await ballotSetHash([{ voterId: 'v1' }]);
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, r) => pickWinnerIndex(env, 'p1', r + 1, hash, 4)),
    );
    expect(new Set(results).size).toBeGreaterThan(1);
  });

  it('항상 후보 범위 안의 인덱스를 돌려준다', async () => {
    for (let i = 0; i < 30; i++) {
      const hash = await ballotSetHash([{ voterId: `v${i}` }]);
      const idx = await pickWinnerIndex(env, 'p1', 1, hash, 5);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5);
    }
  });
});
