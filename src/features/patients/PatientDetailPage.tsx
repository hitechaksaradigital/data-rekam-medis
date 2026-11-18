import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, Plus, UserRound } from 'lucide-react';
import { AllergyBanner } from '@/components/common/AllergyBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useMedicalRecords } from '@/features/medical-records/api';
import { formatTanggal, formatTanggalWaktu, hitungUmur, maskNIK } from '@/utils/format';
import { usePatient } from './api';

function InfoBaris({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { data: patient, isLoading, isError } = usePatient(id);
  const { data: records, isLoading: loadingRecords } = useMedicalRecords({
    search: '',
    status: 'semua',
    patientId: id,
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-24 w-full rounded-panel" />
        <Skeleton className="h-64 w-full rounded-panel" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <EmptyState
        title="Pasien tidak ditemukan"
        description="Data pasien mungkin telah diarsipkan atau tautan tidak valid."
        action={<Link to="/pasien"><Button variant="secondary">Kembali ke daftar pasien</Button></Link>}
      />
    );
  }

  const bisaTambah = role === 'dokter' || role === 'perawat';

  return (
    <>
      <Link to="/pasien" className="mb-5 inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke data pasien
      </Link>

      <PageHeader
        title={patient.full_name}
        description={`${patient.no_rm} • ${hitungUmur(patient.date_of_birth)} • ${patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`}
        actions={
          <>
            {role === 'admin' && (
              <Link to={`/pasien/${patient.id}/edit`}>
                <Button variant="secondary">
                  <Pencil className="h-4 w-4" aria-hidden />
                  Ubah data
                </Button>
              </Link>
            )}
            {bisaTambah && (
              <Link to={`/rekam-medis/baru?patient=${patient.id}`}>
                <Button>
                  <Plus className="h-4 w-4" aria-hidden />
                  Tambah kunjungan
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Alergi selalu berada di bagian paling atas halaman rekam medis */}
      <AllergyBanner allergies={patient.allergies} className="mb-5" />

      <section className="panel mb-5" aria-label="Identitas pasien">
        <div className="panel-header">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <UserRound className="h-4 w-4 text-faint" aria-hidden />
            Identitas & kontak
          </h2>
          <Badge tone="brand">Pasien aktif</Badge>
        </div>
        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-3 lg:grid-cols-4">
          <InfoBaris label="Nomor rekam medis" value={patient.no_rm} />
          <InfoBaris label="NIK" value={maskNIK(patient.nik)} />
          <InfoBaris label="Tanggal lahir" value={formatTanggal(patient.date_of_birth)} />
          <InfoBaris label="Umur" value={hitungUmur(patient.date_of_birth)} />
          <InfoBaris label="Golongan darah" value={patient.blood_type ?? 'Belum diketahui'} />
          <InfoBaris label="Telepon" value={patient.phone ?? '-'} />
          <InfoBaris label="Terdaftar" value={formatTanggal(patient.created_at)} />
          <InfoBaris label="Alamat" value={patient.address ?? '-'} />
        </dl>
      </section>

      <section className="panel" aria-label="Riwayat kunjungan">
        <div className="panel-header">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarDays className="h-4 w-4 text-faint" aria-hidden />
            Riwayat kunjungan
          </h2>
          <span className="text-xs text-faint">{records?.length ?? 0} kunjungan</span>
        </div>

        {loadingRecords ? (
          <TableSkeleton columns={4} rows={4} />
        ) : !records?.length ? (
          <EmptyState
            title="Belum ada kunjungan"
            description={
              bisaTambah
                ? 'Buat kunjungan pertama untuk mencatat tanda vital dan pemeriksaan.'
                : 'Kunjungan akan muncul setelah dicatat oleh dokter atau perawat.'
            }
            action={
              bisaTambah && (
                <Link to={`/rekam-medis/baru?patient=${patient.id}`}>
                  <Button>Tambah kunjungan</Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Tanggal kunjungan</th>
                  <th scope="col">Dokter pemeriksa</th>
                  <th scope="col">Diagnosa kerja</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="whitespace-nowrap">{formatTanggalWaktu(record.visit_date)}</td>
                    <td>{record.doctor?.full_name ?? '-'}</td>
                    <td className="max-w-[320px] truncate text-subtle" title={record.assessment}>
                      {record.assessment || 'Belum diisi'}
                    </td>
                    <td><StatusBadge status={record.status} /></td>
                    <td className="text-right">
                      <Link
                        to={`/rekam-medis/${record.id}`}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        Lihat rekam
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
