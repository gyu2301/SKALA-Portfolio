import { useEffect, useState } from 'react';

// 라우트가 네 개뿐이라 라이브러리 대신 History API를 직접 쓴다.

export function navigate(to, { replace = false } = {}) {
  if (replace) history.replaceState({}, '', to);
  else history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return path;
}

export function Link({ to, children, className, onClick }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        // 새 탭으로 열기(⌘/Ctrl+클릭)는 브라우저 기본 동작에 맡긴다.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
