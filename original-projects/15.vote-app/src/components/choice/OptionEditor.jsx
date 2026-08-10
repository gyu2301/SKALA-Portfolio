import { useState } from 'react';
import { Button, Input, Select, cx } from '../ui/index.jsx';
import { LIMITS, PRICE_BANDS } from '../../../shared/constants.js';

/**
 * 선택지 입력. 메뉴명은 필수, 가게명·가격대·메모는 접어둔 상태로 두고 필요할 때만 편다.
 * 점심 메뉴 정하기가 주 용도라 기본 화면은 최대한 가볍게 유지한다.
 */
export default function OptionEditor({ options, onChange }) {
  const [expanded, setExpanded] = useState(() => new Set());

  const update = (index, patch) => {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  const remove = (index) => {
    onChange(options.filter((_, i) => i !== index));
    setExpanded(new Set());
  };

  const add = () => {
    if (options.length >= LIMITS.MAX_OPTIONS) return;
    onChange([...options, { label: '', place: '', priceBand: '', note: '' }]);
  };

  const toggleDetail = (index) => {
    const next = new Set(expanded);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpanded(next);
  };

  const hasDetail = (o) => Boolean(o.place || o.priceBand || o.note);

  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const open = expanded.has(index) || hasDetail(option);
        return (
          <div key={index} className="rounded-xl border border-stone-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-center text-sm font-bold text-stone-400 tabular">
                {index + 1}
              </span>
              <Input
                value={option.label}
                maxLength={LIMITS.OPTION_LABEL}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="메뉴명 (예: 김치찌개)"
                aria-label={`${index + 1}번 선택지 메뉴명`}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => toggleDetail(index)}
                aria-expanded={open}
                className={cx(
                  'shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors',
                  open ? 'bg-amber-100 text-amber-700' : 'text-stone-500 hover:bg-stone-100',
                )}
              >
                상세
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={options.length <= 2}
                aria-label={`${index + 1}번 선택지 삭제`}
                className="shrink-0 rounded-lg px-2.5 py-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-stone-200 disabled:hover:bg-transparent"
              >
                ✕
              </button>
            </div>

            {open && (
              <div className="mt-2.5 grid gap-2 pl-8 sm:grid-cols-2">
                <Input
                  value={option.place}
                  maxLength={LIMITS.OPTION_PLACE}
                  onChange={(e) => update(index, { place: e.target.value })}
                  placeholder="가게명 (선택)"
                  aria-label={`${index + 1}번 선택지 가게명`}
                />
                <Select
                  value={option.priceBand}
                  onChange={(e) => update(index, { priceBand: e.target.value })}
                  aria-label={`${index + 1}번 선택지 가격대`}
                >
                  <option value="">가격대 (선택)</option>
                  {PRICE_BANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </Select>
                <Input
                  value={option.note}
                  maxLength={LIMITS.OPTION_NOTE}
                  onChange={(e) => update(index, { note: e.target.value })}
                  placeholder="메모 (선택) — 도보 5분, 예약 필요 등"
                  aria-label={`${index + 1}번 선택지 메모`}
                  className="sm:col-span-2"
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" size="sm" onClick={add} disabled={options.length >= LIMITS.MAX_OPTIONS}>
          + 선택지 추가
        </Button>
        <span className="text-xs text-stone-400 tabular">
          {options.length} / {LIMITS.MAX_OPTIONS}
        </span>
      </div>
    </div>
  );
}
