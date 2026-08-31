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
        {t.brand}<span className="wordmark-dot">.</span>
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
        {t.brand}
        <span className="wordmark-dot">.</span>
      </span>
      <span className="brand-by">{t.brandBy}</span>
    </button>
  );
}
