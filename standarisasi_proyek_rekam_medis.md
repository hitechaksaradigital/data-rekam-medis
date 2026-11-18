# Standarisasi Proyek: Sistem Informasi Data Rekam Medis (EMR)

Dokumen ini berfungsi sebagai **Single Source of Truth (Sumber Kebenaran Utama)** bagi AI Assistant dan Developer dalam mengembangkan aplikasi manajemen data rekam medis berbasis web. Setiap kode, skema database, dan komponen UI yang dihasilkan **WAJIB** mematuhi standar di bawah ini.

---

## 1. Gambaran Umum & Tech Stack
* **Nama Proyek:** Sistem Data Rekam Medis (Electronic Medical Record / EMR)
* **Frontend:** React (v18+), Vite, TypeScript (`.tsx` / `.ts`)
* **Styling & UI:** Tailwind CSS + Lucide React (Icons) + Shadcn/UI (opsional/direkomendasikan)
* **State Management & Data Fetching:** TanStack Query (React Query) + React Hook Form + Zod (validasi form)
* **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Row Level Security / RLS)
* **Bahasa Antarmuka (UI):** Bahasa Indonesia baku dan medis yang jelas.
* **Bahasa Kode (Variabel/Fungsi/Tabel):** Bahasa Inggris (`camelCase` untuk JS/TS, `snake_case` untuk Database).

---

## 2. Arsitektur Folder Proyek
Gunakan struktur berbasis fitur (*feature-based*) untuk menjaga skalabilitas:

```text
src/
├── components/          # Komponen UI reusable (Button, Input, Modal, DataTable)
│   └── ui/              # Komponen dasar (Shadcn/Tailwind)
├── features/            # Modul spesifik domain medis
│   ├── auth/            # Login, manajemen sesi, proteksi rute
│   ├── patients/        # Manajemen data induk pasien (CRUD, pencarian)
│   ├── medical-records/ # Pencatatan SOAP, diagnosa (ICD-10), resep, vital signs
│   └── dashboard/       # Ringkasan statistik klinik/rumah sakit
├── hooks/               # Custom React hooks (useAuth, useDebounce, dll.)
├── lib/                 # Konfigurasi library pihak ketiga
│   └── supabase.ts      # Inisialisasi Supabase Client & Type definitions
├── types/               # Global TypeScript interfaces & database types
│   └── database.types.ts # Auto-generated types dari Supabase CLI
├── utils/               # Helper functions (formatTanggal, hitungUmur, formatNIK)
├── App.tsx              # Routing utama (React Router DOM)
└── main.tsx             # Entry point aplikasi
```

---

## 3. Standar Keamanan & Kepatuhan Data Medis (KRITIS)
Karena aplikasi ini menangani **Data Pribadi dan Sensitif (Rekam Medis)**:
1. **Row Level Security (RLS):** **WAJIB** diaktifkan (`ENABLE ROW LEVEL SECURITY`) pada semua tabel di Supabase. Tidak ada akses anonim (`anon`) yang diizinkan untuk membaca atau menulis data medis.
2. **Role-Based Access Control (RBAC):** Sistem membedakan hak akses berdasarkan peran (`role` pada tabel `profiles`):
   * `admin`: Manajemen user, master data, melihat log aktivitas (tidak boleh mengubah isi diagnosa dokter).
   * `dokter`: Membuat, membaca, dan memperbarui rekam medis (SOAP), diagnosa, dan resep.
   * `perawat`: Melihat data pasien, menginput tanda-tanda vital (*vital signs*) awal sebelum pemeriksaan dokter.
3. **Audit Trail:** Setiap perubahan atau penghapusan data medis tidak boleh menghapus baris secara permanen (*Hard Delete*). Gunakan kolom `deleted_at` (*Soft Delete*) dan catat `created_by` serta `updated_by` (merujuk pada `auth.uid()`).

---

## 4. Desain Skema Database (Supabase / PostgreSQL)
AI harus selalu merujuk pada struktur tabel berikut saat membuat *query* atau migrasi SQL:

### A. `profiles` (Ekstensi dari `auth.users`)
* `id` (uuid, Primary Key, references `auth.users.id`)
* `full_name` (text, not null)
* `role` (text, check: `'admin' | 'dokter' | 'perawat'`)
* `sip_number` (text, nullable - Nomor Surat Izin Praktik untuk dokter/perawat)
* `created_at` (timestamptz, default `now()`)

### B. `patients` (Data Induk Pasien)
* `id` (uuid, Primary Key, default `gen_random_uuid()`)
* `no_rm` (text, unique, not null - Nomor Rekam Medis, misal: `RM-2026-0001`)
* `nik` (varchar(16), unique, not null - Nomor Induk Kependudukan)
* `full_name` (text, not null)
* `date_of_birth` (date, not null)
* `gender` (text, check: `'L' | 'P'`)
* `blood_type` (text, nullable - `'A' | 'B' | 'AB' | 'O' | '-'`)
* `phone` (text)
* `address` (text)
* `allergies` (text[], default `'{}'` - Riwayat alergi obat/makanan)
* `created_at` (timestamptz, default `now()`)
* `deleted_at` (timestamptz, nullable)

### C. `medical_records` (Kunjungan & Pemeriksaan SOAP)
* `id` (uuid, Primary Key, default `gen_random_uuid()`)
* `patient_id` (uuid, references `patients.id`, not null)
* `doctor_id` (uuid, references `profiles.id`, not null)
* `visit_date` (timestamptz, default `now()`)
* `vital_signs` (jsonb - `{ blood_pressure: string, heart_rate: number, temperature: number, weight: number, height: number }`)
* `subjective` (text, not null - Keluhan utama & anamnesis)
* `objective` (text, not null - Hasil pemeriksaan fisik)
* `assessment` (text, not null - Diagnosa kerja & kode ICD-10)
* `plan` (text, not null - Rencana terapi, tindakan, & resep obat)
* `status` (text, check: `'draft' | 'final'`, default `'draft'`)
* `created_at` (timestamptz, default `now()`)
* `updated_at` (timestamptz, default `now()`)

---

## 5. Aturan Penulisan Kode (Coding Conventions)
1. **Strict TypeScript:** Hindari penggunaan tipe `any`. Selalu definisikan `interface` atau `type` untuk setiap *props* komponen dan respons API Supabase.
2. **Validasi Form:** Semua input form pasien dan rekam medis wajib divalidasi menggunakan `zod` sebelum dikirim ke Supabase (contoh: NIK wajib 16 digit angka, tekanan darah sesuai format sistolik/diastolik).
3. **Penanganan Error & Loading:**
   * Gunakan state `isLoading` (skeleton loader) saat mengambil data dari Supabase.
   * Tampilkan notifikasi toast yang ramah pengguna jika terjadi *error* dari Supabase (terjemahkan pesan error teknis ke Bahasa Indonesia).
4. **Format Data Lokal:**
   * Format tanggal menggunakan standar Indonesia (`DD MMMM YYYY`, contoh: `18 November 2026`).
   * Tampilkan umur pasien secara otomatis yang dihitung dari `date_of_birth` (contoh: `34 Tahun 2 Bulan`).

---

## 6. Instruksi Khusus untuk AI Assistant
Saat saya meminta Anda membuat fitur, komponen, atau *query*:
1. **Selalu ikuti skema database pada Bagian 4.** Jangan mengarang nama kolom baru tanpa meminta persetujuan saya terlebih dahulu.
2. **Sertakan kebijakan RLS (Row Level Security)** setiap kali Anda memberikan kode SQL untuk membuat tabel baru.
3. **Prioritaskan UX tenaga medis:** Buat antarmuka yang bersih, kontras tinggi, minim klik berlebihan, dan sorot informasi krusial seperti **Riwayat Alergi Pasien** dengan warna peringatan (merah/kuning) di bagian atas halaman rekam medis.
4. Jika konteks permintaan saya kurang jelas, tanyakan klarifikasi singkat sebelum menulis kode panjang.