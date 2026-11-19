import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isThisMonth, parseISO, startOfDay, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ArrowRight, CalendarCheck, ClipboardList, UserPlus, UsersRound } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMedicalRecords } from '@/features/medical-records/api';
import { usePatients } from '@/features/patients/api';
import { formatAngka, formatTanggalPendek, formatTanggalWaktu, hitungUmur } from '@/utils/format';
import { rangkumObat } from '@/utils/medications';

function KPI({ label, value, satuan, icon: Icon }: {
  label: string;
  value: number;
  satuan?: string;
  icon: typeof UsersRound;
}) {
  return (
    <div className="px-5 py-4 first:pl-0 last:pr-0 sm:px-6">
      <div className="flex items-center gap-2 text-[13px] text-subtle">
        <Icon className="h-4 w-4 text-faint" strokeWidth={1.8} aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink tabular-nums">
        {formatAngka(value)}
        {satuan && <span className="ml-1 text-sm font-normal text-faint">{satuan}</span>}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { role } = useAuth();
  const { data: patients, isLoading: loadingPatients } = usePatients('');
  const { data: records, isLoading: loadingRecords } = useMedicalRecords({ search: '', status: 'semua' });

  const statistik = useMemo(() => {
    const daftarPasien = patients ?? [];
    const daftarRekam = records ?? [];
    const hariIni = startOfDay(new Date());

    const kunjunganHariIni = daftarRekam.filter((item) =>
      isToday(parseISO(item.visit_date)),
    ).length;

    const kunjungan7Hari = Array.from({ length: 7 }, (_, index) => {
      const tanggal = subDays(hariIni, 6 - index);
      return {
        tanggal,
        label: format(tanggal, 'EEE', { locale: localeId }),
        count: daftarRekam.filter((item) =>
          startOfDay(parseISO(item.visit_date)).getTime() === tanggal.getTime(),
        ).length,
      };
    });

    return {
      totalPasien: daftarPasien.length,
      kunjunganHariIni,
      draft: daftarRekam.filter((item) => item.status === 'draft').length,
      pasienBulanIni: daftarPasien.filter((item) => isThisMonth(parseISO(item.created_at))).length,
      kunjungan7Hari,
      obatTeratas: rangkumObat(
        daftarRekam.filter((item) => item.status === 'final').map((item) => item.plan),
      ),
      rekamTerbaru: daftarRekam.slice(0, 5),
      pasienTerbaru: [...daftarPasien]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4),
    };
  }, [patients, records]);

  const maksimum = Math.max(1, ...statistik.kunjungan7Hari.map((item) => item.count));

  return (
    <>
      <PageHeader
        title="Ringkasan"
        description={
          statistik.draft > 0
            ? `${statistik.kunjunganHariIni} kunjungan hari ini, ${statistik.draft} rekam menunggu finalisasi.`
            : `${statistik.kunjunganHariIni} kunjungan tercatat hari ini.`
        }
        actions={
          role !== 'admin' && (
            <Link to="/rekam-medis/baru">
              <Button>Catat kunjungan</Button>
            </Link>
          )
        }
      />

      {loadingPatients || loadingRecords ? (
        <div className="space-y-5">
          <Skeleton className="h-24 w-full rounded-panel" />
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <Skeleton className="h-[320px] w-full rounded-panel" />
            <Skeleton className="h-[320px] w-full rounded-panel" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI: angka sebagai teks, dipisah garis, tanpa tile berikon warna */}
          <section className="panel grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0" aria-label="Statistik utama">
            <KPI label="Total pasien aktif" value={statistik.totalPasien} icon={UsersRound} />
            <KPI label="Kunjungan hari ini" value={statistik.kunjunganHariIni} icon={CalendarCheck} />
            <KPI label="Rekam draft" value={statistik.draft} icon={ClipboardList} />
            <KPI label="Pasien baru bulan ini" value={statistik.pasienBulanIni} icon={UserPlus} />
          </section>

          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <section className="panel" aria-label="Kunjungan 7 hari terakhir">
              <div className="panel-header">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Kunjungan 7 hari terakhir</h2>
                  <p className="mt-0.5 text-xs text-faint">Jumlah kunjungan per hari</p>
                </div>
                <span className="text-xs text-faint tabular-nums">
                  {formatAngka(statistik.kunjungan7Hari.reduce((total, item) => total + item.count, 0))} total
                </span>
              </div>
              <div className="px-5 pb-4 pt-6">
                <div className="flex h-[200px] items-end gap-2 sm:gap-3">
                  {statistik.kunjungan7Hari.map((item) => (
                    <div key={item.tanggal.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-xs font-medium text-ink tabular-nums">{item.count || ''}</span>
                      <div
                        className="w-full max-w-[44px] bg-brand-600 transition-[height] duration-300"
                        style={{ height: `${Math.max(2, (item.count / maksimum) * 150)}px` }}
                        title={`${item.label}: ${item.count} kunjungan`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2 border-t border-line pt-3 sm:gap-3">
                  {statistik.kunjungan7Hari.map((item) => (
                    <span key={item.tanggal.toISOString()} className="flex-1 text-center text-xs text-faint">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel" aria-label="Pasien terbaru">
              <div className="panel-header">
                <h2 className="text-sm font-semibold text-ink">Pasien terbaru</h2>
                <Link to="/pasien" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                  Lihat semua <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
              {statistik.pasienTerbaru.length ? (
                <ul className="divide-y divide-line">
                  {statistik.pasienTerbaru.map((pasien) => (
                    <li key={pasien.id}>
                      <Link to={`/pasien/${pasien.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ground/60">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{pasien.full_name}</p>
                          <p className="mt-0.5 text-xs text-faint">
                            {pasien.no_rm} • {hitungUmur(pasien.date_of_birth)}
                          </p>
                        </div>
                        {pasien.allergies.length > 0 && <Badge tone="danger">Alergi</Badge>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Belum ada pasien" description="Daftarkan pasien pertama untuk memulai." />
              )}
            </section>
          </div>

          <section className="panel" aria-label="Obat paling sering diresepkan">
            <div className="panel-header">
              <div>
                <h2 className="text-sm font-semibold text-ink">Obat paling sering diresepkan</h2>
                <p className="mt-0.5 text-xs text-faint">Dari resep pada rekam medis yang telah final</p>
              </div>
              <Link to="/resep" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                Lihat resep <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            {statistik.obatTeratas.length ? (
              <div className="space-y-3.5 px-5 py-5">
                {statistik.obatTeratas.map((obat) => (
                  <div key={obat.name} className="grid grid-cols-[112px_1fr_40px] items-center gap-3 sm:grid-cols-[180px_1fr_48px] sm:gap-4">
                    <span className="truncate text-[13px] font-medium text-ink" title={obat.name}>
                      {obat.name}
                    </span>
                    <div className="h-2.5 w-full rounded-sm bg-ground">
                      <div
                        className="h-2.5 rounded-sm bg-brand-600 transition-[width] duration-300"
                        style={{ width: `${(obat.count / statistik.obatTeratas[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-[13px] text-subtle tabular-nums">
                      {obat.count}x
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Belum ada resep terekam"
                description="Grafik akan muncul setelah dokter mencatat resep pada rekam medis final."
              />
            )}
          </section>

          <section className="panel" aria-label="Kunjungan terbaru">
            <div className="panel-header">
              <h2 className="text-sm font-semibold text-ink">Kunjungan terbaru</h2>
              <Link to="/rekam-medis" className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                Lihat semua <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            {statistik.rekamTerbaru.length ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Pasien</th>
                      <th scope="col">Dokter</th>
                      <th scope="col">Waktu</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistik.rekamTerbaru.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <p className="font-medium">{record.patient?.full_name ?? '-'}</p>
                          <p className="mt-0.5 text-xs text-faint">{record.patient?.no_rm}</p>
                        </td>
                        <td className="text-subtle">{record.doctor?.full_name ?? '-'}</td>
                        <td className="whitespace-nowrap text-subtle">{formatTanggalWaktu(record.visit_date)}</td>
                        <td><StatusBadge status={record.status} /></td>
                        <td className="text-right">
                          <Link to={`/rekam-medis/${record.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                            Buka rekam
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Belum ada kunjungan" description="Kunjungan akan muncul setelah dicatat." />
            )}
          </section>

          <p className="text-xs text-faint">Diperbarui {formatTanggalPendek(new Date())}</p>
        </div>
      )}
    </>
  );
}
