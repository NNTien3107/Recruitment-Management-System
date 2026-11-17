export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export function buildPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  const safePageSize = Math.max(1, pageSize);
  const safeTotal = Math.max(0, total);

  return {
    items,
    meta: {
      page,
      pageSize: safePageSize,
      total: safeTotal,
      totalPages: Math.ceil(safeTotal / safePageSize),
    },
  };
}
