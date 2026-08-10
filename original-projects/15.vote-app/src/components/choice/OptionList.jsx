import { Badge, cx } from '../ui/index.jsx';
import { priceLabel } from '../../lib/format.js';
import StickerDots from './StickerDots.jsx';

/**
 * 선택지 목록. 투표 중에는 고르는 카드로, 결과가 공개되면 같은 카드 위에 막대와 득표수가 겹쳐 보인다.
 * theme에 따라 카드 표현만 달라지고, 선택·집계 로직은 전부 동일하다.
 */
export default function OptionList({
  poll,
  tally,
  selected,
  onToggle,
  disabled = false,
  isOpen = false,
  winnerId = null,
  tiedIds = [],
  theme = 'simple',
}) {
  const active = poll.activeOptionIds ? new Set(poll.activeOptionIds) : null;
  const options = poll.options.filter((o) => !active || active.has(o.id));
  const showResult = Boolean(tally);
  const max = tally?.max || 0;
  const tied = new Set(tiedIds);
  // 진행 중일 때만 "우세"를 보여준다. 마감 후 무승부 대기 상태에서는 '동점' 배지가 이미
  // 같은 정보를 더 정확하게 전달하므로 겹쳐 보이지 않게 한다.
  const leading = new Set(isOpen && max > 0 ? tally.leaders : []);
  const leadingIsTie = leading.size > 1;

  const items = options.map((option) => {
    const count = tally?.counts?.[option.id] ?? 0;
    const voters = tally?.voters?.[option.id];
    const pct = showResult && tally.totalBallots > 0 ? Math.round((count / tally.totalBallots) * 100) : null;
    return {
      option,
      count,
      voters,
      pct,
      isSelected: Boolean(selected?.has(option.id)),
      isWinner: winnerId === option.id,
      isTied: tied.has(option.id) && !winnerId,
      isLeading: leading.has(option.id),
      ratio: max > 0 ? count / max : 0,
    };
  });

  const summary = showResult && (
    <p aria-live="polite" className={cx('mb-2 text-sm', theme === 'chat' ? 'text-stone-500' : 'text-stone-500')}>
      총 <span className="font-semibold text-stone-700 tabular">{tally.totalBallots}</span>표 참여
      {tally.abstain > 0 && ` (기권 ${tally.abstain}표)`}
      {isOpen && max > 0 && (
        <>
          {' · 현재 '}
          <span className="font-semibold text-emerald-700">
            {leadingIsTie
              ? `${[...leading].map((id) => poll.options.find((o) => o.id === id)?.label).join(', ')} 공동 우세`
              : `${poll.options.find((o) => o.id === [...leading][0])?.label ?? ''} 우세`}
          </span>
        </>
      )}
    </p>
  );

  const commonProps = { showResult, leadingIsTie, onToggle, disabled };

  if (theme === 'sticker') {
    return (
      <div>
        {summary}
        <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-white p-3 sm:p-4">
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((it) => (
              <StickerItem key={it.option.id} {...it} {...commonProps} />
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (theme === 'chat') {
    return (
      <div>
        {summary}
        <ul className="space-y-2.5 rounded-2xl bg-stone-100 p-3 sm:p-4">
          {items.map((it) => (
            <ChatItem key={it.option.id} {...it} {...commonProps} />
          ))}
        </ul>
      </div>
    );
  }

  if (theme === 'arcade') {
    return (
      <div>
        {summary}
        <ul className="space-y-3">
          {items.map((it, i) => (
            <ArcadeItem key={it.option.id} rank={i + 1} {...it} {...commonProps} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      {summary}
      <ul className="space-y-2">
        {items.map((it) => (
          <SimpleItem key={it.option.id} {...it} {...commonProps} />
        ))}
      </ul>
    </div>
  );
}

function OptionMeta({ option, className }) {
  if (!option.place && !option.priceBand && !option.note) return null;
  return (
    <span className={cx('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-stone-500', className)}>
      {option.place && <span>📍 {option.place}</span>}
      {option.priceBand && <span>💰 {priceLabel(option.priceBand)}</span>}
      {option.note && <span className="text-stone-400">{option.note}</span>}
    </span>
  );
}

/* ── 심플: 기본 리스트 + 체크박스 + 얇은 막대 ───────────────────────── */
function SimpleItem({ option, count, voters, pct, isSelected, isWinner, isTied, isLeading, ratio, showResult, leadingIsTie, onToggle, disabled }) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={onToggle ? isSelected : undefined}
        onClick={() => onToggle?.(option.id)}
        className={cx(
          'relative w-full overflow-hidden rounded-xl border p-3.5 text-left transition-colors',
          isWinner
            ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-300'
            : isSelected
              ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200'
              : 'border-stone-200 bg-white',
          !disabled && onToggle && 'hover:border-stone-300 hover:bg-stone-50',
          disabled && 'cursor-default',
        )}
      >
        {showResult && ratio > 0 && (
          <span
            aria-hidden="true"
            className={cx(
              'absolute inset-y-0 left-0 transition-[width] duration-500',
              isWinner ? 'bg-amber-200/50' : 'bg-emerald-100/70',
            )}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        )}

        <span className="relative flex items-start gap-3">
          {onToggle && (
            <span
              aria-hidden="true"
              className={cx(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold',
                isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 bg-white',
              )}
            >
              {isSelected && '✓'}
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-stone-900">{option.label}</span>
              {isWinner && <Badge tone="amber">👑 당첨</Badge>}
              {isTied && <Badge tone="rose">동점</Badge>}
              {isLeading && !isWinner && <Badge tone="amber">{leadingIsTie ? '공동 우세' : '🔥 우세'}</Badge>}
            </span>
            <OptionMeta option={option} className="mt-1" />
            {showResult && voters?.length > 0 && (
              <span className="mt-1.5 block text-sm text-stone-500">{voters.join(', ')}</span>
            )}
          </span>

          {showResult && (
            <span className="shrink-0 text-right">
              <span className="block text-lg leading-tight font-extrabold text-stone-900 tabular">{count}표</span>
              <span className="block text-xs text-stone-400 tabular">{pct}%</span>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/* ── 스티커보드: 흰 보드 위에 참여자가 스티커(동그라미)를 붙인다 ───────────── */
function StickerItem({ option, count, voters, isSelected, isWinner, isTied, isLeading, showResult, leadingIsTie, onToggle, disabled }) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={onToggle ? isSelected : undefined}
        onClick={() => onToggle?.(option.id)}
        className={cx(
          'font-display relative w-full rounded-2xl border-2 p-3.5 text-left transition-all',
          isWinner
            ? 'border-amber-400 bg-amber-50 shadow-md'
            : isSelected
              ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
              : 'border-stone-200 bg-white',
          !disabled && onToggle && 'hover:-translate-y-0.5 hover:shadow-md',
          disabled && 'cursor-default',
        )}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold text-stone-900">
              {option.label}
              {isWinner && <Badge tone="amber">👑 1등</Badge>}
              {isTied && <Badge tone="rose">동점</Badge>}
              {isLeading && !isWinner && <Badge tone="amber">{leadingIsTie ? '공동 1등' : '🔥 1등'}</Badge>}
            </span>
            <OptionMeta option={option} className="mt-1 font-sans" />
          </span>
          {isSelected && (
            <span aria-hidden="true" className="shrink-0 text-lg">
              📌
            </span>
          )}
        </span>

        {showResult && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <StickerDots count={count} names={voters} />
            <span className="shrink-0 text-sm font-bold text-stone-500 tabular">{count}명</span>
          </div>
        )}
      </button>
    </li>
  );
}

/* ── 채팅: 참여자가 말풍선으로 자기 선택을 알려주는 느낌 ───────────────── */
function ChatItem({ option, count, voters, isSelected, isWinner, isTied, isLeading, showResult, leadingIsTie, onToggle, disabled }) {
  return (
    <li>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={onToggle ? isSelected : undefined}
          onClick={() => onToggle?.(option.id)}
          className={cx(
            'relative w-fit max-w-full rounded-2xl rounded-bl-sm px-4 py-2.5 text-left shadow-sm transition-colors',
            isWinner ? 'bg-amber-200' : isSelected ? 'bg-emerald-500 text-white' : 'bg-white text-stone-900',
            !disabled && onToggle && !isSelected && 'hover:bg-stone-50',
            disabled && 'cursor-default',
          )}
        >
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{option.label}</span>
            {isWinner && <Badge tone="amber">👑</Badge>}
            {isTied && <Badge tone="rose">동점</Badge>}
            {isLeading && !isWinner && <Badge tone="amber">{leadingIsTie ? '공동 우세' : '🔥'}</Badge>}
          </span>
          <OptionMeta option={option} className={cx('mt-1', isSelected && !isWinner && 'text-emerald-50')} />
        </button>

        {showResult && (
          <div className="ml-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
            {voters?.length > 0 ? (
              voters.slice(0, 6).map((n, i) => (
                <span key={`${n}-${i}`} className="rounded-full bg-white px-2 py-1 shadow-sm">
                  💬 {n}
                </span>
              ))
            ) : count > 0 ? (
              <span className="rounded-full bg-white px-2 py-1 shadow-sm">💬 익명 {count}명</span>
            ) : null}
            {voters?.length > 6 && (
              <span className="rounded-full bg-white px-2 py-1 shadow-sm">+{voters.length - 6}</span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* ── 아케이드: 굵은 게임 카드 + 두꺼운 게이지 바 + 순위 뱃지 ─────────────── */
function ArcadeItem({ option, count, pct, rank, isSelected, isWinner, isTied, isLeading, ratio, showResult, leadingIsTie, onToggle, disabled }) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={onToggle ? isSelected : undefined}
        onClick={() => onToggle?.(option.id)}
        className={cx(
          'w-full rounded-2xl border-2 p-4 text-left transition-all',
          isWinner
            ? 'animate-pop border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 shadow-lg'
            : isSelected
              ? 'animate-pop border-emerald-500 bg-emerald-50 shadow-md'
              : 'border-stone-200 bg-white shadow-sm',
          !disabled && onToggle && 'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
          disabled && 'cursor-default',
        )}
      >
        <span className="flex items-center gap-3">
          <span
            className={cx(
              'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold tabular',
              isWinner ? 'bg-amber-400 text-white' : isSelected ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500',
            )}
          >
            {isWinner ? '🏆' : rank}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-base font-extrabold text-stone-900">{option.label}</span>
              {isTied && <Badge tone="rose">동점</Badge>}
              {isLeading && !isWinner && <Badge tone="amber">{leadingIsTie ? '공동 1위' : '1위 질주중'}</Badge>}
            </span>
            <OptionMeta option={option} className="mt-0.5" />
          </span>

          {showResult && (
            <span className="shrink-0 text-right">
              <span className="block text-xl leading-tight font-extrabold text-stone-900 tabular">{count}</span>
              <span className="block text-xs font-semibold text-stone-400 tabular">{pct}%</span>
            </span>
          )}
        </span>

        {showResult && (
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100">
            <div
              className={cx(
                'h-full rounded-full transition-[width] duration-500',
                isWinner ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-600',
              )}
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
        )}
      </button>
    </li>
  );
}
