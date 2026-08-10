import { useState } from 'react';
import { Badge, Button, Card } from '../components/ui/index.jsx';
import { Link, navigate } from '../lib/router.jsx';
import { formatRelativePast } from '../lib/format.js';
import { forgetPoll, getRecentPolls } from '../lib/voter.js';

export default function Home() {
  const [recent, setRecent] = useState(getRecentPolls);

  const remove = (id) => {
    forgetPoll(id);
    setRecent(getRecentPolls());
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-10 text-white">
        <h1 className="text-2xl font-extrabold sm:text-3xl">뭐 먹을지, 언제 만날지</h1>
        <p className="mt-2 text-emerald-50">
          투표를 만들고 링크만 보내면 끝. 가입도, 로그인도 필요 없습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            size="lg"
            className="bg-white !text-emerald-700 hover:bg-emerald-50"
            onClick={() => navigate('/new?type=choice')}
          >
            🍽️ 메뉴 정하기
          </Button>
          <Button
            size="lg"
            className="border border-white/40 bg-white/10 text-white hover:bg-white/20"
            onClick={() => navigate('/new?type=schedule')}
          >
            📅 날짜 조율하기
          </Button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: '🎰', title: '동점이면 룰렛', body: '같은 표수가 나오면 룰렛으로 뽑거나 재투표합니다.' },
          { icon: '🎨', title: '테마를 골라요', body: '스티커보드, 채팅, 아케이드 중 투표 분위기를 정할 수 있습니다.' },
          { icon: '🔒', title: '함부로 못 지움', body: '관리 비밀번호를 아는 사람만 수정하고 삭제할 수 있습니다.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-stone-200 bg-white p-4">
            <span className="text-xl" aria-hidden="true">
              {f.icon}
            </span>
            <h2 className="mt-2 text-sm font-bold text-stone-900">{f.title}</h2>
            <p className="mt-1 text-sm text-stone-500">{f.body}</p>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <Card>
          <h2 className="text-base font-bold text-stone-900">최근 본 투표</h2>
          <p className="mt-1 text-sm text-stone-500">이 브라우저에만 저장되는 기록입니다.</p>
          <ul className="mt-4 divide-y divide-stone-100">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <span className="text-lg" aria-hidden="true">
                  {p.type === 'schedule' ? '📅' : '🍽️'}
                </span>
                <Link to={`/p/${p.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-900">{p.title}</span>
                  <span className="text-xs text-stone-400">{formatRelativePast(p.seenAt)}</span>
                </Link>
                {p.owner && <Badge tone="amber">내가 만듦</Badge>}
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`${p.title} 기록 지우기`}
                  className="rounded-lg px-2 py-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-center text-xs text-stone-400">
        <Link to="/admin" className="underline underline-offset-2 hover:text-stone-600">
          관리자 페이지
        </Link>
      </p>
    </div>
  );
}
