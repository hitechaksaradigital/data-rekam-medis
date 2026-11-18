import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Patient = Database['public']['Tables']['patients']['Row'];
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row'];

export type UserRole = Profile['role'];
export type Gender = Patient['gender'];
export type BloodType = NonNullable<Patient['blood_type']>;
export type RecordStatus = MedicalRecord['status'];

export interface VitalSigns {
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  weight: number;
  height: number;
}

export const EMPTY_VITAL_SIGNS: VitalSigns = {
  blood_pressure: '',
  heart_rate: 0,
  temperature: 0,
  weight: 0,
  height: 0,
};

/** Vital_signs disimpan sebagai jsonb, jadi perlu dinormalisasi saat dibaca. */
export function toVitalSigns(value: MedicalRecord['vital_signs']): VitalSigns {
  const raw = (value ?? {}) as Partial<VitalSigns>;
  return {
    blood_pressure: String(raw.blood_pressure ?? ''),
    heart_rate: Number(raw.heart_rate ?? 0),
    temperature: Number(raw.temperature ?? 0),
    weight: Number(raw.weight ?? 0),
    height: Number(raw.height ?? 0),
  };
}

export interface MedicalRecordWithRelations extends MedicalRecord {
  patient: Pick<Patient, 'id' | 'no_rm' | 'full_name' | 'nik' | 'date_of_birth' | 'allergies'> | null;
  doctor: Pick<Profile, 'id' | 'full_name' | 'sip_number'> | null;
}

export interface DashboardStats {
  totalPatients: number;
  visitsToday: number;
  drafts: number;
  newPatientsThisMonth: number;
  visitsLast7Days: { date: string; label: string; count: number }[];
}
