import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/types';
import type { PatientFormValues } from './schema';
import { parseAllergies } from './schema';

export const patientKeys = {
  all: ['patients'] as const,
  list: (search: string) => ['patients', 'list', search] as const,
  detail: (id: string) => ['patients', 'detail', id] as const,
};

export function usePatients(search: string) {
  return useQuery<Patient[]>({
    queryKey: patientKeys.list(search),
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      const kata = search.trim();
      if (kata) {
        query = query.or(`full_name.ilike.%${kata}%,nik.ilike.%${kata}%,no_rm.ilike.%${kata}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery<Patient | null>({
    queryKey: patientKeys.detail(id ?? 'none'),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

interface PatientMutationInput {
  values: PatientFormValues;
  id?: string;
}

async function generateNoRM(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_no_rm');
  if (error) throw error;
  return data;
}

async function savePatient({ values, id }: PatientMutationInput): Promise<Patient> {
  const payload = {
    full_name: values.full_name,
    nik: values.nik,
    date_of_birth: values.date_of_birth,
    gender: values.gender,
    blood_type: values.blood_type === '' ? null : values.blood_type,
    phone: values.phone || null,
    address: values.address || null,
    allergies: parseAllergies(values.allergies),
  };

  if (id) {
    const { data, error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const no_rm = await generateNoRM();
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...payload, no_rm })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function useSavePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePatient,
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patient.id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSoftDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
