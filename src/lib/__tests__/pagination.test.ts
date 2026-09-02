/**
 * @jest-environment node
 */

import {
  likeQuery,
  parsePagination,
  paginationMeta,
} from '../pagination';

describe('parsePagination', () => {
  it('defaults to page 1 and 25 rows', () => {
    expect(parsePagination(new URLSearchParams())).toEqual({
      page: 1,
      limit: 25,
      offset: 0,
    });
  });

  it('clamps the page size and computes offset', () => {
    expect(parsePagination(new URLSearchParams('page=3&limit=200'))).toEqual({
      page: 3,
      limit: 100,
      offset: 200,
    });
  });

  it('rejects a zero or negative page', () => {
    expect(parsePagination(new URLSearchParams('page=0&limit=10')).page).toBe(1);
    expect(parsePagination(new URLSearchParams('page=-2')).page).toBe(1);
  });
});

describe('paginationMeta', () => {
  it('returns zero pages when the list is empty', () => {
    expect(paginationMeta(1, 25, 0)).toEqual({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
    });
  });

  it('rounds up a partial last page', () => {
    expect(paginationMeta(2, 25, 26).totalPages).toBe(2);
  });
});

describe('likeQuery', () => {
  it('wraps a trimmed term for ILIKE', () => {
    expect(likeQuery('  acme ')).toBe('%acme%');
  });

  it('returns null for a blank term', () => {
    expect(likeQuery('   ')).toBeNull();
    expect(likeQuery(undefined)).toBeNull();
  });
});
