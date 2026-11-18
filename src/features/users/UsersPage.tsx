import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, UsersRound } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/skeleton';
import { translateError } from '@/utils/translateError';
import { formatTanggal } from '@/utils/format';
import type { UserRole } from '@/types';
import { useProfiles, useUpdateProfile } from './api';

const peranLabel: Record<UserRole, string> = {
  admin: 'Admin',
  dokter: 'Dokter',
  perawat: 'Perawat',
};

const peranTone: Record<UserRole, BadgeTone> = {
  admin: 'brand',
  dokter: 'success',
  perawat: 'neutral',
};

interface FormEdit {
  id: string;
  full_name: string;
  role: UserRole;
  sip_number: string;
}

export function UsersPage() {
  const { data: profiles, isLoading, isError, refetch } = useProfiles();
  const update = useUpdateProfile();
  const [form, setForm] = useState<FormEdit | null>(null);

  async function simpan() {
    if (!form) return;
    try {
      await update.mutateAsync({
        id: form.id,
        full_name: form.full_name.trim(),
        role: form.role,
        sip_number: form.sip_number.trim() || null,
      });
      toast.success('Data pengguna diperbarui.');
      setForm(null);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Manajemen Pengguna"
        description="Atur peran dan akses petugas klinik. Akun baru dibuat melalui halaman masuk."
      />

      <section className="panel" aria-label="Daftar pengguna">
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <UsersRound className="h-4 w-4 text-faint" aria-hidden />
            Daftar petugas
          </h2>
          <span className="text-xs text-faint">{profiles?.length ?? 0} akun</span>
        </div>

        {isLoading ? (
          <TableSkeleton columns={5} />
        ) : isError ? (
          <EmptyState
            title="Data gagal dimuat"
            description="Periksa koneksi Anda lalu coba muat ulang."
            action={<Button variant="secondary" onClick={() => void refetch()}>Coba lagi</Button>}
          />
        ) : !profiles?.length ? (
          <EmptyState
            title="Belum ada petugas"
            description="Petugas akan muncul setelah melakukan pendaftaran akun."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Nama petugas</th>
                  <th scope="col">Peran</th>
                  <th scope="col">Nomor SIP</th>
                  <th scope="col">Bergabung</th>
                  <th scope="col" className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="font-medium">{profile.full_name}</td>
                    <td><Badge tone={peranTone[profile.role]}>{peranLabel[profile.role]}</Badge></td>
                    <td className="text-subtle">{profile.sip_number ?? '-'}</td>
                    <td className="whitespace-nowrap text-subtle">{formatTanggal(profile.created_at)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setForm({
                          id: profile.id,
                          full_name: profile.full_name,
                          role: profile.role,
                          sip_number: profile.sip_number ?? '',
                        })}
                        className="rounded p-1.5 text-faint hover:bg-ground hover:text-ink"
                        aria-label={`Ubah ${profile.full_name}`}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
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
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title="Ubah Data Petugas"
        description="Peran menentukan hak akses pada data pasien dan rekam medis."
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Batal</Button>
            <Button isLoading={update.isPending} onClick={() => void simpan()}>Simpan</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <Field label="Nama lengkap" htmlFor="edit-nama" required>
              <Input
                id="edit-nama"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>
            <Field label="Peran" htmlFor="edit-peran" required>
              <Select
                id="edit-peran"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                <option value="admin">Admin — master data & pengguna</option>
                <option value="dokter">Dokter — SOAP, diagnosa, resep</option>
                <option value="perawat">Perawat — tanda vital & data pasien</option>
              </Select>
            </Field>
            <Field label="Nomor SIP" htmlFor="edit-sip" hint="Opsional, untuk dokter/perawat">
              <Input
                id="edit-sip"
                value={form.sip_number}
                onChange={(e) => setForm({ ...form, sip_number: e.target.value })}
                placeholder="Contoh: SIP-2026-00123"
              />
            </Field>
          </div>
        )}
      </Modal>
    </>
  );
}
