'use client';

import Link from 'next/link';
import { usePrefs } from '@/contexts/PrefsContext';
import { LEGAL_DOCS, legalHref } from '@/lib/legal';

export default function LegalFooterNav() {
  const { t } = usePrefs();
  return (
    <nav className="foot-legal" aria-label={t.legal.nav}>
      {LEGAL_DOCS.map((doc) => (
        <Link key={doc} href={legalHref(doc)}>
          {t.legal[doc]}
        </Link>
      ))}
    </nav>
  );
}
