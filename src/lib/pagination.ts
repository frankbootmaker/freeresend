export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { limit?: number } = {},
): { page: number; limit: number; offset: number } {
  const fallback = defaults.limit ?? DEFAULT_PAGE_SIZE;
  const pageRaw = Number.parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limitRaw = Number.parseInt(
    searchParams.get('limit') || String(fallback),
    10,
  );
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, limitRaw))
    : fallback;
  return { page, limit, offset: (page - 1) * limit };
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number,
): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function likeQuery(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? `%${trimmed}%` : null;
}
