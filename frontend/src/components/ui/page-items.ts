export type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** Ví dụ: trang 5/10 -> [1, '…', 4, 5, 6, '…', 10] */
export function getPageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  if (totalPages < 1) return [];
  if (totalPages === 1) return [1];

  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);

  const items: PageItem[] = [1];
  if (left > 2) items.push('ellipsis-start');
  for (let p = left; p <= right; p += 1) items.push(p);
  if (right < totalPages - 1) items.push('ellipsis-end');
  items.push(totalPages);
  return items;
}
