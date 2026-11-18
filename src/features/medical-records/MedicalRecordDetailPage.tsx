import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Pencil, Stethoscope } from 'lucide-react';
import { AllergyBanner } from '@/components/common/AllergyBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/AuthProvider';
import { translateError } from '@/utils/translateError';
import { formatTanggalWaktu, hitungUmur } from '@/utils/format';
import { toVitalSigns } from '@/types';
import { useFinalizeRecord, useMedicalRecord } from './api';
import { VitalSignsModal } from './VitalSignsModal';

function BagianSOAP({ label, kode, isi }: { label: string; kode: string; isi: string }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{kode}</span>
        <h3 className="text-[13px] font-semibold text-ink">{label}</h3>
      </div>
      {isi ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{isi}</p>
      ) : (
        <p className="text-sm italic text-faint">Belum diisi</p>
      )}
    </div>
  );
}

function BarisVital({ label, value, satuan }: { label: string; value: string | number; satuan: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <span className="text-[13px] text-subtle">{label}</span>
      <span className="text-right text-sm font-medium text-ink">
        {value || '—'} <span className="text-xs font-normal text-faint">{value ? satuan : ''}</span>
      </span>
    </div>
  );
}

export function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const { data: record, isLoading, isError } = useMedicalRecord(id);
  const finalisasi = useFinalizeRecord();
  const [vitalOpen, setVitalOpen] = useState(false);
  const [konfirmasiFinal, setKonfirmasiFinal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-24 w-full rounded-panel" />
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-[480px] w-full rounded-panel" />
          <Skeleton className="h-[320px] w-full rounded-panel" />
        </div>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <EmptyState
        title="Rekam medis tidak ditemukan"
        description="Catatan kunjungan mungkin tidak tersedia atau tautan tidak valid."
        action={<Link to="/rekam-medis"><Button variant="secondary">Kembali ke daftar</Button></Link>}
      />
    );
  }

  const vital = toVitalSigns(record.vital_signs);
  const draft = record.status === 'draft';
  const bisaFinal = role === 'dokter' && draft;
  const bisaEdit = role === 'dokter' && draft;
  const bisaVital = role === 'perawat' && draft;
  const patient = record.patient;

  async function jalankanFinalisasi() {
    if (!record) return;
    try {
      await finalisasi.mutateAsync(record.id);
      toast.success('Rekam medis berhasil difinalisasi.');
      setKonfirmasiFinal(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  return (
    <>
      <Link to="/rekam-medis" className="mb-5 inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Kembali ke rekam medis
      </Link>

      <PageHeader
        title={patient?.full_name ?? 'Rekam medis'}
        description={
          patient
            ? `${patient.no_rm} • ${hitungUmur(patient.date_of_birth)} • ${formatTanggalWaktu(record.visit_date)}`
            : formatTanggalWaktu(record.visit_date)
        }
        actions={
          <>
            <StatusBadge status={record.status} />
            {bisaVital && (
              <Button variant="secondary" onClick={() => setVitalOpen(true)}>
                Input tanda vital
              </Button>
            )}
            {bisaEdit && (
              <Link to={`/rekam-medis/${record.id}/edit`}>
                <Button variant="secondary">
                  <Pencil className="h-4 w-4" aria-hidden />
                  Ubah SOAP
                </Button>
              </Link>
            )}
            {bisaFinal && (
              <Button onClick={() => setKonfirmasiFinal(true)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Finalisasi
              </Button>
            )}
          </>
        }
      />

      <AllergyBanner allergies={patient?.allergies ?? []} className="mb-5" />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="panel overflow-hidden" aria-label="Catatan SOAP">
          <div className="panel-header">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Stethoscope className="h-4 w-4 text-faint" aria-hidden />
              Catatan pemeriksaan (SOAP)
            </h2>
            <Badge tone={draft ? 'warning' : 'success'}>
              {draft ? 'Menunggu finalisasi dokter' : 'Sudah final'}
            </Badge>
          </div>
          <div className="divide-y divide-line">
            <BagianSOAP label="Keluhan utama & anamnesis" kode="S" isi={record.subjective} />
            <BagianSOAP label="Hasil pemeriksaan fisik" kode="O" isi={record.objective} />
            <BagianSOAP label="Diagnosa kerja & ICD-10" kode="A" isi={record.assessment} />
            <BagianSOAP label="Rencana terapi, tindakan & resep" kode="P" isi={record.plan} />
          </div>
        </section>

        <div className="space-y-5">
          <section className="panel" aria-label="Tanda vital">
            <div className="panel-header">
              <h2 className="text-sm font-semibold text-ink">Tanda vital</h2>
            </div>
            <div className="divide-y divide-line px-5 py-1">
              <BarisVital label="Tekanan darah" value={vital.blood_pressure} satuan="mmHg" />
              <BarisVital label="Nadi" value={vital.heart_rate || '—'} satuan="x/menit" />
              <BarisVital label="Suhu" value={vital.temperature || '—'} satuan="°C" />
              <BarisVital label="Berat badan" value={vital.weight || '—'} satuan="kg" />
              <BarisVital label="Tinggi badan" value={vital.height || '—'} satuan="cm" />
            </div>
          </section>

          <section className="panel" aria-label="Informasi kunjungan">
            <div className="panel-header">
              <h2 className="text-sm font-semibold text-ink">Informasi kunjungan</h2>
            </div>
            <dl className="space-y-3 p-5 text-[13px]">
              <div>
                <dt className="text-xs text-faint">Dokter pemeriksa</dt>
                <dd className="mt-0.5 font-medium text-ink">{record.doctor?.full_name ?? '-'}</dd>
                {record.doctor?.sip_number && (
                  <dd className="mt-0.5 text-xs text-faint">SIP {record.doctor.sip_number}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-faint">Waktu kunjungan</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatTanggalWaktu(record.visit_date)}</dd>
              </div>
              <div>
                <dt className="text-xs text-faint">Diperbarui</dt>
                <dd className="mt-0.5 text-subtle">{formatTanggalWaktu(record.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <VitalSignsModal record={record} open={vitalOpen} onClose={() => setVitalOpen(false)} />

      <Modal
        open={konfirmasiFinal}
        onClose={() => setKonfirmasiFinal(false)}
        title="Finalisasi rekam medis?"
        description="Setelah final, catatan tidak dapat diubah kembali."
        footer={
          <>
            <Button variant="secondary" onClick={() => setKonfirmasiFinal(false)}>Batal</Button>
            <Button isLoading={finalisasi.isPending} onClick={() => void jalankanFinalisasi()}>
              Ya, finalisasi
            </Button>
          </>
        }
      >
        <p className="text-sm text-subtle">
          Pastikan SOAP, diagnosa, dan resep untuk{' '}
          <span className="font-medium text-ink">{patient?.full_name}</span> sudah benar.
        </p>
      </Modal>
    </>
  );
}
