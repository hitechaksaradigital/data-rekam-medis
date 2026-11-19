import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Download, Plus, Search } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { formatTanggal, formatTanggalWaktu } from '@/utils/format';
import { downloadCsv } from '@/utils/exportCsv';
import { toVitalSigns, type MedicalRecordWithRelations, type RecordStatus } from '@/types';
import { useMedicalRecords } from './api';

export function MedicalRecordsPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RecordStatus | 'semua'>('semua');
  const debouncedSearch = useDebounce(search);

  const { data: records, isLoading, isError, refetch } = useMedicalRecords({
    search: debouncedSearch,
    status,
  });
  const bisaTambah = role === 'dokter' || role === 'perawat';

  function unduhCsv() {
    if (!records?.length) return;

    downloadCsv<MedicalRecordWithRelations>(
      `rekam-medis-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      records,
      [
        { header: 'No. RM', value: (row) => row.patient?.no_rm ?? '' },
        { header: 'Nama Pasien', value: (row) => row.patient?.full_name ?? '' },
        { header: 'NIK', value: (row) => row.patient?.nik ?? '' },
        {
          header: 'Tanggal Lahir',
          value: (row) => (row.patient?.date_of_birth ? formatTanggal(row.patient.date_of_birth) : ''),
        },
        { header: 'Waktu Kunjungan', value: (row) => formatTanggalWaktu(row.visit_date) },
        { header: 'Dokter Pemeriksa', value: (row) => row.doctor?.full_name ?? '' },
        { header: 'Tekanan Darah (mmHg)', value: (row) => toVitalSigns(row.vital_signs).blood_pressure },
        { header: 'Nadi (x/menit)', value: (row) => toVitalSigns(row.vital_signs).heart_rate || '' },
        { header: 'Suhu (°C)', value: (row) => toVitalSigns(row.vital_signs).temperature || '' },
        { header: 'Berat Badan (kg)', value: (row) => toVitalSigns(row.vital_signs).weight || '' },
        { header: 'Tinggi Badan (cm)', value: (row) => toVitalSigns(row.vital_signs).height || '' },
        { header: 'Subjektif', value: (row) => row.subjective },
        { header: 'Objektif', value: (row) => row.objective },
        { header: 'Assesmen', value: (row) => row.assessment },
        { header: 'Plan', value: (row) => row.plan },
        { header: 'Status', value: (row) => (row.status === 'final' ? 'Final' : 'Draft') },
        { header: 'Dibuat', value: (row) => formatTanggalWaktu(row.created_at) },
      ],
    );

    toast.success(`${records.length} rekam medis berhasil diunduh.`);
  }

  return (
    <>
      <PageHeader
        title="Rekam Medis"
        description="Catatan kunjungan dan pemeriksaan pasien."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={unduhCsv}
              disabled={!records?.length}
              title="Unduh data sesuai filter saat ini"
            >
              <Download className="h-4 w-4" aria-hidden />
              Unduh CSV
            </Button>
            {bisaTambah && (
              <Link to="/rekam-medis/baru">
                <Button>
                  <Plus className="h-4 w-4" aria-hidden />
                  Tambah kunjungan
                </Button>
              </Link>
            )}
          </>
        }
      />

      <section className="panel" aria-label="Daftar rekam medis">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5">
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari pasien, No. RM, atau diagnosa"
              className="pl-9"
              aria-label="Cari rekam medis"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as RecordStatus | 'semua')}
            className="w-full sm:w-[160px]"
            aria-label="Filter status"
          >
            <option value="semua">Semua status</option>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
          </Select>
          <span className="ml-auto text-xs text-faint">{records?.length ?? 0} kunjungan</span>
        </div>

        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : isError ? (
          <EmptyState
            title="Data gagal dimuat"
            description="Periksa koneksi Anda lalu coba muat ulang daftar rekam medis."
            action={<Button variant="secondary" onClick={() => void refetch()}>Coba lagi</Button>}
          />
        ) : !records?.length ? (
          <EmptyState
            title="Tidak ada kunjungan"
            description={debouncedSearch || status !== 'semua'
              ? 'Ubah kata kunci atau filter status untuk melihat data lain.'
              : 'Kunjungan baru akan muncul di sini setelah dicatat.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Waktu kunjungan</th>
                  <th scope="col">Pasien</th>
                  <th scope="col">Dokter</th>
                  <th scope="col">Diagnosa kerja</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="whitespace-nowrap">{formatTanggalWaktu(record.visit_date)}</td>
                    <td>
                      <p className="font-medium">{record.patient?.full_name ?? '-'}</p>
                      <p className="mt-0.5 text-xs text-faint">{record.patient?.no_rm ?? ''}</p>
                    </td>
                    <td className="text-subtle">{record.doctor?.full_name ?? '-'}</td>
                    <td className="max-w-[280px] truncate text-subtle" title={record.assessment}>
                      {record.assessment || 'Belum diisi'}
                    </td>
                    <td><StatusBadge status={record.status} /></td>
                    <td className="text-right">
                      <Link
                        to={`/rekam-medis/${record.id}`}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        Buka rekam
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
