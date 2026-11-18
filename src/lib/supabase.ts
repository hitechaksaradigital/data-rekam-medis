import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * true ketika file .env sudah diisi dengan kredensial Supabase yang valid.
 * Dipakai untuk menampilkan pesan konfigurasi ramah pengguna, bukan error teknis.
 */
export const isSupabaseConfigured = Boolean(
  url && key && !url.includes('YOUR_PROJECT_REF') && !key.includes('YOUR_PUBLISHABLE'),
);

// Nilai fallback hanya agar client bisa dibuat saat .env belum diisi.
// Semua panggilan jaringan akan gagal dengan pesan yang diterjemahkan di UI.
const resolvedUrl = isSupabaseConfigured ? url! : 'https://placeholder.supabase.co';
const resolvedKey = isSupabaseConfigured ? key! : 'placeholder-anon-key';

export const supabase = createClient<Database>(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
