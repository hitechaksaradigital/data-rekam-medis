import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

/** DD MMMM YYYY, contoh: 18 November 2026 */
export function formatTanggal(value: string | Date): string {
  return format(toDate(value), 'dd MMMM yyyy', { locale: localeId });
}

/** DD MMM YYYY, contoh: 18 Nov 2026 */
export function formatTanggalPendek(value: string | Date): string {
  return format(toDate(value), 'dd MMM yyyy', { locale: localeId });
}

/** DD MMMM YYYY, HH:mm */
export function formatTanggalWaktu(value: string | Date): string {
  return format(toDate(value), 'dd MMMM yyyy, HH:mm', { locale: localeId });
}

/** Umur dalam tahun dan bulan, contoh: 34 Tahun 2 Bulan */
export function hitungUmur(dateOfBirth: string): string {
  const lahir = parseISO(dateOfBirth);
  const sekarang = new Date();
  if (Number.isNaN(lahir.getTime()) || lahir > sekarang) return '-';

  let tahun = sekarang.getFullYear() - lahir.getFullYear();
  let bulan = sekarang.getMonth() - lahir.getMonth();
  if (sekarang.getDate() < lahir.getDate()) bulan -= 1;
  if (bulan < 0) {
    tahun -= 1;
    bulan += 12;
  }

  if (tahun <= 0 && bulan <= 0) return 'Baru lahir';
  if (tahun <= 0) return `${bulan} Bulan`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

/** 3204123456780001 -> 3204 1234 5678 0001 */
export function formatNIK(nik: string): string {
  return nik.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** Sembunyikan 8 digit tengah NIK untuk tampilan daftar. */
export function maskNIK(nik: string): string {
  if (nik.length !== 16) return nik;
  return `${nik.slice(0, 4)}••••••••${nik.slice(-4)}`;
}

export function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((bagian) => bagian.charAt(0).toUpperCase())
    .join('');
}

export function formatAngka(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}
