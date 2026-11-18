import { z } from 'zod';

export const patientFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Nama pasien minimal 2 karakter.')
    .max(120, 'Nama pasien terlalu panjang.'),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'NIK wajib terdiri dari 16 digit angka.'),
  date_of_birth: z
    .string()
    .min(1, 'Tanggal lahir wajib diisi.')
    .refine((value) => !Number.isNaN(Date.parse(value)) && new Date(value) <= new Date(), {
      message: 'Tanggal lahir tidak valid.',
    }),
  gender: z.enum(['L', 'P'], { error: 'Pilih jenis kelamin.' }),
  blood_type: z.enum(['A', 'B', 'AB', 'O', '-', ''], {
    error: 'Pilih golongan darah.',
  }),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9+\-\s]{8,20}$/.test(value), {
      message: 'Nomor telepon tidak valid.',
    }),
  address: z.string().trim().max(300, 'Alamat terlalu panjang.'),
  allergies: z.string().trim().max(300, 'Daftar alergi terlalu panjang.'),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

/** "Paracetamol, Penisilin" -> ["Paracetamol", "Penisilin"] */
export function parseAllergies(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinAllergies(values: string[]): string {
  return values.join(', ');
}
