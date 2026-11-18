import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MedicalRecord, MedicalRecordWithRelations, RecordStatus, VitalSigns } from '@/types';
import type { RecordFormValues } from './schema';

export const recordKeys = {
  all: ['medical-records'] as const,
  list: (filter: RecordFilter) => ['medical-records', 'list', filter] as const,
  detail: (id: string) => ['medical-records', 'detail', id] as const,
  byPatient: (patientId: string) => ['medical-records', 'patient', patientId] as const,
};

export interface RecordFilter {
  search: string;
  status: RecordStatus | 'semua';
  patientId?: string;
}

const WITH_RELATIONS = `
  *,
  patient:patients(id, no_rm, full_name, nik, date_of_birth, allergies),
  doctor:profiles(id, full_name, sip_number)
`;

export function useMedicalRecords(filter: RecordFilter) {
  return useQuery<MedicalRecordWithRelations[]>({
    queryKey: recordKeys.list(filter),
    queryFn: async () => {
      let query = supabase
        .from('medical_records')
        .select(WITH_RELATIONS)
        .order('visit_date', { ascending: false });

      if (filter.status !== 'semua') query = query.eq('status', filter.status);
      if (filter.patientId) query = query.eq('patient_id', filter.patientId);

      const kata = filter.search.trim();
      if (kata) {
        query = query.or(
          `patient.full_name.ilike.%${kata}%,patient.no_rm.ilike.%${kata}%,assessment.ilike.%${kata}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MedicalRecordWithRelations[];
    },
  });
}

export function useMedicalRecord(id: string | undefined) {
  return useQuery<MedicalRecordWithRelations | null>({
    queryKey: recordKeys.detail(id ?? 'none'),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select(WITH_RELATIONS)
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as MedicalRecordWithRelations | null;
    },
  });
}

interface SaveRecordInput {
  values: RecordFormValues;
  id?: string;
}

async function saveRecord({ values, id }: SaveRecordInput): Promise<MedicalRecord> {
  const vital_signs: VitalSigns = {
    blood_pressure: values.blood_pressure,
    heart_rate: Number(values.heart_rate),
    temperature: Number(values.temperature),
    weight: Number(values.weight),
    height: Number(values.height),
  };

  const payload = {
    patient_id: values.patient_id,
    doctor_id: values.doctor_id,
    vital_signs: vital_signs as unknown as MedicalRecord['vital_signs'],
    subjective: values.subjective,
    objective: values.objective,
    assessment: values.assessment,
    plan: values.plan,
  };

  if (id) {
    const { data, error } = await supabase
      .from('medical_records')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('medical_records')
    .insert({ ...payload, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function useSaveRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRecord,
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: recordKeys.all });
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(record.id) });
      queryClient.invalidateQueries({ queryKey: recordKeys.byPatient(record.patient_id) });
      queryClient.invalidateQueries({ queryKey: patientKeysAll });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

const patientKeysAll = ['patients'] as const;

export function useUpdateVitalSigns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, vitalSigns }: { id: string; vitalSigns: VitalSigns }) => {
      const { error } = await supabase.rpc('update_vital_signs', {
        p_record_id: id,
        p_vital_signs: { ...vitalSigns } as unknown as MedicalRecord['vital_signs'],
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: recordKeys.all });
    },
  });
}

export function useFinalizeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('medical_records')
        .update({ status: 'final' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(record.id) });
      queryClient.invalidateQueries({ queryKey: recordKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
