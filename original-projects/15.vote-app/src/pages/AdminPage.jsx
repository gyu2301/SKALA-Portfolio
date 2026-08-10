import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Field, Input, Modal, Spinner, useToast } from '../components/ui/index.jsx';
import { api } from '../api.js';
import { Link } from '../lib/router.jsx';
import { formatRelativePast } from '../lib/format.js';
import { getAdminToken, setAdminToken } from '../lib/voter.js';

/** 전역 관리자 화면. 스팸이나 신고된 투표를 지우기 위한 최소한의 도구만 둔다. */
export default function AdminPage() {
  const toast = useToast();
  const [token, setToken] = useState(getAdminToken);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [polls, setPolls] = useState(null);
  const [target, setTarget] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(
    async (activeToken) => {
      try {
        const data = await api.adminPolls(activeToken);
        setPolls(data.polls);
      } catch (err) {
        if (err.status === 403) {
          setAdminToken('');
          setToken('');
          setError('로그인이 만료되었습니다. 다시 로그인해주세요.');
        } else {
          setError(err.message);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  const login = async () => {
    setError('');
    setBusy(true);
    try {
      const { adminToken } = await api.adminLogin(password);
      setAdminToken(adminToken);
      setToken(adminToken);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.adminDelete(target.id, token);
      setPolls((prev) => prev.filter((p) => p.id !== target.id));
      toast.show(`'${target.title}' 투표를 삭제했습니다`);
      setTarget(null);
    } catch (err) {
      toast.show(err.message, 'rose');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-sm py-10">
        {toast.element}
        <Card className="space-y-4">
          <div>
            <h1 className="text-lg font-extrabold text-stone-900">관리자 로그인</h1>
            <p className="mt-1 text-sm text-stone-500">
              모든 투표를 조회하고 삭제할 수 있습니다. 개별 투표는 각 투표의 관리 비밀번호로 관리하세요.
            </p>
          </div>
          <Alert>{error}</Alert>
          <Field label="관리자 비밀번호" htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />
          </Field>
          <Button className="w-full" loading={busy} onClick={login}>
            로그인
          </Button>
        </Card>
      </div>
    );
  }

  const filtered = (polls ?? []).filter(
    (p) => !query.trim() || p.title.toLowerCase().includes(query.trim().toLowerCase()) || p.id.includes(query.trim()),
  );

  return (
    <div className="space-y-4">
      {toast.element}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-stone-900">전체 투표</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdminToken('');
            setToken('');
          }}
        >
          로그아웃
        </Button>
      </div>

      <Alert>{error}</Alert>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목 또는 ID로 검색"
        aria-label="투표 검색"
      />

      {polls === null ? (
        <div className="flex justify-center py-16 text-stone-400">
          <Spinner className="size-8" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-stone-500">
            {polls.length === 0 ? '아직 만들어진 투표가 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        </Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-stone-100">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg" aria-hidden="true">
                  {p.type === 'schedule' ? '📅' : '🍽️'}
                </span>
                <Link to={`/p/${p.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-900">{p.title}</span>
                  <span className="text-xs text-stone-400 tabular">
                    {p.id} · {formatRelativePast(p.createdAt)}
                    {p.round > 1 && ` · ${p.round}라운드`}
                  </span>
                </Link>
                <Badge tone={p.status === 'open' ? 'green' : 'stone'}>
                  {p.status === 'open' ? '진행 중' : '마감'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setTarget(p)}>
                  삭제
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-center text-xs text-stone-400 tabular">{filtered.length}개 표시 중</p>

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="투표를 삭제할까요?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>
              취소
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              삭제
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600">
          <span className="font-semibold">{target?.title}</span> 투표와 지금까지 들어온 표가 모두
          사라집니다. 되돌릴 수 없습니다.
        </p>
      </Modal>
    </div>
  );
}
