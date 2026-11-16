import type { PaginationMeta } from '../types/models';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (nextPage: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = meta;

  if (totalPages <= 1) return null;

  const getPageNumbers = (): number[] => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="rms-pagination" role="navigation" aria-label="Phân trang">
      <div className="rms-pagination-info">
        Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng{' '}
        <strong>{total.toLocaleString('vi-VN')}</strong> kết quả)
      </div>

      <div className="rms-pagination-controls">
        <button
          type="button"
          className="rms-btn rms-btn-outline rms-btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Trước
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              className="rms-btn rms-btn-outline rms-btn-sm"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {pages[0] > 2 && <span className="rms-pagination-ellipsis">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`rms-btn rms-btn-sm ${p === page ? 'rms-btn-primary' : 'rms-btn-outline'}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="rms-pagination-ellipsis">…</span>
            )}
            <button
              type="button"
              className="rms-btn rms-btn-outline rms-btn-sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className="rms-btn rms-btn-outline rms-btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
