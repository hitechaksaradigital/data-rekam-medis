import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Info } from 'lucide-react';
import { AllergyBanner } from '@/components/common/AllergyBanner';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePatients } from '@/features/patients/api';
import { useDoctors } from '@/features/users/api';
import { translateError } from '@/utils/translateError';
import { useMedicalRecord, useSaveRecord } from './api';
import { createRecordSchema, type RecordFormValues } from './schema';

const nilaiAwal: RecordFormValues = {
  patient_id: '',
  doctor_id: '',
  blood_pressure: '',
  heart_rate: 0,
  temperature: 0,
  weight: 0,
  height: 0,
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

export function MedicalRecordFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const modeEdit = Boolean(id);
  const patientAwal = searchParams.get('patient') ?? '';
  const { role, profile } = useAuth();
  const { data: patients, isLoading: loadingPatients } = usePatients('');
  const { data: doctors, isLoading: loadingDoctors } = useDoctors();
  const simpan = useSaveRecord();
  const { data: record, isLoading: loadingRecord } = useMedicalRecord(id);
  const skema = useMemo(() => createRecordSchema(role ?? 'perawat'), [role]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(skema),
    defaultValues: { ...nilaiAwal, patient_id: patientAwal, doctor_id: role === 'dokter' ? (profile?.id ?? '') : '' },
  });

  useEffect(() => {
    if (role === 'dokter' && profile?.id && !modeEdit) setValue('doctor_id', profile.id);
  }, [role, profile?.id, setValue, modeEdit]);

  useEffect(() => {
    if (!record) return;
    const vital = record.vital_signs as {
      blood_pressure?: string;
      heart_rate?: number;
      temperature?: number;
      weight?: number;
      height?: number;
    };
    reset({
      patient_id: record.patient_id,
      doctor_id: record.doctor_id,
      blood_pressure: String(vital.blood_pressure ?? ''),
      heart_rate: Number(vital.heart_rate ?? 0),
      temperature: Number(vital.temperature ?? 0),
      weight: Number(vital.weight ?? 0),
      height: Number(vital.height ?? 0),
      subjective: record.subjective,
      objective: record.objective,
      assessment: record.assessment,
      plan: record.plan,
    });
  }, [record, reset]);

  const patientTerpilih = patients?.find((item) => item.id === watch('patient_id'));
  const bisaIsiSOAP = role === 'dokter';

  async function onSubmit(values: RecordFormValues) {
    try {
      const hasil = await simpan.mutateAsync({ values, id });
      toast.success(modeEdit ? 'Rekam medis diperbarui.' : 'Kunjungan berhasil dicatat.');
      navigate(`/rekam-medis/${hasil.id}`);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  if (loadingPatients || loadingDoctors || (modeEdit && loadingRecord)) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-[560px] w-full rounded-panel" />
      </div>
    );
  }

  return (
    <>
      <Link to={modeEdit ? `/rekam-medis/${id}` : '/rekam-medis'} className="mb-5 inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali
      </Link>

      <PageHeader
        title={modeEdit ? 'Ubah Rekam Medis' : 'Catat Kunjungan Baru'}
        description={
          bisaIsiSOAP
            ? 'Lengkapi tanda vital dan pemeriksaan SOAP pasien.'
            : 'Input tanda vital awal. Diagnosa dan resep akan diisi oleh dokter.'
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-ink">Pasien & dokter pemeriksa</h2>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Pasien" htmlFor="patient_id" required error={errors.patient_id?.message}>
              <Select id="patient_id" {...register('patient_id')}>
                <option value="">Pilih pasien</option>
                {patients?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.no_rm} — {item.full_name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Dokter pemeriksa" htmlFor="doctor_id" required error={errors.doctor_id?.message}>
              {bisaIsiSOAP ? (
                <>
                  <input type="hidden" {...register('doctor_id')} />
                  <Input value={profile?.full_name ?? ''} readOnly className="bg-ground" />
                </>
              ) : (
                <Select id="doctor_id" {...register('doctor_id')}>
                  <option value="">Pilih dokter</option>
                  {doctors?.map((dokter) => (
                    <option key={dokter.id} value={dokter.id}>{dokter.full_name}</option>
                  ))}
                </Select>
              )}
              {!bisaIsiSOAP && !doctors?.length && (
                <p className="mt-1 text-xs text-warning-600">Belum ada akun dokter. Hubungkan administrator.</p>
              )}
            </Field>
          </div>
        </section>

        {/* Alergi pasien muncul di area atas sebelum pengisian data klinis */}
        {patientTerpilih && (
          <AllergyBanner allergies={patientTerpilih.allergies} />
        )}

        <section className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-ink">Tanda vital</h2>
            <span className="text-xs text-faint">Diisi oleh perawat sebelum pemeriksaan</span>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Tekanan darah" htmlFor="blood_pressure" required error={errors.blood_pressure?.message} hint="Contoh: 120/80">
              <Input id="blood_pressure" placeholder="120/80" {...register('blood_pressure')} />
            </Field>
            <Field label="Nadi" htmlFor="heart_rate" required error={errors.heart_rate?.message} hint="x/menit">
              <Input id="heart_rate" type="number" {...register('heart_rate', { valueAsNumber: true })} />
            </Field>
            <Field label="Suhu" htmlFor="temperature" required error={errors.temperature?.message} hint="°C">
              <Input id="temperature" type="number" step="0.1" {...register('temperature', { valueAsNumber: true })} />
            </Field>
            <Field label="Berat badan" htmlFor="weight" required error={errors.weight?.message} hint="kg">
              <Input id="weight" type="number" step="0.1" {...register('weight', { valueAsNumber: true })} />
            </Field>
            <Field label="Tinggi badan" htmlFor="height" required error={errors.height?.message} hint="cm">
              <Input id="height" type="number" step="0.1" {...register('height', { valueAsNumber: true })} />
            </Field>
          </div>
        </section>

        {bisaIsiSOAP ? (
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-semibold text-ink">Pemeriksaan SOAP</h2>
              <span className="text-xs text-faint">Field bertanda * wajib diisi</span>
            </div>
            <div className="space-y-5 p-5">
              <Field label="Subjektif — keluhan utama & anamnesis" htmlFor="subjective" required error={errors.subjective?.message}>
                <Textarea id="subjective" rows={3} placeholder="Keluhan yang disampaikan pasien, lama keluhan, riwayat penyakit…" {...register('subjective')} />
              </Field>
              <Field label="Objektif — hasil pemeriksaan fisik" htmlFor="objective" required error={errors.objective?.message}>
                <Textarea id="objective" rows={3} placeholder="Hasil pemeriksaan fisik dan penunjang…" {...register('objective')} />
              </Field>
              <Field label="Assesmen — diagnosa kerja & kode ICD-10" htmlFor="assessment" required error={errors.assessment?.message}>
                <Textarea id="assessment" rows={2} placeholder="Contoh: J06.9 Infeksi saluran pernapasan atas, tidak spesifik" {...register('assessment')} />
              </Field>
              <Field label="Plan — rencana terapi, tindakan, & resep" htmlFor="plan" required error={errors.plan?.message}>
                <Textarea id="plan" rows={3} placeholder="Rencana pengobatan, tindakan, kontrol ulang…" {...register('plan')} />
              </Field>
            </div>
          </section>
        ) : (
          <div className="flex gap-3 rounded-md border border-line bg-white px-4 py-3 text-sm text-subtle">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <p>
              Kunjungan akan tersimpan sebagai <strong className="font-medium text-ink">draft</strong>. Dokter
              akan melengkapi SOAP, diagnosa, dan resep sebelum status diubah menjadi final.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-line pt-2">
          <Link to="/rekam-medis"><Button type="button" variant="secondary">Batal</Button></Link>
          <Button type="submit" isLoading={simpan.isPending}>
            {modeEdit ? 'Simpan perubahan' : 'Simpan kunjungan'}
          </Button>
        </div>
      </form>
    </>
  );
}
