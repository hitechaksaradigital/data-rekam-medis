import { NavLink } from 'react-router-dom';
import { Activity, FileText, LayoutDashboard, LogOut, ShieldCheck, Users, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';
import { inisial } from '@/utils/format';
import type { UserRole } from '@/types';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/pasien', label: 'Data Pasien', icon: Users },
  { to: '/rekam-medis', label: 'Rekam Medis', icon: FileText },
  { to: '/pengguna', label: 'Pengguna', icon: ShieldCheck, roles: ['admin'] },
];

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { profile, role, signOut } = useAuth();
  const terlihat = navItems.filter((item) => !item.roles || (role && item.roles.includes(role)));

  const isi = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center gap-2.5 px-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
          <Activity className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-ink">RekamMedis</p>
          <p className="text-[11px] text-faint">Sistem Informasi Klinik</p>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-auto rounded p-1 text-faint hover:bg-ground lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 pt-5" aria-label="Navigasi utama">
        <p className="mb-2 px-3 text-xs font-medium text-faint">Menu utama</p>
        <div className="space-y-1">
          {terlihat.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                  isActive
                    ? 'bg-ground font-medium text-ink'
                    : 'text-subtle hover:bg-ground/70 hover:text-ink',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700">
            {inisial(profile?.full_name ?? 'Petugas')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {profile?.full_name ?? 'Petugas'}
            </p>
            <p className="text-[11px] capitalize text-faint">{role ?? 'perawat'}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded p-1.5 text-faint hover:bg-ground hover:text-danger-600"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r border-line bg-white lg:block">
        {isi}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onCloseMobile} aria-hidden />
          <aside className="relative h-full w-[272px] border-r border-line bg-white">{isi}</aside>
        </div>
      )}
    </>
  );
}
