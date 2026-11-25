import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2',
};

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
