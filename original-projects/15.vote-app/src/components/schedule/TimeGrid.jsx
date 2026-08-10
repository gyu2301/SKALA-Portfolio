import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../ui/index.jsx';
import { describeSlot, formatMinutes, slotsPerDay, totalSlots } from '../../../shared/slots.js';
import { formatDate } from '../../lib/format.js';

/**
 * When2meet 스타일 시간 격자.
 *
 * 드래그로 여러 칸을 한 번에 칠한다. 빈 칸에서 시작하면 칠하기, 채워진 칸에서 시작하면 지우기.
 * pointerenter 대신 컨테이너의 pointermove + elementFromPoint를 쓰는 이유:
 * 터치에서는 포인터가 최초 대상에 캡처되어 다른 칸의 enter 이벤트가 오지 않는다.
 * 좌표로 직접 칸을 찾으면 마우스와 터치를 같은 코드로 처리할 수 있다.
 */
const HEAT_SCALES = {
  simple: ['bg-stone-50', 'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400 text-white', 'bg-emerald-600 text-white'],
  chat: ['bg-stone-50', 'bg-sky-100', 'bg-sky-200', 'bg-sky-300', 'bg-sky-400 text-white', 'bg-sky-600 text-white'],
  arcade: ['bg-stone-50', 'bg-violet-100', 'bg-violet-200', 'bg-violet-300', 'bg-violet-400 text-white', 'bg-violet-600 text-white'],
};

const ACCENT = {
  simple: { selected: 'bg-emerald-500', ring: 'ring-emerald-500' },
  sticker: { selected: 'bg-orange-400', ring: 'ring-orange-400' },
  chat: { selected: 'bg-sky-500', ring: 'ring-sky-500' },
  arcade: { selected: 'bg-violet-500', ring: 'ring-violet-500' },
};

const DOT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function TimeGrid({
  schedule,
  selected,
  onChange,
  disabled = false,
  heat = null,
  names = null,
  theme = 'simple',
}) {
  const total = totalSlots(schedule);
  const perDay = slotsPerDay(schedule);
  const [mode, setMode] = useState(null); // 'add' | 'remove' | null
  const [hovered, setHovered] = useState(null);
  const modeRef = useRef(null);
  const containerRef = useRef(null);

  const apply = useCallback(
    (index, action) => {
      onChange((prev) => {
        const next = new Set(prev);
        if (action === 'add') next.add(index);
        else next.delete(index);
        return next;
      });
    },
    [onChange],
  );

  const slotFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const raw = el?.getAttribute?.('data-slot');
    return raw == null ? null : Number(raw);
  };

  const stop = useCallback(() => {
    modeRef.current = null;
    setMode(null);
  }, []);

  useEffect(() => {
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [stop]);

  const onPointerDown = (e) => {
    if (disabled) return;
    const index = slotFromPoint(e.clientX, e.clientY);
    if (index === null) return;
    e.preventDefault();
    const action = selected.has(index) ? 'remove' : 'add';
    modeRef.current = action;
    setMode(action);
    apply(index, action);
  };

  const onPointerMove = (e) => {
    const index = slotFromPoint(e.clientX, e.clientY);
    setHovered(index);
    if (disabled || !modeRef.current || index === null) return;
    e.preventDefault();
    apply(index, modeRef.current);
  };

  const rows = Array.from({ length: perDay }, (_, r) => r);
  const maxHeat = heat ? Math.max(1, ...heat) : 1;
  const isSticker = theme === 'sticker';
  const scale = HEAT_SCALES[theme] || HEAT_SCALES.simple;
  const accent = ACCENT[theme] || ACCENT.simple;

  /** 겹치는 인원이 많을수록 진한 색. 읽기(결과) 모드에서만 쓴다. */
  const heatClass = (count) => {
    if (!count) return scale[0];
    const ratio = count / maxHeat;
    if (ratio > 0.99) return scale[5];
    if (ratio > 0.74) return scale[4];
    if (ratio > 0.49) return scale[3];
    if (ratio > 0.24) return scale[2];
    return scale[1];
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          ref={containerRef}
          className={cx('time-grid inline-block min-w-full', disabled && 'opacity-95')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHovered(null)}
        >
          <div
            className="grid gap-px"
            style={{ gridTemplateColumns: `3.5rem repeat(${schedule.dates.length}, minmax(3.25rem, 1fr))` }}
          >
            <span />
            {schedule.dates.map((date) => (
              <span key={date} className="pb-1.5 text-center text-xs font-bold text-stone-600">
                {formatDate(date, { short: true })}
              </span>
            ))}

            {rows.map((row) => {
              const startMin = schedule.startMin + row * schedule.slotMin;
              // 정시에만 시각을 표시해 라벨이 빽빽해지지 않게 한다.
              const showLabel = startMin % 60 === 0 || schedule.slotMin >= 60;
              return (
                <FragmentRow
                  key={row}
                  label={showLabel ? formatMinutes(startMin) : ''}
                  cells={schedule.dates.map((_, dayIdx) => {
                    const index = dayIdx * perDay + row;
                    const count = heat ? heat[index] : 0;
                    const isSelected = selected.has(index);
                    return (
                      <button
                        key={index}
                        type="button"
                        data-slot={index}
                        disabled={disabled && !heat}
                        aria-pressed={heat ? undefined : isSelected}
                        aria-label={slotLabel(schedule, index, count, heat)}
                        onFocus={() => setHovered(index)}
                        onKeyDown={(e) => {
                          if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
                          e.preventDefault();
                          apply(index, isSelected ? 'remove' : 'add');
                        }}
                        className={cx(
                          'relative flex h-7 w-full items-center justify-center gap-0.5 border border-white/70 transition-colors',
                          heat
                            ? isSticker
                              ? 'bg-white'
                              : heatClass(count)
                            : isSelected
                              ? accent.selected
                              : 'bg-stone-100 hover:bg-stone-200',
                          hovered === index && cx('ring-2 ring-inset', accent.ring),
                          row === 0 && 'rounded-t-md',
                          row === perDay - 1 && 'rounded-b-md',
                        )}
                      >
                        {isSticker && heat && count > 0 && (
                          <>
                            {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                              <span
                                key={i}
                                aria-hidden="true"
                                className="size-2 rounded-full ring-1 ring-white"
                                style={{ backgroundColor: DOT_COLORS[(index + i) % DOT_COLORS.length] }}
                              />
                            ))}
                            {count > 3 && (
                              <span aria-hidden="true" className="text-[9px] font-bold text-stone-500">
                                +{count - 3}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                />
              );
            })}
          </div>
        </div>
      </div>

      {heat && hovered !== null && (
        <HoverDetail schedule={schedule} index={hovered} count={heat[hovered]} names={names?.[hovered]} />
      )}
      {!heat && (
        <p className="mt-2 text-xs text-stone-500">
          드래그해서 여러 칸을 한 번에 칠할 수 있어요. 칠해진 칸에서 시작하면 지워집니다.
        </p>
      )}
    </div>
  );
}

function FragmentRow({ label, cells }) {
  return (
    <>
      <span className="pr-2 text-right text-[11px] leading-7 text-stone-400 tabular">{label}</span>
      {cells}
    </>
  );
}

function slotLabel(schedule, index, count, heat) {
  const s = describeSlot(schedule, index);
  const time = `${formatDate(s.date, { short: true })} ${formatMinutes(s.startMin)}~${formatMinutes(s.endMin)}`;
  return heat ? `${time}, ${count}명 가능` : time;
}

function HoverDetail({ schedule, index, count, names }) {
  const s = describeSlot(schedule, index);
  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm">
      <span className="font-semibold text-stone-800">
        {formatDate(s.date)} {formatMinutes(s.startMin)}~{formatMinutes(s.endMin)}
      </span>
      <span className="ml-2 text-stone-500">{count}명 가능</span>
      {names?.length > 0 && <p className="mt-1 text-stone-600">{names.join(', ')}</p>}
    </div>
  );
}
