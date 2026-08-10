import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Field, Input, Spinner, cx, useToast } from '../components/ui/index.jsx';
import OptionList from '../components/choice/OptionList.jsx';
import TimeGrid from '../components/schedule/TimeGrid.jsx';
import ParticipantPanel from '../components/ParticipantPanel.jsx';
import ShareBar from '../components/ShareBar.jsx';
import AdminPanel from '../components/AdminPanel.jsx';
import TiebreakPanel from '../components/tiebreak/TiebreakPanel.jsx';
import { api } from '../api.js';
import { navigate } from '../lib/router.jsx';
import { averagePrice, formatDate, formatRemaining, formatWon, priceLabel } from '../lib/format.js';
import { decodeSlots, describeSlot, formatMinutes, totalSlots } from '../../shared/slots.js';
import {
  getPollToken,
  getSavedName,
  getVoterId,
  rememberPoll,
  setPollToken,
  setSavedName,
} from '../lib/voter.js';

const POLL_INTERVAL_MS = 5000;

export default function PollView({ pollId }) {
  const voterId = useMemo(getVoterId, []);
  const toast = useToast();

  const [view, setView] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [token, setTokenState] = useState(() => getPollToken(pollId));
  const [name, setName] = useState(getSavedName);
  const [selections, setSelections] = useState(() => new Set());
  const [slots, setSlots] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [justCreated, setJustCreated] = useState(
    () => new URLSearchParams(window.location.search).get('created') === '1',
  );

  // 5초마다 새로고침하는 동안 사용자가 고르던 내용을 덮어쓰지 않기 위한 표시.
  const draftDirty = useRef(false);
  const roundRef = useRef(null);

  const applyView = useCallback((data, { syncDraft = false } = {}) => {
    setView(data);

    // 재투표로 라운드가 바뀌면 이전 라운드의 선택은 의미가 없으므로 비운다.
    const roundChanged = roundRef.current !== null && roundRef.current !== data.poll.round;
    roundRef.current = data.poll.round;

    if (syncDraft || roundChanged || !draftDirty.current) {
      if (roundChanged) draftDirty.current = false;
      setSelections(new Set(data.myBallot?.selections || []));
      const total = data.poll.type === 'schedule' ? totalSlots(data.poll.schedule) : 0;
      setSlots(new Set(data.myBallot?.slots ? decodeSlots(data.myBallot.slots, total) : []));
      if (data.myBallot?.name) setName(data.myBallot.name);
    }
  }, []);

  const load = useCallback(
    async (opts) => {
      const data = await api.getPoll(pollId, voterId);
      applyView(data, opts);
      return data;
    },
    [pollId, voterId, applyView],
  );

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => {
        if (!alive) return;
        rememberPoll({
          id: data.poll.id,
          title: data.poll.title,
          type: data.poll.type,
          owner: Boolean(getPollToken(pollId)),
        });
      })
      .catch((err) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [load, pollId]);

  // 탭이 보이는 동안에만 폴링한다. 백그라운드 탭에서 불필요한 요청을 만들지 않는다.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') load().catch(() => {});
    };
    const timer = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load]);

  // 마감까지 남은 시간 표시용 초시계
  useEffect(() => {
    if (!view?.poll.settings.closeAt || view.poll.status !== 'open') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [view?.poll.settings.closeAt, view?.poll.status]);

  const setToken = (next) => {
    setPollToken(pollId, next);
    setTokenState(next);
  };

  if (loadError) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl" aria-hidden="true">
          🔍
        </p>
        <h1 className="mt-4 text-xl font-bold text-stone-900">{loadError}</h1>
        <Button className="mt-6" onClick={() => navigate('/')}>
          처음으로
        </Button>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex justify-center py-20 text-stone-400">
        <Spinner className="size-8" />
      </div>
    );
  }

  const { poll, myBallot, participation, tally, resultsVisible, result } = view;
  const theme = poll.settings.theme || 'simple';
  const isSchedule = poll.type === 'schedule';
  const isOpen = poll.status === 'open';
  const total = isSchedule ? totalSlots(poll.schedule) : 0;
  const remaining = poll.settings.closeAt ? formatRemaining(poll.settings.closeAt, now) : null;

  const labelOf = (key) => {
    if (isSchedule) {
      const s = describeSlot(poll.schedule, Number(key));
      return `${formatDate(s.date, { short: true })} ${formatMinutes(s.startMin)}`;
    }
    return poll.options.find((o) => o.id === key)?.label ?? '삭제된 선택지';
  };

  const toggleOption = (id) => {
    draftDirty.current = true;
    setVoteError('');
    setSelections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // 단일 선택이면 기존 선택을 대체한다
        if (!poll.settings.multiSelect.enabled) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const updateSlots = (updater) => {
    draftDirty.current = true;
    setVoteError('');
    setSlots(updater);
  };

  const submit = async (abstain = false) => {
    setVoteError('');
    setBusy(true);
    try {
      const body = { voterId, abstain };
      if (!poll.settings.anonymous) body.name = name.trim();
      if (!abstain) {
        if (isSchedule) body.slots = [...slots];
        else body.selections = [...selections];
      }
      const data = await api.vote(pollId, body);
      draftDirty.current = false;
      applyView(data, { syncDraft: true });
      if (!poll.settings.anonymous) setSavedName(name.trim());
      toast.show(abstain ? '기권했습니다' : '투표가 저장되었습니다');
      setJustCreated(false);
    } catch (err) {
      setVoteError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const retract = async () => {
    setBusy(true);
    try {
      applyView(await api.retract(pollId, voterId), { syncDraft: true });
      draftDirty.current = false;
      toast.show('투표를 취소했습니다');
    } catch (err) {
      toast.show(err.message, 'rose');
    } finally {
      setBusy(false);
    }
  };

  const chooseTiebreak = async (mode) => {
    setBusy(true);
    try {
      await api.tiebreak(pollId, mode, token);
      await load({ syncDraft: true });
      toast.show(mode === 'roulette' ? '룰렛을 돌렸습니다' : '재투표를 시작했습니다');
    } catch (err) {
      toast.show(err.message, 'rose');
    } finally {
      setBusy(false);
    }
  };

  const hasSelection = isSchedule ? slots.size > 0 : selections.size > 0;
  const needsName = !poll.settings.anonymous && !name.trim();
  const canSubmit = hasSelection && !needsName;
  const canChange = poll.settings.allowChange || !myBallot;

  const runoffFrom = poll.rounds?.[poll.rounds.length - 1];
  const winnerLabel = result?.winner != null ? labelOf(result.winner) : null;

  return (
    <div className="space-y-4">
      {toast.element}

      {/* ── 헤더 ───────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isSchedule ? 'amber' : 'stone'}>{isSchedule ? '📅 날짜 조율' : '🍽️ 선택지 투표'}</Badge>
          {poll.round > 1 && <Badge tone="rose">{poll.round}라운드 재투표</Badge>}
          {isOpen ? (
            remaining ? (
              <Badge tone="amber">⏳ {remaining} 남음</Badge>
            ) : (
              <Badge tone="green">진행 중</Badge>
            )
          ) : (
            <Badge tone="stone">마감됨</Badge>
          )}
          {poll.settings.anonymous && <Badge tone="stone">익명</Badge>}
        </div>
        <h1 className="mt-2.5 text-2xl font-extrabold text-stone-900">{poll.title}</h1>
        {poll.description && <p className="mt-1.5 whitespace-pre-wrap text-stone-600">{poll.description}</p>}
      </div>

      <ShareBar poll={poll} highlight={justCreated} onCopied={() => setJustCreated(false)} />

      {poll.round > 1 && runoffFrom && (
        <Alert tone="amber">
          {runoffFrom.round}라운드가 동점으로 끝나 재투표가 시작됐습니다. 아래에서 다시 골라주세요.
        </Alert>
      )}

      {/* ── 확정된 결과 ────────────────────── */}
      {!isOpen && winnerLabel && (
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 text-center">
          <p className="text-sm font-semibold text-amber-700">결과가 확정되었습니다</p>
          <p className="mt-1.5 text-2xl font-extrabold text-stone-900">👑 {winnerLabel}</p>
          {result.tally?.max > 0 && (
            <p className="mt-1 text-sm text-amber-700">
              {result.tally.max}표
              {result.tiebreak === 'roulette' && ' · 동점이라 룰렛으로 결정'}
            </p>
          )}
        </Card>
      )}

      {!isOpen && result && !result.winner && !result.pending && (
        <Alert tone="amber">표가 하나도 없어 결과를 정하지 못했습니다.</Alert>
      )}

      {/* ── 무승부 처리 ────────────────────── */}
      {!isOpen && result?.tied && (
        <TiebreakPanel
          result={result}
          labelOf={labelOf}
          canManage={Boolean(token)}
          onChoose={chooseTiebreak}
          busy={busy}
        />
      )}

      {/* ── 투표 / 결과 본문 ───────────────── */}
      <Card className="space-y-4">
        {!poll.settings.anonymous && isOpen && (
          <Field label="이름" required hint="완료 현황에 표시됩니다." htmlFor="voter-name">
            <Input
              id="voter-name"
              value={name}
              maxLength={20}
              disabled={Boolean(myBallot) && !poll.settings.allowChange}
              onChange={(e) => setName(e.target.value)}
              placeholder={poll.roster?.length ? '명단에 있는 이름을 적어주세요' : '이름 또는 별명'}
            />
          </Field>
        )}

        {poll.roster?.length > 0 && isOpen && !myBallot && (
          <p className="text-sm text-stone-500">
            참여자 명단: {poll.roster.join(', ')}
          </p>
        )}

        {isSchedule ? (
          <ScheduleBody
            poll={poll}
            tally={tally}
            slots={slots}
            onChange={updateSlots}
            editable={isOpen && canChange}
            resultsVisible={resultsVisible}
            labelOf={labelOf}
            winner={result?.winner}
            theme={theme}
          />
        ) : (
          <OptionList
            poll={poll}
            tally={resultsVisible ? tally : null}
            selected={selections}
            onToggle={isOpen && canChange ? toggleOption : undefined}
            disabled={!isOpen || !canChange}
            isOpen={isOpen}
            winnerId={result?.winner ?? null}
            tiedIds={result?.tied ? result.leaders : []}
            theme={theme}
          />
        )}

        {!isSchedule && resultsVisible && tally && <PriceSummary poll={poll} tally={tally} />}

        {myBallot?.abstain && (
          <Alert tone="amber">기권한 상태입니다. 다시 고르면 기권이 취소됩니다.</Alert>
        )}

        {!resultsVisible && isOpen && (
          <p className="text-sm text-stone-500">
            {poll.settings.resultVisibility === 'afterClose'
              ? '결과는 마감 후에 공개됩니다.'
              : '투표하면 현재 결과를 볼 수 있습니다.'}
          </p>
        )}

        <Alert>{voteError}</Alert>

        {isOpen && (
          <div className="space-y-2 border-t border-stone-100 pt-4">
            {!canChange ? (
              <Alert tone="amber">이 투표는 한 번 참여하면 수정할 수 없습니다.</Alert>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  loading={busy}
                  disabled={!canSubmit}
                  onClick={() => submit(false)}
                >
                  {myBallot && !myBallot.abstain ? '투표 수정하기' : '투표하기'}
                </Button>
                <div className="flex gap-2">
                  {poll.settings.allowAbstain && (
                    <Button variant="secondary" className="flex-1" loading={busy} onClick={() => submit(true)}>
                      🤷 아무거나 좋아요 (기권)
                    </Button>
                  )}
                  {myBallot && (
                    <Button variant="ghost" className="flex-1" loading={busy} onClick={retract}>
                      참여 취소
                    </Button>
                  )}
                </div>
                {needsName && <p className="text-sm text-stone-500">이름을 입력하면 투표할 수 있습니다.</p>}
              </>
            )}
          </div>
        )}
      </Card>

      <ParticipantPanel
        poll={poll}
        participation={participation}
        abstainNames={resultsVisible ? tally?.abstainNames : null}
      />

      {poll.rounds?.length > 0 && <RoundHistory poll={poll} labelOf={labelOf} />}

      <AdminPanel
        poll={poll}
        token={token}
        onToken={setToken}
        onChanged={() => load({ syncDraft: true })}
        onDeleted={() => {
          toast.show('투표를 삭제했습니다');
          navigate('/');
        }}
        toast={toast.show}
      />
    </div>
  );
}

/** 날짜 조율: 내가 고르는 격자와 모두의 히트맵을 함께 보여준다. */
function ScheduleBody({ poll, tally, slots, onChange, editable, resultsVisible, labelOf, winner, theme = 'simple' }) {
  const showHeat = resultsVisible && tally;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 text-sm font-bold text-stone-700">
          {editable ? '내가 가능한 시간' : '내가 고른 시간'}
        </h2>
        <TimeGrid schedule={poll.schedule} selected={slots} onChange={onChange} disabled={!editable} theme={theme} />
      </div>

      {showHeat && (
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-stone-700">모두의 가능한 시간</h2>
            <span className="text-sm text-stone-500">
              총 <span className="font-semibold text-stone-700 tabular">{tally.totalBallots}</span>명 참여
              {tally.abstain > 0 && ` (기권 ${tally.abstain}명)`}
            </span>
          </div>
          <TimeGrid
            schedule={poll.schedule}
            selected={new Set()}
            onChange={() => {}}
            disabled
            heat={tally.counts}
            names={tally.voters}
            theme={theme}
          />

          {tally.leaders.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-bold text-amber-900">
                가장 많이 겹치는 시간 ({tally.max}명)
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {tally.leaders.slice(0, 5).map((index) => (
                  <li
                    key={index}
                    className={cx(
                      'text-sm',
                      winner === index ? 'font-extrabold text-amber-700' : 'text-amber-800',
                    )}
                  >
                    {winner === index && '👑 '}
                    {labelOf(index)}
                  </li>
                ))}
                {tally.leaders.length > 5 && (
                  <li className="text-sm text-amber-600">외 {tally.leaders.length - 5}개</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 표를 받은 메뉴들의 가격대 요약. 가격을 하나도 안 적었으면 나오지 않는다. */
function PriceSummary({ poll, tally }) {
  const voted = poll.options.filter((o) => (tally.counts?.[o.id] ?? 0) > 0);
  const average = averagePrice(voted);
  if (!average) return null;

  const bands = [...new Set(voted.map((o) => o.priceBand).filter(Boolean))];
  return (
    <p className="rounded-xl bg-stone-50 px-3.5 py-2.5 text-sm text-stone-600">
      💰 표를 받은 메뉴 평균 <span className="font-bold text-stone-800">{formatWon(average)}</span>
      {bands.length > 1 && <span className="text-stone-400"> · {bands.map(priceLabel).join(', ')}</span>}
    </p>
  );
}

/** 재투표로 지나간 라운드들의 결과를 펼쳐볼 수 있게 한다. */
function RoundHistory({ poll, labelOf }) {
  const [open, setOpen] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const show = async (round) => {
    if (open === round) {
      setOpen(null);
      return;
    }
    setOpen(round);
    setLoading(true);
    try {
      const data = await api.roundResult(poll.id, round);
      setResult(data.result);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-base font-bold text-stone-900">지난 라운드</h2>
      <ul className="mt-3 space-y-2">
        {poll.rounds.map((r) => (
          <li key={r.round}>
            <button
              type="button"
              onClick={() => show(r.round)}
              aria-expanded={open === r.round}
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-stone-50"
            >
              <span className="font-semibold text-stone-800">{r.round}라운드</span>
              <span className="ml-2 text-stone-500">동점으로 재투표</span>
              <span className="float-right text-stone-400">{open === r.round ? '▲' : '▼'}</span>
            </button>

            {open === r.round && (
              <div className="mt-2 rounded-xl bg-stone-50 px-3.5 py-3 text-sm">
                {loading ? (
                  <span className="text-stone-400">불러오는 중…</span>
                ) : result?.tally ? (
                  <ul className="space-y-1">
                    {Object.entries(result.tally.counts ?? {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, count]) => (
                        <li key={key} className="flex justify-between text-stone-700">
                          <span>{labelOf(key)}</span>
                          <span className="font-semibold tabular">{count}표</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <span className="text-stone-400">결과를 불러오지 못했습니다.</span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
