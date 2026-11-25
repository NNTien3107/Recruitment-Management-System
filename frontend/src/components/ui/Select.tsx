import { useId, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';
import { FormField } from './Form';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, className, children, ...props }: SelectProps) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'w-full rounded border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}
