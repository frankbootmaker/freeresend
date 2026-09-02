'use client';

import { usePrefs } from '@/contexts/PrefsContext';

export default function ListPager({
  page,
  totalPages,
  total,
  limit,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  const { t } = usePrefs();
  if (total <= 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const last = Math.max(totalPages, 1);

  return (
    <nav className="pager" aria-label={t.pager.pageOf(page, last)}>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t.pager.previous}
      </button>
      <span className="muted">{t.pager.pageOf(page, last)}</span>
      <button
        type="button"
        disabled={page >= last}
        onClick={() => onPage(page + 1)}
      >
        {t.pager.next}
      </button>
      <span className="muted">{t.pager.showing(from, to, total)}</span>
    </nav>
  );
}
