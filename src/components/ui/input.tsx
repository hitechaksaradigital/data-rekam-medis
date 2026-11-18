import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink',
          'placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
          'disabled:cursor-not-allowed disabled:bg-ground disabled:text-faint',
          className,
        )}
        {...props}
      />
    );
  },
);
