-- =====================================================================
-- Sistem Data Rekam Medis (EMR) — Migrasi Awal
-- Sesuai: standarisasi_proyek_rekam_medis.md (Bagian 3 & 4)
-- Jalankan lewat Supabase SQL Editor / `supabase db push`.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helper: peran pengguna yang sedang login.
-- SECURITY DEFINER sengaja dipakai agar tidak terjadi rekursi RLS.
-- ---------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

grant execute on function public.get_my_role() to authenticated;

-- ---------------------------------------------------------------------
-- A. profiles — ekstensi dari auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'perawat'
    check (role in ('admin', 'dokter', 'perawat')),
  sip_number text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Petugas juga perlu melihat daftar dokter untuk menentukan dokter pemeriksa.
create policy "profiles_select_staff"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.get_my_role() = 'admin' or role = 'dokter');

create policy "profiles_update_self_or_admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.get_my_role() = 'admin')
  with check (id = auth.uid() or public.get_my_role() = 'admin');

-- Peran hanya boleh diubah oleh admin (Bagian 3.2 - RBAC).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(public.get_my_role(), '') <> 'admin' then
    raise exception 'Hanya admin yang dapat mengubah peran pengguna.';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Profil dibuat otomatis saat pendaftaran. Peran selalu default 'perawat'
-- (tidak boleh diambil dari metadata agar tidak ada self-assignment admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    'perawat'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- B. patients — data induk pasien
-- ---------------------------------------------------------------------
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  no_rm text not null unique,
  nik varchar(16) not null unique,
  full_name text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('L', 'P')),
  blood_type text check (blood_type in ('A', 'B', 'AB', 'O', '-')),
  phone text,
  address text,
  allergies text[] not null default '{}',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Audit trail (Bagian 3.3)
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

alter table public.patients enable row level security;

create policy "patients_select_staff"
  on public.patients for select to authenticated
  using (deleted_at is null);

create policy "patients_insert_admin"
  on public.patients for insert to authenticated
  with check (public.get_my_role() = 'admin');

create policy "patients_update_admin"
  on public.patients for update to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Tidak ada policy DELETE -> hard delete ditolak. Gunakan deleted_at.

create index patients_nik_idx on public.patients (nik);
create index patients_no_rm_idx on public.patients (no_rm);
create index patients_created_at_idx on public.patients (created_at desc);

-- ---------------------------------------------------------------------
-- C. medical_records — kunjungan & pemeriksaan SOAP
-- ---------------------------------------------------------------------
create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  doctor_id uuid not null references public.profiles(id),
  visit_date timestamptz not null default now(),
  vital_signs jsonb not null default '{}'::jsonb,
  subjective text not null,
  objective text not null,
  assessment text not null,
  plan text not null,
  status text not null default 'draft' check (status in ('draft', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Audit trail (Bagian 3.3)
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

alter table public.medical_records enable row level security;

create policy "records_select_staff"
  on public.medical_records for select to authenticated
  using (true);

create policy "records_insert_dokter_perawat"
  on public.medical_records for insert to authenticated
  with check (
    public.get_my_role() in ('dokter', 'perawat')
    and status = 'draft'
  );

-- Admin bisa melihat, tetapi tidak boleh mengubah isi diagnosa dokter.
create policy "records_update_dokter"
  on public.medical_records for update to authenticated
  using (public.get_my_role() = 'dokter')
  with check (public.get_my_role() = 'dokter');

create index records_patient_idx on public.medical_records (patient_id);
create index records_doctor_idx on public.medical_records (doctor_id);
create index records_visit_date_idx on public.medical_records (visit_date desc);
create index records_status_idx on public.medical_records (status);

-- ---------------------------------------------------------------------
-- Audit: created_by / updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.stamp_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.stamp_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger patients_stamp_created
  before insert on public.patients
  for each row execute function public.stamp_created_by();

create trigger patients_stamp_updated
  before update on public.patients
  for each row execute function public.stamp_updated();

create trigger records_stamp_created
  before insert on public.medical_records
  for each row execute function public.stamp_created_by();

create trigger records_stamp_updated
  before update on public.medical_records
  for each row execute function public.stamp_updated();

-- ---------------------------------------------------------------------
-- Perawat hanya boleh mengisi tanda vital pada kunjungan Draft.
-- Dibuat sebagai SECURITY DEFINER agar bisa mengubah satu kolom tanpa
-- memberi izin UPDATE penuh (RLS tidak support column-level policy).
-- ---------------------------------------------------------------------
create or replace function public.update_vital_signs(
  p_record_id uuid,
  p_vital_signs jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() <> 'perawat' then
    raise exception 'Hanya perawat yang dapat menginput tanda vital.';
  end if;

  if not exists (
    select 1 from public.medical_records
    where id = p_record_id and status = 'draft'
  ) then
    raise exception 'Kunjungan tidak ditemukan atau sudah difinalisasi.';
  end if;

  update public.medical_records
     set vital_signs = p_vital_signs,
         updated_at = now(),
         updated_by = auth.uid()
   where id = p_record_id;
end;
$$;

grant execute on function public.update_vital_signs(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Nomor rekam medis otomatis: RM-<tahun>-<4 digit>, bebas race condition.
-- ---------------------------------------------------------------------
create sequence if not exists public.no_rm_seq;

create or replace function public.generate_no_rm()
returns text
language sql
security definer
set search_path = public
as $$
  select 'RM-' || to_char(now(), 'YYYY') || '-'
         || lpad(nextval('public.no_rm_seq')::text, 4, '0');
$$;

grant execute on function public.generate_no_rm() to authenticated;

-- =====================================================================
-- SELESAI. Langkah berikutnya di aplikasi:
-- 1. Daftarkan user pertama lewat halaman /login (Auto Confirmation harus
--    aktif di Supabase > Authentication > Providers > Email, atau konfirmasi
--    email manual).
-- 2. Promosi user pertama menjadi admin lewat SQL:
--      update public.profiles p set role = 'admin'
--      from auth.users u where u.id = p.id and u.email = 'admin@klinik.id';
--    (lihat README.md bagian "Promosi admin pertama").
-- =====================================================================
