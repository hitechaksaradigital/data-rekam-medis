/**
 * Tipe database yang mengikuti skema pada standarisasi_proyek_rekam_medis.md
 * Bagian 4. Bila Supabase CLI tersedia, file ini bisa diganti dengan
 * `supabase gen types typescript` agar selalu sinkron.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'dokter' | 'perawat';
          sip_number: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: 'admin' | 'dokter' | 'perawat';
          sip_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'admin' | 'dokter' | 'perawat';
          sip_number?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          no_rm: string;
          nik: string;
          full_name: string;
          date_of_birth: string;
          gender: 'L' | 'P';
          blood_type: 'A' | 'B' | 'AB' | 'O' | '-' | null;
          phone: string | null;
          address: string | null;
          allergies: string[];
          created_at: string;
          deleted_at: string | null;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          no_rm: string;
          nik: string;
          full_name: string;
          date_of_birth: string;
          gender: 'L' | 'P';
          blood_type?: 'A' | 'B' | 'AB' | 'O' | '-' | null;
          phone?: string | null;
          address?: string | null;
          allergies?: string[];
          created_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          no_rm?: string;
          nik?: string;
          full_name?: string;
          date_of_birth?: string;
          gender?: 'L' | 'P';
          blood_type?: 'A' | 'B' | 'AB' | 'O' | '-' | null;
          phone?: string | null;
          address?: string | null;
          allergies?: string[];
          created_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      medical_records: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          visit_date: string;
          vital_signs: Json;
          subjective: string;
          objective: string;
          assessment: string;
          plan: string;
          status: 'draft' | 'final';
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          visit_date?: string;
          vital_signs?: Json;
          subjective: string;
          objective: string;
          assessment: string;
          plan: string;
          status?: 'draft' | 'final';
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          visit_date?: string;
          vital_signs?: Json;
          subjective?: string;
          objective?: string;
          assessment?: string;
          plan?: string;
          status?: 'draft' | 'final';
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      generate_no_rm: {
        Args: Record<string, never>;
        Returns: string;
      };
      update_vital_signs: {
        Args: { p_record_id: string; p_vital_signs: Json };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
