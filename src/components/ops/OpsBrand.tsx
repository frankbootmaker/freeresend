'use client';

import { usePrefs } from '@/contexts/PrefsContext';

type OpsBrandProps = {
  onClick?: () => void;
  href?: string;
};

export default function OpsBrand({ onClick, href }: OpsBrandProps) {
  const { t } = usePrefs();
  const inner = (
    <>
      {t.brand}<b>.</b>
      <span className="by">{t.brandBy}</span>
    </>
  );

  if (href) {
    return (
      <a className="brand" href={href} aria-label={t.brandHome}>
        {inner}
      </a>
    );
  }

  return (
    <button className="brand" type="button" onClick={onClick} aria-label={t.brandHome}>
      {inner}
    </button>
  );
}
