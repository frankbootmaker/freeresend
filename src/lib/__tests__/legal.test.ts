/**
 * @jest-environment node
 */

import { LOCALES } from '../locale';
import {
  CURRENT_TERMS_VERSION,
  LEGAL_DOCS,
  LEGAL_EFFECTIVE_AT,
  getLegalDocument,
  isLegalDocId,
  legalHref,
  legalMarkdown,
  parseLegalMarkdown,
  termsAcceptanceError,
} from '../legal';

describe('legal documents', () => {
  it('publishes a dated version for every locale and doc', () => {
    expect(CURRENT_TERMS_VERSION).toBe('2026-09-04');
    expect(LEGAL_EFFECTIVE_AT).toBe('2026-09-04');
    expect(isLegalDocId('terms')).toBe(true);
    expect(isLegalDocId('cookies')).toBe(false);
    expect(legalHref('privacy')).toBe('/legal/privacy');

    for (const locale of LOCALES) {
      for (const doc of LEGAL_DOCS) {
        const markdown = legalMarkdown(doc, locale);
        expect(markdown.startsWith('# ')).toBe(true);
        const page = getLegalDocument(doc, locale);
        expect(page.title.length).toBeGreaterThan(3);
        expect(page.body.length).toBeGreaterThan(1);
        expect(page.version).toBe(CURRENT_TERMS_VERSION);
      }
    }
  });

  it('falls back to English for an unknown locale', () => {
    expect(legalMarkdown('imprint', 'fr')).toBe(legalMarkdown('imprint', 'en'));
  });

  it('parses headings, paragraphs, and lists', () => {
    const blocks = parseLegalMarkdown(
      '# Title\n\nIntro line.\n\n## Section\n\n- one\n- two\n',
    );
    expect(blocks).toEqual([
      { type: 'h1', text: 'Title' },
      { type: 'p', text: 'Intro line.' },
      { type: 'h2', text: 'Section' },
      { type: 'ul', items: ['one', 'two'] },
    ]);
  });

  it('describes current product limits without inventing card billing', () => {
    const terms = legalMarkdown('terms', 'en');
    expect(terms).toMatch(/probation/i);
    expect(terms).toMatch(/5,000/);
    expect(terms).toMatch(/20,000/);
    expect(terms).toMatch(/100,000/);
    expect(terms).toMatch(/bring-your-own SES/i);
    expect(terms).toMatch(/failover DNS/i);
    expect(terms).toMatch(/\*\*Abuse\*\* tab/i);
    expect(terms).toMatch(/10%/);
    expect(terms).not.toMatch(/Stripe/i);
    expect(legalMarkdown('imprint', 'en')).toMatch(/to be completed/i);
    expect(legalMarkdown('imprint', 'hu')).toMatch(/kitöltendő/i);
  });
});

describe('termsAcceptanceError', () => {
  it('rejects missing or stale acceptance', () => {
    expect(termsAcceptanceError({})).toMatch(/must accept/i);
    expect(
      termsAcceptanceError({
        acceptedTerms: false,
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
      }),
    ).toMatch(/must accept/i);
    expect(
      termsAcceptanceError({
        acceptedTerms: true,
        acceptedTermsVersion: '2019-01-01',
      }),
    ).toMatch(/stale/i);
    expect(
      termsAcceptanceError({
        acceptedTerms: true,
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
      }),
    ).toBeNull();
  });
});
