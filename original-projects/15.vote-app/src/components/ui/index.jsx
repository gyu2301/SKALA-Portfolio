import { useEffect, useRef, useState } from 'react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-300',
  secondary:
    'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 active:bg-stone-100 disabled:text-stone-400',
  ghost: 'text-stone-600 hover:bg-stone-100 active:bg-stone-200 disabled:text-stone-300',
  danger: 'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 disabled:bg-rose-300',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className, loading, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'size-5' }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <section
      {...props}
      className={cx('rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6', className)}
    >
      {children}
    </section>
  );
}

export function Field({ label, hint, error, required, children, htmlFor }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : (
        hint && <p className="text-sm text-stone-500">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 ' +
  'placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none ' +
  'disabled:bg-stone-100 disabled:text-stone-500';

export function Input({ className, ...props }) {
  return <input {...props} className={cx(inputBase, className)} />;
}

export function Textarea({ className, ...props }) {
  return <textarea {...props} className={cx(inputBase, 'resize-y', className)} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select {...props} className={cx(inputBase, 'appearance-none pr-8', className)}>
      {children}
    </select>
  );
}

/** 설정 화면의 on/off 스위치 */
export function Toggle({ checked, onChange, label, description, disabled, disabledReason }) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
        disabled
          ? 'cursor-not-allowed border-stone-200 bg-stone-50'
          : checked
            ? 'border-emerald-300 bg-emerald-50/60'
            : 'border-stone-200 bg-white hover:bg-stone-50',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cx(
          'mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked && !disabled ? 'bg-emerald-600' : 'bg-stone-300',
        )}
      >
        <span
          className={cx(
            'size-5 rounded-full bg-white shadow transition-transform',
            checked && !disabled && 'translate-x-4',
          )}
        />
      </span>
      <span className="min-w-0">
        <span className={cx('block text-sm font-semibold', disabled ? 'text-stone-400' : 'text-stone-800')}>
          {label}
        </span>
        {(disabled && disabledReason ? disabledReason : description) && (
          <span className="mt-0.5 block text-sm text-stone-500">
            {disabled && disabledReason ? disabledReason : description}
          </span>
        )}
      </span>
    </label>
  );
}

/** 라디오 카드 묶음. options: [{ value, label, description }] */
export function RadioCards({ value, onChange, options, name, columns = 1 }) {
  return (
    <div className={cx('grid gap-2', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3')}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cx(
            'cursor-pointer rounded-xl border p-3.5 transition-colors',
            value === opt.value
              ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200'
              : 'border-stone-200 bg-white hover:bg-stone-50',
          )}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="block text-sm font-semibold text-stone-800">{opt.label}</span>
          {opt.description && <span className="mt-0.5 block text-sm text-stone-500">{opt.description}</span>}
        </label>
      ))}
    </div>
  );
}

export function Badge({ tone = 'stone', children, className }) {
  const tones = {
    stone: 'bg-stone-100 text-stone-600',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Alert({ tone = 'rose', children, className }) {
  const tones = {
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  if (!children) return null;
  return (
    <div role="alert" className={cx('rounded-xl border px-4 py-3 text-sm', tones[tone], className)}>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // 배경 스크롤 방지
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="닫기" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-up relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        {title && <h2 className="mb-3 text-lg font-bold text-stone-900">{title}</h2>}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** 화면 하단에 잠깐 떴다 사라지는 알림 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = (message, tone = 'stone') => {
    clearTimeout(timer.current);
    setToast({ message, tone });
    timer.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const element = toast ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        className={cx(
          'animate-fade-up rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg',
          toast.tone === 'rose' ? 'bg-rose-600' : 'bg-stone-900',
        )}
      >
        {toast.message}
      </div>
    </div>
  ) : null;

  return { show, element };
}

export { cx };
