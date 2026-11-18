import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { translateError } from '@/utils/translateError';
import { formatNIK } from '@/utils/format';
import type { BloodType } from '@/types';
import { usePatient, useSavePatient } from './api';
import { joinAllergies, patientFormSchema, type PatientFormValues } from './schema';

const nilaiAwal: PatientFormValues = {
  full_name: '',
  nik: '',
  date_of_birth: '',
  gender: 'P',
  blood_type: '',
  phone: '',
  address: '',
  allergies: '',
};

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const modeEdit = Boolean(id);
  const { data: patient, isLoading } = usePatient(id);
  const simpan = useSavePatient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: nilaiAwal,
  });

  const nikValue = watch('nik');

  useEffect(() => {
    if (!patient) return;
    reset({
      full_name: patient.full_name,
      nik: patient.nik,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_type: patient.blood_type ?? '',
      phone: patient.phone ?? '',
      address: patient.address ?? '',
      allergies: joinAllergies(patient.allergies),
    });
  }, [patient, reset]);

  async function onSubmit(values: PatientFormValues) {
    try {
      const hasil = await simpan.mutateAsync({ values, id });
      toast.success(modeEdit ? 'Data pasien diperbarui.' : `Pasien didaftarkan dengan No. RM ${hasil.no_rm}.`);
      navigate(`/pasien/${hasil.id}`);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  if (modeEdit && isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[480px] w-full rounded-panel" />
      </div>
    );
  }

  return (
    <>
      <Link
        to={modeEdit ? `/pasien/${id}` : '/pasien'}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali
      </Link>

      <PageHeader
        title={modeEdit ? 'Ubah Data Pasien' : 'Daftarkan Pasien Baru'}
        description="Lengkapi data identitas dan riwayat alergi pasien dengan teliti."
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="panel max-w-3xl">
        <div className="panel-header">
          <h2 className="text-sm font-semibold text-ink">Identitas pasien</h2>
          <span className="text-xs text-faint">Field bertanda * wajib diisi</span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Nama lengkap" htmlFor="full_name" required error={errors.full_name?.message} className="sm:col-span-2">
            <Input id="full_name" placeholder="Sesuai identitas resmi" {...register('full_name')} />
          </Field>

          <Field label="NIK" htmlFor="nik" required error={errors.nik?.message} hint={nikValue.length ? formatNIK(nikValue) : '16 digit angka'}>
            <Input
              id="nik"
              inputMode="numeric"
              maxLength={16}
              placeholder="3204123456780001"
              {...register('nik')}
            />
          </Field>

          <Field label="Tanggal lahir" htmlFor="date_of_birth" required error={errors.date_of_birth?.message}>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
          </Field>

          <Field label="Jenis kelamin" htmlFor="gender" required error={errors.gender?.message}>
            <Select id="gender" {...register('gender')}>
              <option value="P">Perempuan</option>
              <option value="L">Laki-laki</option>
            </Select>
          </Field>

          <Field label="Golongan darah" htmlFor="blood_type" error={errors.blood_type?.message}>
            <Select id="blood_type" {...register('blood_type')}>
              <option value="">Belum diketahui</option>
              {(['A', 'B', 'AB', 'O', '-'] as BloodType[]).map((tipe) => (
                <option key={tipe} value={tipe}>{tipe}</option>
              ))}
            </Select>
          </Field>

          <Field label="Nomor telepon" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" type="tel" placeholder="081234567890" {...register('phone')} />
          </Field>

          <Field label="Alamat" htmlFor="address" error={errors.address?.message}>
            <Input id="address" placeholder="Alamat domisili" {...register('address')} />
          </Field>

          <Field
            label="Riwayat alergi"
            htmlFor="allergies"
            error={errors.allergies?.message}
            hint="Pisahkan dengan koma, contoh: Penisilin, Paracetamol"
            className="sm:col-span-2"
          >
            <Textarea
              id="allergies"
              rows={2}
              placeholder="Tulis 'Tidak ada' bila tidak ada riwayat alergi"
              {...register('allergies')}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
          <Link to={modeEdit ? `/pasien/${id}` : '/pasien'}>
            <Button type="button" variant="secondary">Batal</Button>
          </Link>
          <Button type="submit" isLoading={simpan.isPending}>
            {modeEdit ? 'Simpan perubahan' : 'Daftarkan pasien'}
          </Button>
        </div>
      </form>
    </>
  );
}

