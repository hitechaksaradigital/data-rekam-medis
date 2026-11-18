import { Menu, Stethoscope } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { role, profile } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-line bg-white px-5 sm:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded p-1.5 text-subtle hover:bg-ground lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 text-[13px] text-faint">
        <Stethoscope className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Ruang kerja klinik</span>
        <span className="sm:hidden">Klinik</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-xs text-faint sm:inline">
          {profile?.sip_number ? `SIP ${profile.sip_number}` : ''}
        </span>
        <span className="rounded border border-line bg-ground px-2.5 py-1 text-[11px] font-medium capitalize text-subtle">
          {role ?? 'perawat'}
        </span>
      </div>
    </header>
  );
}
