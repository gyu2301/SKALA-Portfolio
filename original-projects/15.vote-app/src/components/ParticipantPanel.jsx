import { Badge, Card } from './ui/index.jsx';

/**
 * 투표 완료 현황.
 * 명단이 있으면 미참여자까지 짚어주고, 없으면 참여한 사람만 보여준다.
 * 익명 투표에서는 인원수만 나온다 -- 누가 했는지 아는 순간 익명이 아니게 되므로.
 */
export default function ParticipantPanel({ poll, participation, abstainNames }) {
  const { total, voted, roster, missing } = participation;
  const anonymous = poll.settings.anonymous;

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-stone-900">참여 현황</h2>
        <span className="text-sm font-semibold text-stone-500 tabular">
          {roster?.length > 0 ? `${total} / ${roster.length}명` : `${total}명 참여`}
        </span>
      </div>

      {roster?.length > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
            style={{ width: `${Math.min(100, Math.round((total / roster.length) * 100))}%` }}
          />
        </div>
      )}

      {anonymous ? (
        <p className="mt-3 text-sm text-stone-500">익명 투표라 누가 참여했는지는 표시하지 않습니다.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {voted?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-stone-500">완료</p>
              <div className="flex flex-wrap gap-1.5">
                {voted.map((name, i) => (
                  <Badge key={`${name}-${i}`} tone="green">
                    ✓ {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {missing?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-stone-500">아직 안 함</p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((name) => (
                  <Badge key={name} tone="stone">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {abstainNames?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-stone-500">기권</p>
              <div className="flex flex-wrap gap-1.5">
                {abstainNames.map((name, i) => (
                  <Badge key={`${name}-${i}`} tone="amber">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {total === 0 && <p className="text-sm text-stone-500">아직 아무도 참여하지 않았습니다.</p>}
        </div>
      )}
    </Card>
  );
}
