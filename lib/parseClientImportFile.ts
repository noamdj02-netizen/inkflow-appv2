import Papa from 'papaparse';

export interface ParsedClientSheet {
  columns: string[];
  rows: Record<string, string>[];
}

function filterDataRows(rows: Record<string, string>[]) {
  return rows.filter((row) => Object.values(row).some((v) => String(v ?? '').trim() !== ''));
}

export function isClientImportFileNameOk(fileName: string): boolean {
  const n = fileName.toLowerCase();
  return n.endsWith('.csv');
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

export async function parseClientImportFile(file: File): Promise<ParsedClientSheet> {
  const n = file.name.toLowerCase();
  if (n.endsWith('.csv')) return parseCsvFile(file);
  throw new Error(
    'Format non supporté : utilise un fichier .csv (Fichier > Enregistrer sous > CSV dans Excel ou Google Sheets).'
  );
}

/** Modèle d’import — CSV UTF-8 (RFC 4180), ouvre correctement dans Excel. */
export function downloadClientImportTemplateCsv(): void {
  const header = ['Nom', 'Email', 'Téléphone', 'Date de réservation'];
  const example = ['Exemple Client', 'exemple@email.com', '0612345678', ''];
  const esc = (cell: string) => {
    const s = String(cell ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [header, example].map((row) => row.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff', lines], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele-import-clients-inkflow.csv';
  a.click();
  URL.revokeObjectURL(url);
}
