import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

const meta = (page: number) => ({ page, pageSize: 10, total: 50, totalPages: 5 });

describe('Pagination', () => {
  it('chuyển sang trang kế khi bấm "Sau"', async () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={meta(2)} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sau' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('vô hiệu hóa "Trước" ở trang đầu và "Sau" ở trang cuối', () => {
    const { rerender } = render(<Pagination meta={meta(1)} onPageChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Trước' })).toBeDisabled();

    rerender(<Pagination meta={meta(5)} onPageChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Sau' })).toBeDisabled();
  });

  it('không hiển thị gì khi không có kết quả', () => {
    const { container } = render(
      <Pagination
        meta={{ page: 1, pageSize: 10, total: 0, totalPages: 0 }}
        onPageChange={() => undefined}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
