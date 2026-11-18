import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-ink',
          'placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
          'disabled:cursor-not-allowed disabled:bg-ground disabled:text-faint',
          className,
        )}
        {...props}
      />
    );
  },
);
