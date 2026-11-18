import type { ReactNode } from 'react';

export function EmptyState({ title, description, action }: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-subtle">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
