import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'h-10 w-full appearance-none rounded-md border border-line bg-white pl-3 pr-9 text-sm text-ink',
            'focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
            'disabled:cursor-not-allowed disabled:bg-ground disabled:text-faint',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
      </div>
    );
  },
);
