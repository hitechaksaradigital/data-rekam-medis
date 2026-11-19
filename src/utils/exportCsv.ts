export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsv(value: string | number | null | undefined): string {
  const teks = value === null || value === undefined ? '' : String(value);
  // Semicolon dipakai sebagai delimiter agar Excel lokal (desimal koma) tidak memecah kolom.
  return /[;"\n\r]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks;
}

/**
 * Mengunduh data sebagai CSV UTF-8 (dengan BOM agar Excel membaca aksara Indonesia).
 * @param filename nama file, termasuk ekstensi .csv
 * @param rows baris data yang akan diekspor
 * @param columns definisi kolom: judul dan cara mengambil nilainya
 */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const baris = [
    columns.map((kolom) => escapeCsv(kolom.header)).join(';'),
    ...rows.map((row) => columns.map((kolom) => escapeCsv(kolom.value(row))).join(';')),
  ];

  const blob = new Blob([`\uFEFF${baris.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = filename;
  document.body.appendChild(tautan);
  tautan.click();
  document.body.removeChild(tautan);
  URL.revokeObjectURL(url);
}
