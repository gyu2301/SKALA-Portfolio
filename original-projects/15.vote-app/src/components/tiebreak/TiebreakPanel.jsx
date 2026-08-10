import { useState } from 'react';
import { Alert, Button, Card } from '../ui/index.jsx';
import RouletteWheel from './RouletteWheel.jsx';

/**
 * 무승부 처리 패널.
 *
 * 세 가지 상태를 다룬다.
 *  - pending: 관리자가 룰렛/재투표 중 무엇을 할지 아직 안 골랐다 (생성 시 '그때 고르기'를 택한 경우)
 *  - roulette: 승자가 이미 정해져 있고, 휠은 그 칸으로 굴러가기만 한다
 *  - runoff: 다음 라운드가 열렸다
 */
export default function TiebreakPanel({ result, labelOf, canManage, onChoose, busy }) {
  const [spinDone, setSpinDone] = useState(false);
  const labels = result.leaders.map(labelOf);

  if (result.pending) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <h2 className="text-base font-bold text-amber-900">
          🤝 무승부입니다 — {labels.join(' · ')} ({result.tally.max}표)
        </h2>
        <p className="mt-1 text-sm text-amber-800">어떻게 정할지 골라주세요.</p>

        {canManage ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button loading={busy} onClick={() => onChoose('roulette')}>
              🎰 룰렛으로 뽑기
            </Button>
            <Button variant="secondary" loading={busy} onClick={() => onChoose('runoff')}>
              🔁 동점끼리 재투표
            </Button>
          </div>
        ) : (
          <Alert tone="amber" className="mt-4">
            관리 비밀번호를 가진 사람이 룰렛과 재투표 중 하나를 고르면 결과가 확정됩니다.
          </Alert>
        )}
      </Card>
    );
  }

  if (result.tiebreak === 'roulette') {
    return (
      <Card className="text-center">
        <h2 className="text-base font-bold text-stone-900">🎰 동점이라 룰렛을 돌렸습니다</h2>
        <p className="mt-1 text-sm text-stone-500">
          {labels.length}개 후보가 {result.tally.max}표로 동점이었습니다.
        </p>

        <div className="mt-5 flex justify-center">
          <RouletteWheel
            items={labels}
            winnerIndex={result.rouletteIndex}
            onSpinEnd={() => setSpinDone(true)}
          />
        </div>

        <p
          className={cxFade(spinDone)}
          aria-live="polite"
        >
          {spinDone ? (
            <>
              당첨 — <span className="text-amber-600">{labelOf(result.winner)}</span>
            </>
          ) : (
            '돌리는 중…'
          )}
        </p>
      </Card>
    );
  }

  if (result.tiebreak === 'runoff') {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <h2 className="text-base font-bold text-amber-900">🔁 동점이라 재투표를 시작했습니다</h2>
        <p className="mt-1 text-sm text-amber-800">
          {labels.join(' · ')} 중에서 다시 골라주세요. 링크는 그대로입니다.
        </p>
      </Card>
    );
  }

  return null;
}

function cxFade(done) {
  return `mt-5 text-xl font-extrabold transition-opacity duration-500 ${
    done ? 'text-stone-900 opacity-100' : 'text-stone-400 opacity-70'
  }`;
}
