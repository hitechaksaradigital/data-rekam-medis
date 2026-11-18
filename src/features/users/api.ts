import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

export const userKeys = {
  all: ['profiles'] as const,
  doctors: ['profiles', 'dokter'] as const,
};

/** Daftar dokter dipakai saat menentukan dokter pemeriksa kunjungan. */
export function useDoctors() {
  return useQuery<Profile[]>({
    queryKey: userKeys.doctors,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'dokter')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: userKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });
}

interface UpdateProfileInput {
  id: string;
  full_name: string;
  role: UserRole;
  sip_number: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateProfileInput) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.doctors });
    },
  });
}
