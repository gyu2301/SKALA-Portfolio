import { useEffect, useState } from 'react';

// 지도 컨셉에 맞춘 색: 가죽·금박·나침반 놋쇠 톤
const COLORS = ['#92400e', '#b45309', '#78350f', '#a16207', '#7c2d12', '#854d0e', '#9a3412', '#713f12'];
const SIZE = 240;
const R = 108;
const C = SIZE / 2;
const SPINS = 6;

const point = (deg, radius) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)];
};

function sectorPath(from, to) {
  const [x1, y1] = point(from, R);
  const [x2, y2] = point(to, R);
  const largeArc = to - from > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/**
 * 동점 후보를 돌리는 룰렛.
 *
 * 승자는 서버가 이미 정해서 저장해둔 값(winnerIndex)이다. 여기서는 그 칸이
 * 바늘 아래에 오도록 최종 각도를 역산해 돌릴 뿐이라, 새로고침해도 결과가 바뀌지 않는다.
 */
export default function RouletteWheel({ items, winnerIndex, onSpinEnd }) {
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const sector = 360 / items.length;
  const target = SPINS * 360 - (winnerIndex + 0.5) * sector;
  const [angle, setAngle] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      onSpinEnd?.();
      return undefined;
    }
    // 초기 각도(0)가 한 번 그려진 뒤에 목표 각도로 바꿔야 CSS 전환이 걸린다.
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setAngle(target)));
    const done = setTimeout(() => onSpinEnd?.(), 4400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [target, reduceMotion, onSpinEnd]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* 12시 방향 바늘: 지도 핀이 위에서 콕 찍는 모양 */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2 text-3xl drop-shadow"
        >
          📍
        </div>

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          className="roulette-wheel drop-shadow-lg"
          style={{ transform: `rotate(${angle}deg)` }}
          role="img"
          aria-label={`${items.length}개 후보 중 하나를 뽑는 룰렛`}
        >
          {items.map((item, i) => {
            const [tx, ty] = point((i + 0.5) * sector, R * 0.62);
            const label = item.length > 6 ? `${item.slice(0, 5)}…` : item;
            return (
              <g key={i}>
                <path d={sectorPath(i * sector, (i + 1) * sector)} fill={COLORS[i % COLORS.length]} />
                <text
                  x={tx}
                  y={ty}
                  fill="white"
                  fontSize={items.length > 6 ? 11 : 13}
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${(i + 0.5) * sector}, ${tx}, ${ty})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle cx={C} cy={C} r={R} fill="none" stroke="#fef3c7" strokeWidth="3" />
          <circle cx={C} cy={C} r="16" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
