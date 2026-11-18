import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllergyBannerProps {
  allergies: string[];
  className?: string;
}

/**
 * Informasi alergi selalu ditampilkan di bagian atas halaman rekam medis.
 * Merah ketika ada alergi, netral ketika tidak ada (Bagian 6.3 standarisasi).
 */
export function AllergyBanner({ allergies, className }: AllergyBannerProps) {
  const adaAlergi = allergies.length > 0;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border px-4 py-3',
        adaAlergi
          ? 'border-danger-100 bg-danger-50 text-danger-700'
          : 'border-line bg-ground text-subtle',
        className,
      )}
      role={adaAlergi ? 'alert' : undefined}
    >
      {adaAlergi ? (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">
          {adaAlergi ? 'RIWAYAT ALERGI PASIEN' : 'Tidak ada riwayat alergi tercatat'}
        </p>
        {adaAlergi ? (
          <p className="mt-1 text-sm font-medium text-danger-700">
            {allergies.join(' • ')}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-faint">
            Tetap konfirmasi kembali kepada pasien sebelum memberikan terapi.
          </p>
        )}
      </div>
    </div>
  );
}
