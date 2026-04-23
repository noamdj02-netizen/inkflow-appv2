import Papa from 'papaparse';

export interface ParsedClientSheet {
  columns: string[];
  rows: Record<string, string>[];
}

function filterDataRows(rows: Record<string, string>[]) {
  return rows.filter((row) =>
    Object.values(row).some((v) => String(v ?? '').trim() !== '')
  );
}

function normalizeExcelCell(v: unknown): string {
  if (v == null || v === '') return '';
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  }
  return String(v).trim();
}

export function isClientImportFileNameOk(fileName: string): boolean {
  const n = fileName.toLowerCase();
  return n.endsWith('.csv') || n.endsWith('.xlsx') || n.endsWith('.xls');
}

export function parseCsvFile(file: File): Promise<ParsedClientSheet> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          const fatal = result.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter');
          if (fatal) {
            reject(new Error(`Erreur CSV : ${fatal.message}`));
            return;
          }
        }

        const data = filterDataRows(result.data as Record<string, string>[]).map((row) => {
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            out[k] = String(v ?? '').trim();
          }
          return out;
        });

        if (data.length === 0) {
          reject(new Error('Le fichier ne contient aucune ligne de données'));
          return;
        }

        const fields = result.meta.fields?.filter(Boolean) ?? [];
        if (fields.length === 0) {
          reject(new Error('Impossible de lire les en-têtes de colonnes'));
          return;
        }

        resolve({ columns: fields, rows: data });
      },
      error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}

export async function parseExcelFile(file: File): Promise<ParsedClientSheet> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('Le fichier Excel ne contient aucune feuille');
  }
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: '',
    raw: false,
    blankrows: false,
  });

  if (!json.length) {
    throw new Error('La première feuille est vide');
  }

  const rows: Record<string, string>[] = json.map((obj) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = String(k).trim();
      if (!key) continue;
      out[key] = normalizeExcelCell(v);
    }
    return out;
  });

  const data = filterDataRows(rows);
  if (data.length === 0) {
    throw new Error('Aucune ligne de données dans la feuille');
  }

  const first = json[0];
  const columns = Object.keys(first)
    .map((k) => String(k).trim())
    .filter((k) => k !== '');

  return { columns, rows: data };
}

export async function parseClientImportFile(file: File): Promise<ParsedClientSheet> {
  const n = file.name.toLowerCase();
  if (n.endsWith('.csv')) return parseCsvFile(file);
  if (n.endsWith('.xlsx') || n.endsWith('.xls')) return parseExcelFile(file);
  throw new Error('Format non supporté');
}

export async function downloadClientImportTemplateXlsx(): Promise<void> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([
    ['Nom', 'Email', 'Téléphone', 'Date de réservation'],
    ['Exemple Client', 'exemple@email.com', '0612345678', ''],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  XLSX.writeFile(wb, 'modele-import-clients-inkflow.xlsx');
}
