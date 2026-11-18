import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { translateError } from '@/utils/translateError';
import { formatTanggalPendek, hitungUmur, maskNIK } from '@/utils/format';
import type { Patient } from '@/types';
import { usePatients, useSoftDeletePatient } from './api';

export function PatientsPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [targetHapus, setTargetHapus] = useState<Patient | null>(null);

  const { data: patients, isLoading, isError, refetch } = usePatients(debouncedSearch);
  const hapus = useSoftDeletePatient();
  const bisaKelola = role === 'admin';

  async function konfirmasiHapus() {
    if (!targetHapus) return;
    try {
      await hapus.mutateAsync(targetHapus.id);
      toast.success('Data pasien diarsipkan.');
      setTargetHapus(null);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Data Pasien"
        description={
          isLoading
            ? 'Memuat data pasien…'
            : `${patients?.length ?? 0} pasien aktif tercatat dalam sistem.`
        }
        actions={
          bisaKelola && (
            <Link to="/pasien/baru">
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                Tambah pasien
              </Button>
            </Link>
          )
        }
      />

      <section className="panel" aria-label="Daftar pasien">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, NIK, atau No. RM"
              className="pl-9"
              aria-label="Cari pasien"
            />
          </div>
          {isLoading && <Skeleton className="h-4 w-24" />}
        </div>

        {isLoading ? (
          <TableSkeleton columns={7} />
        ) : isError ? (
          <EmptyState
            title="Data gagal dimuat"
            description="Periksa koneksi Anda lalu coba muat ulang daftar pasien."
            action={<Button variant="secondary" onClick={() => void refetch()}>Coba lagi</Button>}
          />
        ) : !patients?.length ? (
          <EmptyState
            title={debouncedSearch ? 'Pasien tidak ditemukan' : 'Belum ada pasien'}
            description={
              debouncedSearch
                ? 'Ubah kata kunci pencarian atau kosongkan kolom cari.'
                : 'Tambahkan pasien pertama untuk mulai mencatat kunjungan.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">No. RM</th>
                  <th scope="col">Nama pasien</th>
                  <th scope="col">NIK</th>
                  <th scope="col">Umur</th>
                  <th scope="col">L/P</th>
                  <th scope="col">Goldar</th>
                  <th scope="col" className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="whitespace-nowrap font-medium text-brand-700">
                      <Link to={`/pasien/${patient.id}`} className="hover:underline">
                        {patient.no_rm}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/pasien/${patient.id}`} className="font-medium hover:underline">
                        {patient.full_name}
                      </Link>
                      {patient.allergies.length > 0 && (
                        <Badge tone="danger" className="ml-2">Alergi</Badge>
                      )}
                      <p className="mt-0.5 text-xs text-faint">
                        {formatTanggalPendek(patient.date_of_birth)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap text-subtle">{maskNIK(patient.nik)}</td>
                    <td className="whitespace-nowrap text-subtle">{hitungUmur(patient.date_of_birth)}</td>
                    <td className="text-subtle">{patient.gender}</td>
                    <td className="text-subtle">{patient.blood_type ?? '-'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/pasien/${patient.id}`}
                          className="rounded px-2 py-1 text-xs font-medium text-subtle hover:bg-ground hover:text-ink"
                        >
                          Detail
                        </Link>
                        {bisaKelola && (
                          <>
                            <Link
                              to={`/pasien/${patient.id}/edit`}
                              className="rounded p-1.5 text-faint hover:bg-ground hover:text-ink"
                              aria-label={`Ubah ${patient.full_name}`}
                              title="Ubah"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setTargetHapus(patient)}
                              className="rounded p-1.5 text-faint hover:bg-danger-50 hover:text-danger-600"
                              aria-label={`Arsipkan ${patient.full_name}`}
                              title="Arsipkan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(targetHapus)}
        onClose={() => setTargetHapus(null)}
        title="Arsipkan pasien?"
        description="Data tidak akan dihapus permanen, hanya disembunyikan dari daftar aktif."
        footer={
          <>
            <Button variant="secondary" onClick={() => setTargetHapus(null)}>Batal</Button>
            <Button variant="danger" isLoading={hapus.isPending} onClick={() => void konfirmasiHapus()}>
              Arsipkan
            </Button>
          </>
        }
      >
        <p className="text-sm text-subtle">
          Pasien <span className="font-medium text-ink">{targetHapus?.full_name}</span> dengan No. RM{' '}
          <span className="font-medium text-ink">{targetHapus?.no_rm}</span> akan diarsipkan.
        </p>
      </Modal>
    </>
  );
}
