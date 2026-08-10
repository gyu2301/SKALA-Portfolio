import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { decodeSlots } from '../shared/slots.js';

const BASE = 'https://vote.test';

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await SELF.fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* 본문이 JSON이 아닐 수 있다 */
  }
  return { status: res.status, data, text };
}

function menuOptions() {
  return [
    { label: '김치찌개', place: '한솥밥', priceBand: '7to10' },
    { label: '돈까스', place: '카츠야', priceBand: '10to15' },
    { label: '파스타' },
  ];
}

async function createPoll(overrides = {}) {
  const res = await api('/api/polls', {
    method: 'POST',
    body: {
      type: 'choice',
      title: '오늘 점심',
      password: 'pw123456',
      options: menuOptions(),
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50 },
      ...overrides,
    },
  });
  expect(res.status, res.text).toBe(201);
  return res.data;
}

function vote(id, voterId, selections, extra = {}) {
  return api(`/api/polls/${id}/ballots`, {
    method: 'POST',
    body: { voterId, selections, ...extra },
  });
}

describe('투표 생성과 참여', () => {
  it('생성 → 조회 → 투표 → 집계까지 이어진다', async () => {
    const { id, poll } = await createPoll();
    expect(poll.options).toHaveLength(3);
    expect(poll.options[0]).toMatchObject({ id: 'o1', label: '김치찌개', place: '한솥밥', priceBand: '7to10' });
    expect(poll.adminHash).toBeUndefined(); // 비밀번호 해시가 새어나가면 안 된다

    const voted = await vote(id, 'v1', ['o1']);
    expect(voted.status).toBe(200);
    expect(voted.data.tally.counts).toEqual({ o1: 1, o2: 0, o3: 0 });

    const read = await api(`/api/polls/${id}?voterId=v1`);
    expect(read.data.myBallot.selections).toEqual(['o1']);
    expect(read.data.tally.counts.o1).toBe(1);
  });

  it('allowChange를 켜면 같은 사람이 다시 투표해도 표가 늘지 않고 바뀐다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50, allowChange: true },
    });
    await vote(id, 'v1', ['o1']);
    const second = await vote(id, 'v1', ['o2']);
    expect(second.data.tally.counts).toEqual({ o1: 0, o2: 1, o3: 0 });
    expect(second.data.participation.total).toBe(1);
  });

  it('기본값(allowChange 지정 안 함)은 한 번만 투표할 수 있다', async () => {
    const { id } = await createPoll();
    expect((await vote(id, 'v1', ['o1'])).status).toBe(200);
    const second = await vote(id, 'v1', ['o2']);
    expect(second.status).toBe(409);
    expect(second.data.error).toContain('수정할 수 없습니다');

    // 다른 사람의 투표는 당연히 영향받지 않는다
    expect((await vote(id, 'v2', ['o2'])).status).toBe(200);
    const read = await api(`/api/polls/${id}`);
    expect(read.data.tally.counts).toEqual({ o1: 1, o2: 1, o3: 0 });
  });

  it('allowChange가 꺼져 있으면 참여 취소도 할 수 없다', async () => {
    const { id } = await createPoll();
    await vote(id, 'v1', ['o1']);
    const res = await api(`/api/polls/${id}/ballots/mine?voterId=v1`, { method: 'DELETE' });
    expect(res.status).toBe(409);
  });

  it('복수선택을 끄면 2개 이상 고를 수 없다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, multiSelect: { enabled: false } },
    });
    const res = await vote(id, 'v1', ['o1', 'o2']);
    expect(res.status).toBe(400);
    expect(res.data.error).toContain('하나만');
  });

  it('복수선택 최대 개수를 넘기면 거절한다', async () => {
    const { id } = await createPoll({
      settings: {
        resultVisibility: 'always',
        anonymous: true,
        multiSelect: { enabled: true, max: 2 },
      },
    });
    expect((await vote(id, 'v1', ['o1', 'o2', 'o3'])).status).toBe(400);
    expect((await vote(id, 'v1', ['o1', 'o2'])).status).toBe(200);
  });

  it('기권을 허용하지 않으면 기권할 수 없다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, allowAbstain: false },
    });
    const res = await api(`/api/polls/${id}/ballots`, {
      method: 'POST',
      body: { voterId: 'v1', abstain: true },
    });
    expect(res.status).toBe(400);
  });

  it('투표를 취소하면 집계에서 빠진다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50, allowChange: true },
    });
    await vote(id, 'v1', ['o1']);
    const res = await api(`/api/polls/${id}/ballots/mine?voterId=v1`, { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(res.data.tally.counts.o1).toBe(0);
    expect(res.data.myBallot).toBeNull();
  });

  it('실제 프론트가 보내는 대로 multiSelect:{enabled:false,max:0}을 보내도 생성된다', async () => {
    // 회귀 테스트: CreatePoll.jsx는 복수선택을 켜지 않으면 max:0을 명시적으로 보낸다.
    // 예전 코드는 0을 "값 없음"이 아니라 "잘못된 값"으로 취급해 기본 생성 흐름 전체가 막혔었다.
    const res = await api('/api/polls', {
      method: 'POST',
      body: {
        type: 'choice',
        title: '기본 설정 그대로',
        password: 'pw123456',
        options: menuOptions(),
        settings: {
          anonymous: false,
          allowAbstain: true,
          allowChange: true,
          multiSelect: { enabled: false, max: 0 },
          resultVisibility: 'afterVote',
          tiebreak: 'manual',
        },
      },
    });
    expect(res.status, res.text).toBe(201);
    expect(res.data.poll.settings.multiSelect).toEqual({ enabled: false, max: 0 });
  });

  it('선택지를 2개 미만으로 만들면 생성이 거절된다', async () => {
    const res = await api('/api/polls', {
      method: 'POST',
      body: { title: '하나뿐', password: 'pw123456', options: [{ label: '혼자' }] },
    });
    expect(res.status).toBe(400);
  });

  it('짧은 관리 비밀번호는 이유를 알 수 있는 메시지로 거절된다', async () => {
    const res = await api('/api/polls', {
      method: 'POST',
      body: { title: '짧은 비번', password: '1234', options: menuOptions() },
    });
    expect(res.status).toBe(400);
    // "입력해주세요"가 아니라 몇 자 이상이어야 하는지 구체적으로 알려줘야 한다.
    expect(res.data.error).toContain('8자 이상');
  });

  it('없는 투표는 404다', async () => {
    expect((await api('/api/polls/nope123')).status).toBe(404);
  });

  it('테마를 지정하지 않으면 simple이 기본값이다', async () => {
    const { poll } = await createPoll();
    expect(poll.settings.theme).toBe('simple');
  });

  it.each(['sticker', 'chat', 'arcade'])('테마를 %s로 지정할 수 있다', async (theme) => {
    const { poll } = await createPoll({ settings: { resultVisibility: 'always', anonymous: true, theme } });
    expect(poll.settings.theme).toBe(theme);
  });

  it('알 수 없는 테마는 거절된다', async () => {
    const res = await api('/api/polls', {
      method: 'POST',
      body: {
        title: '이상한 테마',
        password: 'pw123456',
        options: menuOptions(),
        settings: { theme: 'space-pirate' },
      },
    });
    expect(res.status).toBe(400);
  });
});

describe('동시 투표에서 표가 유실되지 않는다', () => {
  // 이 설계(투표 1건 = KV 키 1개)의 존재 이유를 지키는 테스트.
  // 집계값을 한 키에 모아 read-modify-write 했다면 여기서 표가 사라진다.
  it('20명이 동시에 투표해도 20표가 모두 집계된다', async () => {
    const { id } = await createPoll();

    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => vote(id, `v${i}`, [i % 2 === 0 ? 'o1' : 'o2'])),
    );
    expect(results.every((r) => r.status === 200)).toBe(true);

    const read = await api(`/api/polls/${id}`);
    expect(read.data.participation.total).toBe(20);
    expect(read.data.tally.counts.o1).toBe(10);
    expect(read.data.tally.counts.o2).toBe(10);
  });
});

describe('결과 공개 정책은 서버가 강제한다', () => {
  it('afterVote: 투표 전에는 응답에 집계가 없다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'afterVote', anonymous: true, maxPerIp: 50 },
    });
    await vote(id, 'other', ['o1']);

    const before = await api(`/api/polls/${id}?voterId=me`);
    expect(before.data.tally).toBeNull();
    expect(before.data.resultsVisible).toBe(false);
    expect(before.text).not.toContain('counts');

    await vote(id, 'me', ['o2']);
    const after = await api(`/api/polls/${id}?voterId=me`);
    expect(after.data.tally.counts.o1).toBe(1);
  });

  it('afterClose: 투표해도 마감 전에는 안 보인다', async () => {
    const { id, adminToken } = await createPoll({
      settings: { resultVisibility: 'afterClose', anonymous: true, maxPerIp: 50 },
    });
    await vote(id, 'v1', ['o1']);
    expect((await api(`/api/polls/${id}?voterId=v1`)).data.tally).toBeNull();

    await api(`/api/polls/${id}/close`, { method: 'POST', token: adminToken });
    const after = await api(`/api/polls/${id}?voterId=v1`);
    expect(after.data.tally.counts.o1).toBe(1);
  });
});

describe('관리자 권한', () => {
  it('토큰 없이 수정·삭제·마감을 시도하면 403이다', async () => {
    const { id } = await createPoll();
    expect((await api(`/api/polls/${id}`, { method: 'PATCH', body: { title: 'x' } })).status).toBe(403);
    expect((await api(`/api/polls/${id}`, { method: 'DELETE' })).status).toBe(403);
    expect((await api(`/api/polls/${id}/close`, { method: 'POST' })).status).toBe(403);
    expect((await api(`/api/polls/${id}/options/o1`, { method: 'DELETE' })).status).toBe(403);
  });

  it('비밀번호가 맞아야 관리 토큰이 나온다', async () => {
    const { id } = await createPoll();
    expect((await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'wrong' } })).status).toBe(401);

    const ok = await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'pw123456' } });
    expect(ok.status).toBe(200);

    const patched = await api(`/api/polls/${id}`, {
      method: 'PATCH',
      body: { title: '바뀐 제목' },
      token: ok.data.adminToken,
    });
    expect(patched.data.poll.title).toBe('바뀐 제목');
  });

  it('다른 투표의 관리 토큰으로는 접근할 수 없다', async () => {
    const a = await createPoll();
    const b = await createPoll();
    const res = await api(`/api/polls/${b.id}`, {
      method: 'PATCH',
      body: { title: '침입' },
      token: a.adminToken,
    });
    expect(res.status).toBe(403);
  });

  it('위조한 토큰은 거절된다', async () => {
    const { id, adminToken } = await createPoll();
    const forged = `${adminToken.split('.')[0]}.${'0'.repeat(64)}`;
    expect((await api(`/api/polls/${id}/close`, { method: 'POST', token: forged })).status).toBe(403);
  });

  it('선택지를 지우면 그 선택지의 표는 집계에서 사라진다', async () => {
    const { id, adminToken } = await createPoll();
    await vote(id, 'v1', ['o1']);
    await vote(id, 'v2', ['o2']);

    const res = await api(`/api/polls/${id}/options/o1`, { method: 'DELETE', token: adminToken });
    expect(res.status).toBe(200);
    expect(res.data.poll.options.map((o) => o.id)).toEqual(['o2', 'o3']);

    const read = await api(`/api/polls/${id}`);
    expect(read.data.tally.counts).toEqual({ o2: 1, o3: 0 });
  });

  it('선택지가 2개 미만으로 남게 되는 삭제는 막는다', async () => {
    const { id, adminToken } = await createPoll();
    await api(`/api/polls/${id}/options/o1`, { method: 'DELETE', token: adminToken });
    const res = await api(`/api/polls/${id}/options/o2`, { method: 'DELETE', token: adminToken });
    expect(res.status).toBe(400);
  });

  it('투표를 삭제하면 투표지까지 함께 지워진다', async () => {
    const { id, adminToken } = await createPoll();
    await vote(id, 'v1', ['o1']);
    expect((await api(`/api/polls/${id}`, { method: 'DELETE', token: adminToken })).status).toBe(200);
    expect((await api(`/api/polls/${id}`)).status).toBe(404);
  });

  it('전역 관리자는 남의 투표도 지울 수 있다', async () => {
    const { id } = await createPoll();

    expect((await api('/api/admin/auth', { method: 'POST', body: { password: 'nope' } })).status).toBe(401);
    const login = await api('/api/admin/auth', {
      method: 'POST',
      body: { password: 'test-admin-password' },
    });
    expect(login.status).toBe(200);
    const token = login.data.adminToken;

    const list = await api('/api/admin/polls', { token });
    expect(list.data.polls.some((p) => p.id === id)).toBe(true);

    expect((await api(`/api/admin/polls/${id}`, { method: 'DELETE', token })).status).toBe(200);
    expect((await api(`/api/polls/${id}`)).status).toBe(404);
  });

  it('투표별 관리 토큰으로는 전역 관리자 API를 쓸 수 없다', async () => {
    const { adminToken } = await createPoll();
    expect((await api('/api/admin/polls', { token: adminToken })).status).toBe(403);
  });
});

describe('관리 비밀번호 로그인 시도 제한', () => {
  // 투표별 관리 비밀번호는 사용자가 직접 정하는 짧은 값일 수 있다. 시도 횟수 제한이 없으면
  // 최소 길이 제한만으로는 무차별 대입을 막지 못한다.
  it('8번 틀리면 잠기고, 그동안은 맞는 비밀번호도 막힌다', async () => {
    const { id } = await createPoll();
    for (let i = 0; i < 8; i++) {
      expect((await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'wrong' } })).status).toBe(
        401,
      );
    }
    const locked = await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'pw123456' } });
    expect(locked.status).toBe(429);
    expect(locked.data.error).toContain('분 뒤');
  });

  it('로그인에 성공하면 실패 횟수가 초기화된다', async () => {
    const { id } = await createPoll();
    for (let i = 0; i < 5; i++) {
      await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'wrong' } });
    }
    expect((await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'pw123456' } })).status).toBe(
      200,
    );

    // 초기화됐으니 다시 몇 번 틀려도 아직 잠기지 않아야 한다
    for (let i = 0; i < 5; i++) {
      await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'wrong' } });
    }
    expect((await api(`/api/polls/${id}/auth`, { method: 'POST', body: { password: 'pw123456' } })).status).toBe(
      200,
    );
  });
});

describe('기명 투표와 완료 현황', () => {
  async function namedPoll(extra = {}) {
    return createPoll({
      roster: ['김철수', '이영희', '박민수'],
      settings: { resultVisibility: 'always', anonymous: false, maxPerIp: 50, ...extra },
    });
  }

  it('명단에 없는 이름은 참여할 수 없다', async () => {
    const { id } = await namedPoll();
    const res = await vote(id, 'v1', ['o1'], { name: '낯선사람' });
    expect(res.status).toBe(400);
    expect(res.data.error).toContain('명단');
  });

  it('미참여자를 알려준다', async () => {
    const { id } = await namedPoll();
    const res = await vote(id, 'v1', ['o1'], { name: '김철수' });
    expect(res.data.participation.missing).toEqual(['이영희', '박민수']);
    expect(res.data.tally.voters.o1).toEqual(['김철수']);
  });

  it('다른 기기에서 남의 이름을 쓰면 막는다', async () => {
    const { id } = await namedPoll();
    await vote(id, 'v1', ['o1'], { name: '김철수' });
    const res = await vote(id, 'v2', ['o2'], { name: '김철수' });
    expect(res.status).toBe(409);
  });

  it('명단 전원이 투표하면 자동으로 마감된다', async () => {
    const { id } = await namedPoll({ closeWhenAllVoted: true });
    await vote(id, 'v1', ['o1'], { name: '김철수' });
    await vote(id, 'v2', ['o1'], { name: '이영희' });
    expect((await api(`/api/polls/${id}`)).data.poll.status).toBe('open');

    const last = await vote(id, 'v3', ['o1'], { name: '박민수' });
    expect(last.data.poll.status).toBe('closed');
    expect(last.data.result.reason).toBe('allVoted');
    expect(last.data.result.winner).toBe('o1');
  });

  it('한글 이름이 metadata를 거쳐도 그대로 돌아온다', async () => {
    // metadata는 HTTP 헤더로 실려 나가므로 base64로 감싸 저장한다. 그 왕복을 검증한다.
    const { id } = await namedPoll();
    const res = await vote(id, 'v1', ['o1'], { name: '김철수' });
    expect(res.data.myBallot.name).toBe('김철수');
    expect(res.data.tally.voters.o1).toEqual(['김철수']);
    expect(res.data.participation.missing).toEqual(['이영희', '박민수']);
  });

  it('한글 제목이 전역 관리자 목록에서 그대로 보인다', async () => {
    const { id } = await createPoll({ title: '오늘 점심 뭐 먹지 🍜' });
    const login = await api('/api/admin/auth', {
      method: 'POST',
      body: { password: 'test-admin-password' },
    });
    const list = await api('/api/admin/polls', { token: login.data.adminToken });
    expect(list.data.polls.find((p) => p.id === id).title).toBe('오늘 점심 뭐 먹지 🍜');
  });

  it('익명 투표에서는 누가 뭘 골랐는지 응답에 없다', async () => {
    const { id } = await createPoll();
    await vote(id, 'v1', ['o1']);
    const read = await api(`/api/polls/${id}`);
    expect(read.data.tally.voters).toBeUndefined();
    expect(read.data.participation.voted).toBeNull();
  });

  it('익명 + 명단은 함께 쓸 수 없다', async () => {
    const res = await api('/api/polls', {
      method: 'POST',
      body: {
        title: '모순',
        password: 'pw123456',
        options: menuOptions(),
        roster: ['김철수'],
        settings: { anonymous: true },
      },
    });
    expect(res.status).toBe(400);
  });
});

describe('마감과 무승부', () => {
  async function tiedPoll(tiebreak) {
    const created = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50, tiebreak },
    });
    await vote(created.id, 'v1', ['o1']);
    await vote(created.id, 'v2', ['o2']);
    return created;
  }

  it('마감 시각이 지나면 다음 조회에서 자동 마감된다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50, closeAt: Date.now() + 1000 },
    });
    await vote(id, 'v1', ['o1']);
    expect((await api(`/api/polls/${id}`)).data.poll.status).toBe('open');

    await new Promise((r) => setTimeout(r, 1200));
    const after = await api(`/api/polls/${id}`);
    expect(after.data.poll.status).toBe('closed');
    expect(after.data.result.reason).toBe('deadline');
    expect(after.data.result.winner).toBe('o1');
  });

  it('마감된 투표에는 더 참여할 수 없다', async () => {
    const { id, adminToken } = await createPoll();
    await api(`/api/polls/${id}/close`, { method: 'POST', token: adminToken });
    expect((await vote(id, 'v1', ['o1'])).status).toBe(409);
  });

  it('룰렛: 승자가 정해지고 다시 읽어도 같다', async () => {
    const { id, adminToken } = await tiedPoll('roulette');
    const closed = await api(`/api/polls/${id}/close`, { method: 'POST', token: adminToken });

    expect(closed.data.result.tied).toBe(true);
    expect(closed.data.result.tiebreak).toBe('roulette');
    expect(['o1', 'o2']).toContain(closed.data.result.winner);

    // 여러 번 읽어도 승자가 바뀌면 안 된다 -- 결정적 시드를 쓰는 이유.
    const reads = await Promise.all([1, 2, 3].map(() => api(`/api/polls/${id}`)));
    for (const r of reads) expect(r.data.result.winner).toBe(closed.data.result.winner);
  });

  it('재투표: 같은 링크에서 동점 선택지만 남기고 2라운드가 열린다', async () => {
    const { id, adminToken } = await tiedPoll('runoff');
    const closed = await api(`/api/polls/${id}/close`, { method: 'POST', token: adminToken });
    expect(closed.data.result.tiebreak).toBe('runoff');

    const read = await api(`/api/polls/${id}`);
    expect(read.data.poll.round).toBe(2);
    expect(read.data.poll.status).toBe('open');
    expect(read.data.poll.activeOptionIds.sort()).toEqual(['o1', 'o2']);
    expect(read.data.participation.total).toBe(0); // 표 초기화
    expect(read.data.poll.rounds[0]).toMatchObject({ round: 1, tiebreak: 'runoff' });

    // 2라운드에서는 탈락한 o3를 고를 수 없다
    expect((await vote(id, 'v1', ['o3'])).status).toBe(400);
    expect((await vote(id, 'v1', ['o1'])).status).toBe(200);

    // 1라운드 결과는 그대로 남아 있다
    const history = await api(`/api/polls/${id}/results/1`);
    expect(history.data.result.tally.counts).toEqual({ o1: 1, o2: 1, o3: 0 });
  });

  it('manual: 마감 후 관리자가 룰렛/재투표를 고른다', async () => {
    const { id, adminToken } = await tiedPoll('manual');
    const closed = await api(`/api/polls/${id}/close`, { method: 'POST', token: adminToken });
    expect(closed.data.result.pending).toBe(true);
    expect(closed.data.result.winner).toBeNull();

    const picked = await api(`/api/polls/${id}/tiebreak`, {
      method: 'POST',
      body: { mode: 'roulette' },
      token: adminToken,
    });
    expect(picked.data.result.pending).toBe(false);
    expect(['o1', 'o2']).toContain(picked.data.result.winner);

    // 이미 처리된 무승부를 또 처리하려 하면 거절
    const again = await api(`/api/polls/${id}/tiebreak`, {
      method: 'POST',
      body: { mode: 'runoff' },
      token: adminToken,
    });
    expect(again.status).toBe(409);
  });

  it('동점이 아니면 그대로 승자가 정해진다', async () => {
    const { id, adminToken } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50, tiebreak: 'manual' },
    });
    await vote(id, 'v1', ['o2']);
    const closed = await api(`/api/polls/${id}/close`, { method: 'POST', token: adminToken });
    expect(closed.data.result.tied).toBe(false);
    expect(closed.data.result.pending).toBe(false);
    expect(closed.data.result.winner).toBe('o2');
  });
});

describe('날짜 조율(schedule) 투표', () => {
  async function schedulePoll() {
    const res = await api('/api/polls', {
      method: 'POST',
      body: {
        type: 'schedule',
        title: '회식 날짜',
        password: 'pw123456',
        schedule: { dates: ['2026-09-01', '2026-09-02'], startMin: 660, endMin: 780, slotMin: 30 },
        settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 50 },
      },
    });
    expect(res.status, res.text).toBe(201);
    return res.data;
  }

  it('겹치는 시간대를 집계한다', async () => {
    const { id } = await schedulePoll(); // 하루 4슬롯 × 2일 = 8슬롯
    await api(`/api/polls/${id}/ballots`, { method: 'POST', body: { voterId: 'v1', slots: [0, 1, 2] } });
    await api(`/api/polls/${id}/ballots`, { method: 'POST', body: { voterId: 'v2', slots: [1, 2, 5] } });

    const read = await api(`/api/polls/${id}`);
    expect(read.data.tally.counts).toEqual([1, 2, 2, 0, 0, 1, 0, 0]);
    expect(read.data.tally.leaders).toEqual([1, 2]);
    expect(read.data.tally.tied).toBe(true);
  });

  it('내 선택은 비트마스크로 저장되고 되읽을 수 있다', async () => {
    const { id } = await schedulePoll();
    await api(`/api/polls/${id}/ballots`, { method: 'POST', body: { voterId: 'v1', slots: [3, 7] } });
    const read = await api(`/api/polls/${id}?voterId=v1`);
    expect(decodeSlots(read.data.myBallot.slots, 8)).toEqual([3, 7]);
  });

  it('범위를 벗어난 슬롯은 걸러진다', async () => {
    const { id } = await schedulePoll();
    const res = await api(`/api/polls/${id}/ballots`, {
      method: 'POST',
      body: { voterId: 'v1', slots: [99, 100] },
    });
    expect(res.status).toBe(400);
  });

  it('시간 범위가 슬롯 길이로 나누어떨어지지 않으면 거절한다', async () => {
    const res = await api('/api/polls', {
      method: 'POST',
      body: {
        type: 'schedule',
        title: '어긋난 범위',
        password: 'pw123456',
        schedule: { dates: ['2026-09-01'], startMin: 600, endMin: 620, slotMin: 30 },
      },
    });
    expect(res.status).toBe(400);
  });
});

describe('중복 투표 방지', () => {
  it('같은 네트워크 허용 인원을 넘으면 막는다', async () => {
    const { id } = await createPoll({
      settings: { resultVisibility: 'always', anonymous: true, maxPerIp: 2, allowChange: true },
    });
    expect((await vote(id, 'v1', ['o1'])).status).toBe(200);
    expect((await vote(id, 'v2', ['o1'])).status).toBe(200);

    const third = await vote(id, 'v3', ['o1']);
    expect(third.status).toBe(429);

    // 이미 등록된 사람은 계속 수정할 수 있어야 한다 (allowChange:true인 경우)
    expect((await vote(id, 'v1', ['o2'])).status).toBe(200);
  });
});
