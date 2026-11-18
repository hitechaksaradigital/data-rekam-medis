import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { translateError } from '@/utils/translateError';
import { toVitalSigns, type MedicalRecord, type VitalSigns } from '@/types';
import { useUpdateVitalSigns } from './api';

interface VitalSignsModalProps {
  record: MedicalRecord | null;
  open: boolean;
  onClose: () => void;
}

const kosong: VitalSigns = {
  blood_pressure: '',
  heart_rate: 0,
  temperature: 0,
  weight: 0,
  height: 0,
};

export function VitalSignsModal({ record, open, onClose }: VitalSignsModalProps) {
  const [values, setValues] = useState<VitalSigns>(kosong);
  const simpan = useUpdateVitalSigns();

  useEffect(() => {
    if (record) setValues(toVitalSigns(record.vital_signs));
  }, [record]);

  function ubah<K extends keyof VitalSigns>(key: K, value: VitalSigns[K]) {
    setValues((sebelumnya) => ({ ...sebelumnya, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!record) return;
    try {
      await simpan.mutateAsync({ id: record.id, vitalSigns: values });
      toast.success('Tanda vital berhasil disimpan.');
      onClose();
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Input Tanda Vital"
      description="Hanya dapat diisi pada kunjungan berstatus draft."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" form="form-tanda-vital" isLoading={simpan.isPending}>Simpan</Button>
        </>
      }
    >
      <form id="form-tanda-vital" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Tekanan darah" htmlFor="vs-bp" required>
          <Input id="vs-bp" value={values.blood_pressure} onChange={(e) => ubah('blood_pressure', e.target.value)} placeholder="120/80" required pattern="\d{2,3}/\d{2,3}" title="Format: 120/80" />
        </Field>
        <Field label="Nadi (x/menit)" htmlFor="vs-hr" required>
          <Input id="vs-hr" type="number" min={30} max={250} value={values.heart_rate || ''} onChange={(e) => ubah('heart_rate', Number(e.target.value))} required />
        </Field>
        <Field label="Suhu (°C)" htmlFor="vs-temp" required>
          <Input id="vs-temp" type="number" step="0.1" min={30} max={45} value={values.temperature || ''} onChange={(e) => ubah('temperature', Number(e.target.value))} required />
        </Field>
        <Field label="Berat badan (kg)" htmlFor="vs-weight" required>
          <Input id="vs-weight" type="number" step="0.1" min={1} max={300} value={values.weight || ''} onChange={(e) => ubah('weight', Number(e.target.value))} required />
        </Field>
        <Field label="Tinggi badan (cm)" htmlFor="vs-height" required>
          <Input id="vs-height" type="number" step="0.1" min={30} max={250} value={values.height || ''} onChange={(e) => ubah('height', Number(e.target.value))} required />
        </Field>
      </form>
    </Modal>
  );
}
