import { Badge } from '@/components/ui/badge';
import type { RecordStatus } from '@/types';

export function StatusBadge({ status }: { status: RecordStatus }) {
  return (
    <Badge tone={status === 'final' ? 'success' : 'warning'}>
      {status === 'final' ? 'Final' : 'Draft'}
    </Badge>
  );
}
