import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('gắn nhãn với ô nhập', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('hiển thị lỗi và đánh dấu không hợp lệ', () => {
    render(<Input label="Email" error="Email không hợp lệ" />);

    expect(screen.getByLabelText('Email')).toBeInvalid();
    expect(screen.getByRole('alert')).toHaveTextContent('Email không hợp lệ');
  });
});
