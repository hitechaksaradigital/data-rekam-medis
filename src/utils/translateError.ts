/**
 * Menerjemahkan pesan error teknis Supabase/Postgres ke Bahasa Indonesia.
 * Kode tetap menggunakan Bahasa Inggris, pesan UI menggunakan Bahasa Indonesia.
 */
export function translateError(error: unknown): string {
  const mentah = error instanceof Error ? error.message : String(error ?? '');
  const pesan = mentah.trim();

  const aturan: Array<[RegExp, string]> = [
    [/Invalid login credentials/i, 'Email atau kata sandi salah.'],
    [/Email not confirmed/i, 'Email belum dikonfirmasi. Silakan cek kotak masuk Anda.'],
    [/User already registered/i, 'Email ini sudah terdaftar.'],
    [/Password should be at least/i, 'Kata sandi minimal 6 karakter.'],
    [/Unable to validate email address/i, 'Format email tidak valid.'],
    [/duplicate key value violates unique constraint[^\n]*patients_nik/i, 'NIK sudah terdaftar pada pasien lain.'],
    [/duplicate key value violates unique constraint[^\n]*patients_no_rm/i, 'Nomor rekam medis sudah digunakan.'],
    [/duplicate key value violates unique constraint/i, 'Data dengan nilai tersebut sudah ada.'],
    [/row-level security/i, 'Anda tidak memiliki izin untuk melakukan aksi ini.'],
    [/permission denied/i, 'Anda tidak memiliki izin untuk melakukan aksi ini.'],
    [/Hanya admin/i, 'Anda tidak memiliki izin untuk melakukan aksi ini.'],
    [/Hanya perawat/i, 'Hanya perawat yang dapat menginput tanda vital.'],
    [/Kunjungan tidak ditemukan/i, 'Kunjungan tidak ditemukan atau sudah difinalisasi.'],
    [/Failed to fetch|NetworkError|network request failed/i, 'Koneksi bermasalah. Periksa jaringan Anda.'],
    [/JWT/i, 'Sesi Anda telah berakhir. Silakan masuk kembali.'],
  ];

  for (const [pola, terjemahan] of aturan) {
    if (pola.test(pesan)) return terjemahan;
  }

  return pesan || 'Terjadi kesalahan. Silakan coba lagi.';
}
