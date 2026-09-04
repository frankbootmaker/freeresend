'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OpsBrand from '@/components/ops/OpsBrand';
import OpsPrefs from '@/components/ops/OpsPrefs';
import LegalFooterNav from '@/components/LegalFooterNav';
import LegalInline from '@/components/LegalInline';
import { usePrefs } from '@/contexts/PrefsContext';
import {
  CURRENT_TERMS_VERSION,
  LEGAL_EFFECTIVE_AT,
  type LegalDocId,
  getLegalDocument,
  legalHref,
} from '@/lib/legal';

export default function LegalDocPage({ doc }: { doc?: LegalDocId }) {
  const { t, locale } = usePrefs();
  const router = useRouter();
  const document = doc ? getLegalDocument(doc, locale) : null;

  return (
    <>
      <header className="pubhead">
        <OpsBrand onClick={() => router.push('/')} />
        <nav className="pubnav" aria-label={t.landing.publicNav}>
          <OpsPrefs />
        </nav>
      </header>
      <main className="legal-shell">
        <article className="legal-doc">
          {document ? (
            <>
              <h1>{document.title}</h1>
              <p className="legal-meta">
                {t.legal.version(document.version)}
                {' · '}
                {t.legal.effective(document.effectiveAt)}
              </p>
              {document.body.map((block, index) => {
                if (block.type === 'ul') {
                  return (
                    <ul key={index}>
                      {block.items.map((item) => (
                        <li key={item}>
                          <LegalInline text={item} />
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === 'h2') {
                  return (
                    <h2 key={index}>
                      <LegalInline text={block.text} />
                    </h2>
                  );
                }
                if (block.type === 'h3') {
                  return (
                    <h3 key={index}>
                      <LegalInline text={block.text} />
                    </h3>
                  );
                }
                if (block.type === 'h1') {
                  return (
                    <h2 key={index}>
                      <LegalInline text={block.text} />
                    </h2>
                  );
                }
                return (
                  <p key={index}>
                    <LegalInline text={block.text} />
                  </p>
                );
              })}
            </>
          ) : (
            <>
              <h1>{t.legal.indexTitle}</h1>
              <p className="legal-meta">
                {t.legal.version(CURRENT_TERMS_VERSION)}
                {' · '}
                {t.legal.effective(LEGAL_EFFECTIVE_AT)}
              </p>
              <p>{t.legal.indexLead}</p>
              <ul className="legal-index">
                <li>
                  <Link href={legalHref('terms')}>{t.legal.terms}</Link>
                </li>
                <li>
                  <Link href={legalHref('privacy')}>{t.legal.privacy}</Link>
                </li>
                <li>
                  <Link href={legalHref('imprint')}>{t.legal.imprint}</Link>
                </li>
              </ul>
            </>
          )}
        </article>
      </main>
      <footer className="foot">
        <span>{t.landing.footBrand}</span>
        <LegalFooterNav />
        <span>{t.landing.sourceCredit}</span>
      </footer>
    </>
  );
}
