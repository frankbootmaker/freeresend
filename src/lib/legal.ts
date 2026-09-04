import type { Locale } from './locale';
import { isLocale } from './locale';
import { LEGAL_COPY } from './legal-copy';

export const CURRENT_TERMS_VERSION = '2026-09-04';
export const LEGAL_EFFECTIVE_AT = '2026-09-04';

export const LEGAL_DOCS = ['terms', 'privacy', 'imprint'] as const;
export type LegalDocId = (typeof LEGAL_DOCS)[number];

export type LegalBlock =
  | { type: 'h1' | 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul'; items: string[] };

export function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOCS as readonly string[]).includes(value);
}

export function legalHref(doc: LegalDocId): string {
  return `/legal/${doc}`;
}

export function legalMarkdown(doc: LegalDocId, locale: Locale | string): string {
  const resolved: Locale = isLocale(locale) ? locale : 'en';
  return LEGAL_COPY[resolved][doc] || LEGAL_COPY.en[doc];
}

export function parseLegalMarkdown(markdown: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ type: 'ul', items: list });
    list = [];
  };

  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      list.push(trimmed.slice(2).trim());
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function getLegalDocument(doc: LegalDocId, locale: Locale | string) {
  const blocks = parseLegalMarkdown(legalMarkdown(doc, locale));
  const title =
    blocks.find((block) => block.type === 'h1')?.text ?? doc;
  const body = blocks.filter(
    (block, index) => !(index === 0 && block.type === 'h1'),
  );
  return {
    title,
    body,
    version: CURRENT_TERMS_VERSION,
    effectiveAt: LEGAL_EFFECTIVE_AT,
  };
}

export function termsAcceptanceError(input: {
  acceptedTerms?: boolean;
  acceptedTermsVersion?: string;
}): string | null {
  if (input.acceptedTerms !== true) {
    return 'You must accept the current Terms, Privacy policy, and Imprint';
  }
  if (input.acceptedTermsVersion !== CURRENT_TERMS_VERSION) {
    return 'Terms version is stale; refresh and accept the current documents';
  }
  return null;
}
