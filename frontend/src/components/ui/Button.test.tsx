import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('gọi onClick khi bấm', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Lưu</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('bị vô hiệu hóa và không gọi onClick khi đang loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Lưu
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Lưu' });
    expect(button).toBeDisabled();
    await userEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('mặc định không phải nút submit', () => {
    render(<Button>Nút</Button>);
    expect(screen.getByRole('button', { name: 'Nút' })).toHaveAttribute('type', 'button');
  });
});
