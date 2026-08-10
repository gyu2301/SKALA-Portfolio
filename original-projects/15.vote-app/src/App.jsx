import { Link, usePath } from './lib/router.jsx';
import Home from './pages/Home.jsx';
import CreatePoll from './pages/CreatePoll.jsx';
import PollView from './pages/PollView.jsx';
import AdminPage from './pages/AdminPage.jsx';

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-base font-extrabold text-stone-900">
          <span aria-hidden="true">🗳️</span>
          투표하기
        </Link>
        <Link
          to="/new"
          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          새 투표
        </Link>
      </div>
    </header>
  );
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl" aria-hidden="true">
        🤔
      </p>
      <h1 className="mt-4 text-xl font-bold text-stone-900">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-stone-500">주소가 정확한지 확인해주세요.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
      >
        처음으로
      </Link>
    </div>
  );
}

export default function App() {
  const path = usePath();

  let page;
  if (path === '/') page = <Home />;
  else if (path === '/new') page = <CreatePoll />;
  else if (path === '/admin') page = <AdminPage />;
  else if (path.startsWith('/p/')) {
    const id = path.split('/')[2];
    // key를 주어 다른 투표로 이동할 때 상태가 섞이지 않게 한다.
    page = id ? <PollView key={id} pollId={id} /> : <NotFound />;
  } else page = <NotFound />;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">{page}</main>
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400">
        링크 하나로 공유하는 간편 투표
      </footer>
    </div>
  );
}
