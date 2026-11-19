import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AllergyBanner } from '@/components/common/AllergyBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useMedicalRecords } from '@/features/medical-records/api';
import { formatSIP, formatTanggalWaktu, hitungUmur } from '@/utils/format';
import type { MedicalRecordWithRelations } from '@/types';

export function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [detail, setDetail] = useState<MedicalRecordWithRelations | null>(null);

  const { data: resep, isLoading, isError, refetch } = useMedicalRecords({
    search: debouncedSearch,
    status: 'final',
  });

  return (
    <>
      <PageHeader
        title="Resep Obat"
        description="Rangkuman terapi dan resep dari rekam medis yang telah difinalisasi."
      />

      <section className="panel" aria-label="Daftar resep">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5">
          <div className="relative w-full sm:w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari pasien, No. RM, atau nama obat"
              className="pl-9"
              aria-label="Cari resep"
            />
          </div>
          <span className="ml-auto text-xs text-faint">{resep?.length ?? 0} resep</span>
        </div>

        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : isError ? (
          <EmptyState
            title="Data gagal dimuat"
            description="Periksa koneksi Anda lalu coba muat ulang daftar resep."
            action={<Button variant="secondary" onClick={() => void refetch()}>Coba lagi</Button>}
          />
        ) : !resep?.length ? (
          <EmptyState
            title="Belum ada resep"
            description={debouncedSearch
              ? 'Ubah kata kunci pencarian untuk melihat resep lain.'
              : 'Resep akan muncul setelah rekam medis difinalisasi oleh dokter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Pasien</th>
                  <th scope="col">Dokter</th>
                  <th scope="col">Diagnosa</th>
                  <th scope="col">Terapi & resep</th>
                  <th scope="col" className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {resep.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap">{formatTanggalWaktu(item.visit_date)}</td>
                    <td>
                      <p className="font-medium">{item.patient?.full_name ?? '-'}</p>
                      <p className="mt-0.5 text-xs text-faint">
                        {item.patient?.no_rm}
                        {item.patient?.date_of_birth
                          ? ` • ${hitungUmur(item.patient.date_of_birth)}`
                          : ''}
                      </p>
                      {Boolean(item.patient?.allergies.length) && (
                        <span className="mt-1 inline-block text-[11px] font-medium text-danger-600">
                          ⚠ Alergi
                        </span>
                      )}
                    </td>
                    <td className="text-subtle">{item.doctor?.full_name ?? '-'}</td>
                    <td className="max-w-[240px] truncate text-subtle" title={item.assessment}>
                      {item.assessment || '-'}
                    </td>
                    <td className="max-w-[320px]">
                      <p className="line-clamp-2 whitespace-pre-line text-subtle" title={item.plan}>
                        {item.plan || 'Belum diisi'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(item)}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        Detail resep
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detail Resep & Terapi"
        description={detail ? `${detail.patient?.no_rm ?? ''} • ${formatTanggalWaktu(detail.visit_date)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>Tutup</Button>
            {detail && (
              <Link to={`/rekam-medis/${detail.id}`}>
                <Button>Buka rekam medis</Button>
              </Link>
            )}
          </>
        }
      >
        {detail && (
          <div className="space-y-5">
            <AllergyBanner allergies={detail.patient?.allergies ?? []} />
            <div>
              <p className="text-xs text-faint">Pasien</p>
              <p className="mt-0.5 text-sm font-medium text-ink">{detail.patient?.full_name ?? '-'}</p>
              {detail.patient?.date_of_birth && (
                <p className="mt-0.5 text-xs text-subtle">
                  {hitungUmur(detail.patient.date_of_birth)}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-faint">Diagnosa kerja</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{detail.assessment || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-faint">Dokter pemeriksa</p>
              <p className="mt-0.5 text-sm text-ink">
                {detail.doctor?.full_name ?? '-'}
                {detail.doctor?.sip_number ? ` (${formatSIP(detail.doctor.sip_number)})` : ''}
              </p>
            </div>
            <div className="rounded-md border border-line bg-ground px-4 py-3">
              <p className="text-[13px] font-semibold text-ink">Rencana terapi & resep obat</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {detail.plan || 'Belum diisi'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
