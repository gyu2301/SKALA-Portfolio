import { useState } from 'react';
import { Button, cx } from './ui/index.jsx';

/** 링크 복사 + (지원하는 기기에서는) 시스템 공유 시트 */
export default function ShareBar({ poll, highlight = false, onCopied }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/p/${poll.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard API가 막힌 경우(비 HTTPS 등)를 위한 대체 경로
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    try {
      await navigator.share({ title: poll.title, text: `"${poll.title}" 투표에 참여해주세요`, url });
    } catch {
      /* 사용자가 취소한 경우 -- 아무것도 하지 않는다 */
    }
  };

  return (
    <div
      className={cx(
        'rounded-2xl border p-4',
        highlight ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-white',
      )}
    >
      {highlight && (
        <p className="mb-2 text-sm font-bold text-amber-900">
          🎉 투표가 만들어졌어요. 이 링크를 공유하세요.
        </p>
      )}
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="공유 링크"
          className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-600"
        />
        <Button onClick={copy} className="shrink-0">
          {copied ? '복사됨 ✓' : '복사'}
        </Button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <Button variant="secondary" onClick={share} className="shrink-0">
            공유
          </Button>
        )}
      </div>
    </div>
  );
}
