const PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

/** 문자열을 팔레트 인덱스로 결정적으로 매핑한다. 이름이 같으면 항상 같은 색이 나온다. */
function colorFor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/**
 * 스티커보드 테마의 투표자 표시.
 *
 * 기명이면 이름 첫 글자를 색깔 동그라미(스티커)로, 익명이면 이름을 알 수 없으니
 * 순서에 따라 팔레트를 돌려가며 색만 다른 동그라미를 붙인다 -- "누가"는 감추면서도
 * "여러 사람이 붙였다"는 느낌은 살린다.
 */
export default function StickerDots({ count, names, max = 10 }) {
  if (!count) return null;
  const anonymous = !names || names.length === 0;
  const items = anonymous
    ? Array.from({ length: count }, (_, i) => ({ key: `a${i}`, label: '', color: PALETTE[i % PALETTE.length] }))
    : names.map((n, i) => ({ key: `${n}-${i}`, label: n.slice(0, 1), color: colorFor(n) }));

  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1" aria-hidden="true">
      {shown.map((it, i) => (
        <span
          key={it.key}
          className="animate-sticker-land flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow ring-2 ring-white"
          style={{ backgroundColor: it.color, '--sticker-rot': `${((i % 5) - 2) * 4}deg`, animationDelay: `${i * 40}ms` }}
        >
          {it.label}
        </span>
      ))}
      {overflow > 0 && (
        <span className="flex size-6 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600 ring-2 ring-white">
          +{overflow}
        </span>
      )}
    </div>
  );
}
