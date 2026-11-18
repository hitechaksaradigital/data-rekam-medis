import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, AlertCircle, HeartPulse, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { AuthProviderIcon } from './LoginBrand';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { isSupabaseConfigured } from '@/lib/supabase';
import { translateError } from '@/utils/translateError';

type Mode = 'login' | 'daftar';

export function LoginPage() {
  const { session, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  if (!isLoading && session) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        toast.success('Selamat datang kembali.');
      } else {
        const result = await signUp(fullName.trim(), email.trim(), password);
        if (result.needsConfirmation) {
          toast.success('Pendaftaran berhasil. Silakan konfirmasi email Anda terlebih dahulu.');
          setMode('login');
        } else {
          toast.success('Akun berhasil dibuat. Selamat datang.');
        }
      }
    } catch (error) {
      toast.error(translateError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Panel identitas produk */}
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-brand-800 px-12 py-12 text-white lg:flex">
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full border border-white/10" aria-hidden />
        <div className="absolute -right-8 top-1/4 h-64 w-64 rounded-full border border-white/10" aria-hidden />

        <div className="relative flex items-center gap-3">
          <AuthProviderIcon />
          <div>
            <p className="text-base font-semibold tracking-tight">RekamMedis</p>
            <p className="text-xs text-white/60">Sistem Informasi Klinik</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-0.03em]">
            Data kesehatan yang tercatat dengan tepat.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/70">
            Pendaftaran pasien, tanda vital, pemeriksaan SOAP, dan diagnosa dalam satu alur kerja
            yang tenang dan jelas untuk tim medis.
          </p>
          <div className="mt-10 flex items-center gap-6 text-xs text-white/60">
            <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Tanda vital</span>
            <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Rekam SOAP</span>
            <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Akses terbatas</span>
          </div>
        </div>

        <p className="relative text-xs text-white/45">
          Data pasien dilindungi dengan Row Level Security dan audit trail.
        </p>
      </aside>

      {/* Formulir */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-9 flex items-center gap-2 lg:hidden">
            <AuthProviderIcon />
            <span className="font-semibold text-ink">RekamMedis</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
            {mode === 'login' ? 'Masuk ke sistem' : 'Buat akun petugas'}
          </h2>
          <p className="mt-2 text-sm text-subtle">
            {mode === 'login'
              ? 'Gunakan akun yang telah diberikan administrator.'
              : 'Akun baru akan dibuat dengan perawat sebagai peran awal.'}
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-6 flex gap-2 rounded-md border border-warning-100 bg-warning-50 px-3 py-2.5 text-[13px] text-warning-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Supabase belum dikonfigurasi. Isi <code className="font-semibold">.env</code> dengan URL dan
                publishable key project Anda.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'daftar' && (
              <Field label="Nama lengkap" htmlFor="fullName" required>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama petugas"
                    className="pl-9"
                    required
                    autoComplete="name"
                  />
                </div>
              </Field>
            )}

            <Field label="Email" htmlFor="email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@klinik.id"
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </Field>

            <Field label="Kata sandi" htmlFor="password" required>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="pl-9"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </Field>

            <Button type="submit" className="w-full" isLoading={submitting}>
              {mode === 'login' ? 'Masuk' : 'Daftar'}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-subtle">
            {mode === 'login' ? 'Belum memiliki akun?' : 'Sudah memiliki akun?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'daftar' : 'login')}
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              {mode === 'login' ? 'Daftar sebagai petugas' : 'Kembali ke masuk'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
