import { useState } from 'react';
import { Alert, Button, Card, Field, Input, Modal, Textarea } from './ui/index.jsx';
import { api } from '../api.js';
import { LIMITS } from '../../shared/constants.js';

/**
 * 투표 소유자용 관리 패널.
 * 관리 비밀번호로 받은 토큰이 있어야 열리고, 없으면 로그인 버튼만 보인다.
 */
export default function AdminPanel({ poll, token, onToken, onChanged, onDeleted, toast }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const login = async () => {
    setError('');
    setBusy(true);
    try {
      const { adminToken } = await api.authPoll(poll.id, password);
      onToken(adminToken);
      setLoginOpen(false);
      setPassword('');
      toast('관리자로 인증되었습니다');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn, successMessage) => {
    setBusy(true);
    try {
      const data = await fn();
      onChanged(data);
      toast(successMessage);
    } catch (err) {
      toast(err.message, 'rose');
      // 토큰이 만료되면 다시 인증받아야 한다
      if (err.status === 403) onToken('');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <>
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
            🔒 이 투표 관리하기
          </Button>
        </div>

        <Modal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          title="관리 비밀번호"
          footer={
            <>
              <Button variant="secondary" onClick={() => setLoginOpen(false)}>
                취소
              </Button>
              <Button loading={busy} onClick={login}>
                확인
              </Button>
            </>
          }
        >
          <p className="mb-3 text-sm text-stone-500">투표를 만들 때 정한 비밀번호를 입력하세요.</p>
          <Alert className="mb-3">{error}</Alert>
          <Input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="비밀번호"
          />
        </Modal>
      </>
    );
  }

  return (
    <Card className="border-stone-300 bg-stone-50">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-stone-900">🔧 관리</h2>
        <Button variant="ghost" size="sm" onClick={() => onToken('')}>
          인증 해제
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
          제목·설명 수정
        </Button>
        {poll.status === 'open' && (
          <Button
            variant="secondary"
            size="sm"
            loading={busy}
            onClick={() => run(() => api.closePoll(poll.id, token), '투표를 마감했습니다')}
          >
            지금 마감
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
          투표 삭제
        </Button>
      </div>

      {poll.type === 'choice' && poll.status === 'open' && poll.options.length > 2 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-stone-500">선택지 삭제</p>
          <div className="flex flex-wrap gap-1.5">
            {poll.options.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => api.deleteOption(poll.id, o.id, token), `'${o.label}'을(를) 삭제했습니다`)
                }
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
              >
                {o.label} ✕
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="제목·설명 수정"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              취소
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                await run(
                  () => api.updatePoll(poll.id, { title, description }, token),
                  '수정했습니다',
                );
                setEditOpen(false);
              }}
            >
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="제목" htmlFor="admin-title">
            <Input
              id="admin-title"
              value={title}
              maxLength={LIMITS.TITLE}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="설명" htmlFor="admin-desc">
            <Textarea
              id="admin-desc"
              rows={3}
              value={description}
              maxLength={LIMITS.DESCRIPTION}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="투표를 삭제할까요?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              취소
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.deletePoll(poll.id, token);
                  onDeleted();
                } catch (err) {
                  toast(err.message, 'rose');
                  setBusy(false);
                }
              }}
            >
              삭제
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-600">
          투표와 지금까지 들어온 표가 모두 사라집니다. 되돌릴 수 없습니다.
        </p>
      </Modal>
    </Card>
  );
}
