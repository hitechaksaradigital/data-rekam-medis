export interface MedicationCount {
  name: string;
  count: number;
}

const KATA_ABAIAN = new Set([
  'istirahat',
  'kontrol',
  'observasi',
  'diet',
  'minum',
  'air',
  'putih',
  'edukasi',
  'rujuk',
  'fisioterapi',
  'kompres',
  'terapi',
  'resep',
  'obat',
  'hari',
  'bulan',
]);

/**
 * Mengambil nama obat dari satu potongan teks resep.
 * Contoh: "Paracetamol 500mg 3x1" -> "Paracetamol".
 * Hanya potongan yang memuat dosis atau frekuensi yang dihitung, agar
 * kalimat seperti "istirahat cukup" tidak ikut terdeteksi sebagai obat.
 */
function namaObatDariPotongan(segmen: string): string | null {
  const bersih = segmen.replace(/^[•\-\d.)\s]+/, '').trim();
  if (!bersih) return null;

  const kata: string[] = [];
  for (const token of bersih.split(/\s+/)) {
    const adaDosis = /^\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|unit|tablet|kapsul|botol)/i.test(token)
      || /^\d+\s*x\s*\d+/i.test(token);
    if (adaDosis) break;
    if (/^\d/.test(token)) break;
    if (!/^[A-Za-z][A-Za-z0-9\-/]*$/.test(token)) break;
    kata.push(token);
  }

  if (!kata.length) return null;
  const nama = kata.join(' ').toLowerCase().replace(/\b\w/g, (huruf) => huruf.toUpperCase());
  if (KATA_ABAIAN.has(nama.toLowerCase())) return null;
  return nama;
}

/** Menghitung frekuensi nama obat dari kumpulan teks rencana terapi. */
export function rangkumObat(daftarPlan: string[], batas = 5): MedicationCount[] {
  const penghitung = new Map<string, number>();

  for (const plan of daftarPlan) {
    for (const potongan of plan.split(/[,\n;]+/)) {
      const nama = namaObatDariPotongan(potongan);
      if (nama) penghitung.set(nama, (penghitung.get(nama) ?? 0) + 1);
    }
  }

  return [...penghitung.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, batas);
}
