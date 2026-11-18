import { z } from 'zod';
import type { UserRole } from '@/types';

export interface RecordFormValues {
  patient_id: string;
  doctor_id: string;
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  weight: number;
  height: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

/**
 * Dokter wajib mengisi SOAP. Perawat hanya menginput tanda vital pada
 * kunjungan draft, sehingga field SOAP boleh kosong sesuai pembagian peran
 * (Bagian 3.2 standarisasi).
 */
export function createRecordSchema(role: UserRole) {
  const wajibSOAP = role === 'dokter';
  const teks = (label: string) =>
    wajibSOAP
      ? z.string().trim().min(3, `${label} wajib diisi (minimal 3 karakter).`)
      : z.string().trim();

  return z.object({
    patient_id: z.string().uuid('Pilih pasien terlebih dahulu.'),
    doctor_id: z.string().uuid('Pilih dokter pemeriksa.'),
    blood_pressure: z
      .string()
      .trim()
      .regex(/^\d{2,3}\/\d{2,3}$/, 'Gunakan format sistolik/diastolik, misalnya 120/80.'),
    heart_rate: z.number({ error: 'Nadi wajib diisi dengan angka.' }).int('Nilai harus bilangan bulat.').min(30, 'Minimal 30x/menit.').max(250, 'Maksimal 250x/menit.'),
    temperature: z.number({ error: 'Suhu wajib diisi dengan angka.' }).min(30, 'Minimal 30°C.').max(45, 'Maksimal 45°C.'),
    weight: z.number({ error: 'Berat badan wajib diisi dengan angka.' }).min(1, 'Minimal 1 kg.').max(300, 'Maksimal 300 kg.'),
    height: z.number({ error: 'Tinggi badan wajib diisi dengan angka.' }).min(30, 'Minimal 30 cm.').max(250, 'Maksimal 250 cm.'),
    subjective: teks('Keluhan utama (Subjektif)'),
    objective: teks('Pemeriksaan fisik (Objektif)'),
    assessment: teks('Diagnosa kerja (Assesmen)'),
    plan: teks('Rencana terapi (Plan)'),
  });
}
