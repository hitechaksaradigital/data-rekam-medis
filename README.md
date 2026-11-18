# Sistem Data Rekam Medis (EMR)

Aplikasi web manajemen data pasien dan rekam medis (SOAP) berbasis **React + Vite + TypeScript** dengan **Supabase** sebagai backend. Dirancang sebagai aplikasi statis yang bisa di-upload ke **cPanel** (tanpa server Node.js).

Seluruh implementasi mengikuti `standarisasi_proyek_rekam_medis.md` sebagai sumber kebenaran.

---

## 1. Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Frontend | React 18, Vite 6, TypeScript (strict) |
| Styling | Tailwind CSS 3, Lucide React |
| Data & State | TanStack Query, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security) |
| Notifikasi | Sonner |

---

## 2. Struktur Folder

```
src/
├── components/
│   ├── ui/            # Button, Input, Select, Modal, Badge, Skeleton, dll.
│   ├── layout/        # AppLayout, Sidebar, Topbar
│   └── common/        # AllergyBanner, PageHeader, StatusBadge, EmptyState
├── features/
│   ├── auth/          # Login, sesi, proteksi rute
│   ├── patients/      # CRUD & pencarian pasien
│   ├── medical-records/ # SOAP, tanda vital, finalisasi
│   ├── dashboard/     # Ringkasan klinik
│   └── users/         # Manajemen peran petugas (admin)
├── hooks/             # useDebounce
├── lib/               # supabase.ts, queryClient.ts, utils.ts
├── types/             # database.types.ts, tipe domain
├── utils/             # format.ts, translateError.ts
├── App.tsx            # Routing
└── main.tsx           # Entry point
supabase/migrations/0001_initial.sql   # Skema + RLS + trigger + RPC
```

---

## 3. Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env
# Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev
```

Perintah lain:

```bash
npm run typecheck   # cek TypeScript
npm run build       # hasil build ke folder dist/
npm run preview     # pratinjau build produksi
```

---

## 4. Menyiapkan Supabase

> **Status saat ini:** project `data-rekam-medis` (ref `wkanmcwwzwnnerlhcmua`, region `ap-southeast-1`) sudah dibuat dan migrasi `0001_initial.sql` sudah diterapkan. File `.env` sudah berisi URL dan publishable key project tersebut.

Akun yang sudah dibuat untuk pengujian ( **segera ganti kata sandinya** ):

| Email | Peran | Kata sandi |
| --- | --- | --- |
| `admin@rekammedis.id` | admin | `RekamMedis2026!` |
| `dokter@rekammedis.id` | dokter | `RekamMedis2026!` |

Data contoh: pasien `Siti Aminah` (`RM-2026-0001`) dengan satu rekam medis final. Hapus atau ganti sebelum pemakaian produksi.

Untuk project baru (misalnya VPC/deploy lain):

1. Buat project Supabase baru.
2. Buka **SQL Editor**, jalankan seluruh isi `supabase/migrations/0001_initial.sql`.
   Migrasi ini membuat tabel `profiles`, `patients`, `medical_records`, mengaktifkan **RLS** pada semuanya, membuat trigger audit, RPC `update_vital_signs`, dan generator `no_rm`.
3. Di **Authentication → Providers → Email**, aktifkan *Confirm email* untuk produksi. Untuk pengembangan lokal bisa dinonaktifkan agar langsung mendapat sesi.
4. Daftarkan akun pertama lewat halaman `/login`. Setiap akun baru otomatis mendapat peran **`perawat`** (tidak bisa menetapkan sendiri peran admin).
5. Promosi akun pertama menjadi admin lewat SQL Editor:

```sql
update public.profiles p
   set role = 'admin'
  from auth.users u
 where u.id = p.id
   and u.email = 'admin@klinik.id';
```

6. Setelah itu, peran petugas lain bisa diubah di menu **Pengguna** (khusus admin).

### Matriks hak akses

| Aksi | admin | dokter | perawat |
| --- | :---: | :---: | :---: |
| Melihat pasien & rekam medis | ✅ | ✅ | ✅ |
| Menambah/ubah/mengarsipkan pasien | ✅ | — | — |
| Membuat kunjungan (draft) | — | ✅ | ✅ |
| Mengisi tanda vital | — | ✅ | ✅ |
| Mengisi SOAP / diagnosa / resep | — | ✅ | — |
| Finalisasi rekam medis | — | ✅ | — |
| Mengubah peran pengguna | ✅ | — | — |

Catatan: admin **sengaja tidak diberi izin** mengubah isi SOAP/diagnosa dokter. Penghapusan data selalu bersifat *soft delete* (`deleted_at`) pada `patients`; tabel `medical_records` tidak memiliki kebijakan `DELETE`.

---

## 5. Deploy ke cPanel

Karena Vite menyisipkan nilai `.env` **saat build**, isi kredensial Supabase terlebih dahulu, lalu build:

```bash
# 1. Isi .env dengan URL & publishable key project produksi
npm run build

# 2. Upload seluruh isi folder dist/ ke public_html/ (atau subfolder tujuan)
# 3. Upload file .htaccess ke folder yang sama
```

Langkah penting:

- **Jangan** upload folder `src/`, `node_modules/`, atau `.env` ke cPanel.
- File `.htaccess` sudah berisi aturan rewrite agar React Router bekerja saat URL di-refresh (mis. `/pasien/123`). Pastikan mod_rewrite aktif di cPanel.
- Jika aplikasi ditempatkan di subfolder (mis. `public_html/emr/`), ubah `RewriteBase /` menjadi `RewriteBase /emr/` dan baris `RewriteRule . /index.html [L]` menjadi `RewriteRule . /emr/index.html [L]` pada `.htaccess`, lalu set `base: '/emr/'` di `vite.config.ts` sebelum build.
- Aktifkan SSL di cPanel agar Supabase Auth dan data medis terkirim lewat HTTPS.
- Di Supabase **Authentication → URL Configuration**, tambahkan `https://domain-anda.com` pada *Site URL* dan *Redirect URLs*.

---

## 6. Validasi & Keamanan

- NIK divalidasi tepat 16 digit angka (Zod).
- Tekanan darah wajib berformat `sistolik/diastolik` (contoh `120/80`).
- Rentang nilai vital dibatasi: nadi 30–250, suhu 30–45 °C, berat 1–300 kg, tinggi 30–250 cm.
- Tanggal ditampilkan dengan format Indonesia (`18 November 2026`) dan umur dihitung otomatis (`34 Tahun 2 Bulan`).
- Pesan error teknis Supabase diterjemahkan ke Bahasa Indonesia di UI.
- Riwayat alergi pasien ditampilkan di bagian paling atas halaman rekam medis dengan warna peringatan.
