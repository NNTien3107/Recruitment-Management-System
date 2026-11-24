import { useId, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';
import { FormField } from './Form';

export interface InputProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'w-full rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          className,
        )}
        {...props}
      />
    </FormField>
  );
}
