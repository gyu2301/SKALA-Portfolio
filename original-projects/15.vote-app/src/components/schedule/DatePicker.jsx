import { useState } from 'react';
import { cx } from '../ui/index.jsx';
import { LIMITS } from '../../../shared/constants.js';
import { todayIso } from '../../lib/format.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** 후보 날짜를 고르는 미니 달력. 과거 날짜는 고를 수 없다. */
export default function DatePicker({ selected, onChange }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const today = todayIso();

  const first = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const leading = first.getDay();
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shift = (delta) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const toggle = (iso) => {
    if (selected.includes(iso)) {
      onChange(selected.filter((d) => d !== iso));
    } else {
      if (selected.length >= LIMITS.MAX_DATES) return;
      onChange([...selected, iso].sort());
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="이전 달"
          className="rounded-lg px-2.5 py-1.5 text-stone-500 transition-colors hover:bg-stone-100"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-stone-800 tabular">
          {view.year}년 {view.month + 1}월
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="다음 달"
          className="rounded-lg px-2.5 py-1.5 text-stone-500 transition-colors hover:bg-stone-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={cx(
              'py-1 text-xs font-semibold',
              i === 0 ? 'text-rose-400' : i === 6 ? 'text-blue-400' : 'text-stone-400',
            )}
          >
            {w}
          </span>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />;
          const iso = isoOf(view.year, view.month, day);
          const isSelected = selected.includes(iso);
          const isPast = iso < today;
          const atLimit = !isSelected && selected.length >= LIMITS.MAX_DATES;

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast || atLimit}
              aria-pressed={isSelected}
              onClick={() => toggle(iso)}
              className={cx(
                'aspect-square rounded-lg text-sm font-semibold transition-colors tabular',
                isSelected
                  ? 'bg-amber-600 text-white'
                  : isPast || atLimit
                    ? 'cursor-not-allowed text-stone-300'
                    : iso === today
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'text-stone-700 hover:bg-stone-100',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <p className="mt-2 px-1 text-xs text-stone-500">
        {selected.length > 0
          ? `${selected.length}일 선택됨 (최대 ${LIMITS.MAX_DATES}일)`
          : '후보 날짜를 눌러 선택하세요'}
      </p>
    </div>
  );
}
