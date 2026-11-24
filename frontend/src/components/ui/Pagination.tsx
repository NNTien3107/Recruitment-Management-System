import type { PaginationMeta } from '../../lib/types';
import { Button } from './Button';
import { getPageItems } from './page-items';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = meta;
  if (total === 0) return null;

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-gray-600">Tổng {total} kết quả</p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </Button>
        {getPageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <Button
              key={item}
              size="sm"
              variant={item === page ? 'primary' : 'secondary'}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ) : (
            <span key={item} aria-hidden="true" className="px-1 text-gray-500">
              …
            </span>
          ),
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
