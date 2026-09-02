'use client';

import { PAGE_SIZE_OPTIONS } from '@/lib/pagination';
import { usePrefs } from '@/contexts/PrefsContext';

export default function ListPager({
  page,
  totalPages,
  total,
  limit,
  onPage,
  onLimit,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}) {
  const { t } = usePrefs();
  if (total <= 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const last = Math.max(totalPages, 1);
  const sizes = PAGE_SIZE_OPTIONS.includes(limit as (typeof PAGE_SIZE_OPTIONS)[number])
    ? PAGE_SIZE_OPTIONS
    : [...PAGE_SIZE_OPTIONS, limit].sort((a, b) => a - b);

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
      <label className="pager-size">
        <span className="muted">{t.pager.perPage}</span>
        <select
          value={limit}
          aria-label={t.pager.perPage}
          onChange={(event) => onLimit(Number(event.target.value))}
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}
