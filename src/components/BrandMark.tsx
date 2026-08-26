'use client';

import { usePrefs } from '@/contexts/PrefsContext';

type BrandMarkProps = {
  onClick?: () => void;
  compact?: boolean;
};

export default function BrandMark({ onClick, compact }: BrandMarkProps) {
  const { t } = usePrefs();

  if (compact) {
    return (
      <button
        className="op-rail-brand"
        type="button"
        onClick={onClick}
        aria-label={t.brandHome}
      >
        OutPost<span className="wordmark-dot">.</span>
        <span className="brand-by">{t.brandBy}</span>
      </button>
    );
  }

  return (
    <button
      className="brand"
      type="button"
      onClick={onClick}
      aria-label={t.brandHome}
    >
      <span className="brand-mark">
        Out<span className="brand-post">Post</span>
        <span className="wordmark-dot">.</span>
      </span>
      <span className="brand-by">{t.brandBy}</span>
    </button>
  );
}
