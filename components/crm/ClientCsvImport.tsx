import React, { useCallback, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { format, isValid, parse, parseISO } from 'date-fns';
import { z } from 'zod';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Table2,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

/** Ligne prête pour l’API après validation (date normalisée ISO jour ou null) */
export interface ClientCsvImportRow {
  name: string;
  email: string;
  phone: string;
  reservationDate: string | null;
}

/** Clés des champs base (hors mapping CSV) */
export type ClientImportFieldKey = 'name' | 'email' | 'phone' | 'reservationDate';

const FIELD_LABELS: Record<ClientImportFieldKey, string> = {
  name: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  reservationDate: 'Date de réservation',
};

const FIELD_REQUIRED: Record<ClientImportFieldKey, boolean> = {
  name: true,
  email: true,
  phone: false,
  reservationDate: false,
};

const emailSchema = z.string().trim().email({ message: 'Email invalide' });

function parseReservationDate(raw: string): { ok: true; iso: string } | { ok: false; error: string } {
  const t = raw.trim();
  if (!t) return { ok: false, error: 'Date vide' };

  const isoTry = parseISO(t.length === 10 ? `${t}T12:00:00` : t);
  if (isValid(isoTry)) {
    return { ok: true, iso: format(isoTry, 'yyyy-MM-dd') };
  }

  const patterns = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy'] as const;
  for (const p of patterns) {
    const d = parse(t, p, new Date());
    if (isValid(d)) {
      return { ok: true, iso: format(d, 'yyyy-MM-dd') };
    }
  }

  const ms = Date.parse(t);
  if (!Number.isNaN(ms)) {
    const d = new Date(ms);
    if (isValid(d)) {
      return { ok: true, iso: format(d, 'yyyy-MM-dd') };
    }
  }

  return { ok: false, error: 'Format de date non reconnu' };
}

function normalizePhone(raw: string): string {
  const s = raw.replace(/\s/g, '').replace(/\./g, '');
  return s || '';
}

export interface ClientCsvImportProps {
  onImport: (rows: ClientCsvImportRow[]) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  maxFileSizeMb?: number;
  maxRows?: number;
}

type Step = 'drop' | 'map' | 'preview';

const EMPTY_MAP = '';

export const ClientCsvImport: React.FC<ClientCsvImportProps> = ({
  onImport,
  onCancel,
  className = '',
  maxFileSizeMb = 5,
  maxRows = 2000,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<Step>('drop');
  const [fileName, setFileName] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<ClientImportFieldKey, string>>({
    name: EMPTY_MAP,
    email: EMPTY_MAP,
    phone: EMPTY_MAP,
    reservationDate: EMPTY_MAP,
  });
  const [validatedRows, setValidatedRows] = useState<ClientCsvImportRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Map<number, string[]>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setStep('drop');
    setFileName(null);
    setColumns([]);
    setRows([]);
    setMapping({
      name: EMPTY_MAP,
      email: EMPTY_MAP,
      phone: EMPTY_MAP,
      reservationDate: EMPTY_MAP,
    });
    setValidatedRows([]);
    setRowErrors(new Map());
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Veuillez choisir un fichier .csv');
        return;
      }
      const maxBytes = maxFileSizeMb * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`Fichier trop volumineux (max ${maxFileSizeMb} Mo)`);
        return;
      }

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (h) => h.trim(),
        complete: (result) => {
          if (result.errors.length > 0) {
            const fatal = result.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter');
            if (fatal) {
              toast.error(`Erreur CSV : ${fatal.message}`);
              return;
            }
          }

          const data = (result.data as Record<string, string>[]).filter((row) =>
            Object.values(row).some((v) => String(v ?? '').trim() !== '')
          );

          if (data.length === 0) {
            toast.error('Le fichier ne contient aucune ligne de données');
            return;
          }

          if (data.length > maxRows) {
            toast.error(`Trop de lignes (max ${maxRows}). Découpe ton fichier.`);
            return;
          }

          const fields = result.meta.fields?.filter(Boolean) ?? [];
          if (fields.length === 0) {
            toast.error('Impossible de lire les en-têtes de colonnes');
            return;
          }

          setFileName(file.name);
          setColumns(fields);
          setRows(data);

          const guess = (patterns: RegExp[]) => {
            for (const f of fields) {
              const low = f.toLowerCase();
              if (patterns.some((re) => re.test(low))) return f;
            }
            return EMPTY_MAP;
          };

          setMapping({
            name: guess([/^nom\b/, /^name\b/, /^client\b/, /^fullname/]),
            email: guess([/^e-?mail/, /^mail/, /^courriel/]),
            phone: guess([/^tel/, /^phone/, /^mobile/, /^portable/]),
            reservationDate: guess([/^date/, /^rdv/, /^reservation/, /^booking/]),
          });

          setStep('map');
          toast.success(`${data.length} ligne(s) détectée(s)`);
        },
        error: (err) => {
          toast.error(err.message || 'Lecture du fichier impossible');
        },
      });
    },
    [maxFileSizeMb, maxRows, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
      e.target.value = '';
    },
    [processFile]
  );

  const mappingComplete = useMemo(() => {
    return (
      mapping.name !== EMPTY_MAP &&
      mapping.email !== EMPTY_MAP &&
      (FIELD_REQUIRED.phone ? mapping.phone !== EMPTY_MAP : true) &&
      (FIELD_REQUIRED.reservationDate ? mapping.reservationDate !== EMPTY_MAP : true)
    );
  }, [mapping]);

  const duplicateMappings = useMemo(() => {
    const used = Object.values(mapping).filter((v) => v !== EMPTY_MAP);
    const dup = used.filter((v, i) => used.indexOf(v) !== i);
    return [...new Set(dup)];
  }, [mapping]);

  const runValidation = useCallback(() => {
    if (!mappingComplete) {
      toast.error('Associe au minimum les colonnes Nom et Email');
      return;
    }
    if (duplicateMappings.length > 0) {
      toast.error('Une même colonne CSV est utilisée plusieurs fois. Corrige le mapping.');
      return;
    }

    const errors = new Map<number, string[]>();
    const ok: ClientCsvImportRow[] = [];

    rows.forEach((raw, index) => {
      const lineErr: string[] = [];
      const name = String(raw[mapping.name] ?? '').trim();
      const emailRaw = String(raw[mapping.email] ?? '').trim();
      const phoneRaw =
        mapping.phone === EMPTY_MAP ? '' : String(raw[mapping.phone] ?? '').trim();
      const dateRaw =
        mapping.reservationDate === EMPTY_MAP
          ? ''
          : String(raw[mapping.reservationDate] ?? '').trim();

      if (!name) lineErr.push('Nom manquant');
      const emailCheck = emailSchema.safeParse(emailRaw);
      if (!emailCheck.success) {
        lineErr.push(emailCheck.error.issues[0]?.message ?? 'Email invalide');
      }

      let reservationDate: string | null = null;
      if (mapping.reservationDate !== EMPTY_MAP) {
        if (!dateRaw) {
          lineErr.push('Date de réservation vide');
        } else {
          const dateResult = parseReservationDate(dateRaw);
          if (dateResult.ok === false) {
            lineErr.push(dateResult.error);
          } else {
            reservationDate = dateResult.iso;
          }
        }
      }

      const phone = normalizePhone(phoneRaw);

      if (lineErr.length === 0) {
        ok.push({
          name,
          email: emailRaw.toLowerCase(),
          phone,
          reservationDate,
        });
      } else {
        errors.set(index + 2, lineErr);
      }
    });

    setRowErrors(errors);
    setValidatedRows(ok);

    if (ok.length === 0) {
      toast.error('Aucune ligne valide. Vérifie le mapping et les données.');
      return;
    }

    if (errors.size > 0) {
      toast.error(`${errors.size} ligne(s) en erreur — corrige le CSV ou le mapping`);
    } else {
      toast.success(`${ok.length} ligne(s) prêtes à l’import`);
    }

    setStep('preview');
  }, [duplicateMappings.length, mapping, mappingComplete, rows, toast]);

  const handleSubmit = async () => {
    if (validatedRows.length === 0) {
      toast.error('Aucune donnée valide à envoyer');
      return;
    }
    setSubmitting(true);
    try {
      await onImport(validatedRows);
      toast.success('Import terminé');
      reset();
      onCancel?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l’import');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldKeys = Object.keys(FIELD_LABELS) as ClientImportFieldKey[];

  return (
    <div
      className={`rounded-2xl border border-[var(--border)] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate">Import clients (CSV)</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {step === 'drop' &&
                'Table Supabase : inkflow_clients — dépose un fichier ou choisis-le sur ton ordinateur'}
              {step === 'map' && fileName && <span className="tabular-nums">{fileName}</span>}
              {step === 'preview' && `${validatedRows.length} ligne(s) validée(s)`}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              reset();
              onCancel();
            }}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {(['drop', 'map', 'preview'] as const).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />}
              <span
                className={
                  step === s
                    ? 'font-semibold text-sky-600 dark:text-sky-400'
                    : 'opacity-70'
                }
              >
                {s === 'drop' ? 'Fichier' : s === 'map' ? 'Mapping' : 'Validation'}
              </span>
            </React.Fragment>
          ))}
        </div>

        {step === 'drop' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`
              relative flex flex-col items-center justify-center gap-3 px-6 py-12 rounded-2xl border-2 border-dashed transition-all
              ${
                dragOver
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                  : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40'
              }
            `}
          >
            <Upload
              className={`w-10 h-10 ${dragOver ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400'}`}
            />
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-300">
              Glisse-dépose ton fichier <strong>.csv</strong> ici
            </p>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98]">
                Parcourir…
              </span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFileInput} />
            </label>
            <p className="text-[11px] text-zinc-500 text-center max-w-sm">
              Première ligne = en-têtes. Max {maxFileSizeMb} Mo, {maxRows} lignes. UTF-8 recommandé. Excel : enregistrer
              au format <strong>CSV</strong> (séparateur virgule ou point-virgule).
            </p>
          </div>
        )}

        {step === 'map' && (
          <>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-100/80 dark:bg-zinc-900/80 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <Table2 className="w-3.5 h-3.5" />
                Associe chaque champ InkFlow à une colonne du fichier
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {fieldKeys.map((key) => (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5"
                  >
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:w-44 shrink-0">
                      {FIELD_LABELS[key]}
                      {FIELD_REQUIRED[key] && (
                        <span className="text-rose-500 dark:text-rose-400 ml-0.5">*</span>
                      )}
                    </label>
                    <select
                      value={mapping[key]}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [key]: e.target.value }))
                      }
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 dark:focus:border-sky-500"
                    >
                      <option value={EMPTY_MAP}>
                        {FIELD_REQUIRED[key] ? '— Choisir une colonne —' : '— Ignorer —'}
                      </option>
                      {columns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {duplicateMappings.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-sm text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Colonnes dupliquées : {duplicateMappings.join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-between">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Autre fichier
              </button>
              <button
                type="button"
                disabled={!mappingComplete || duplicateMappings.length > 0}
                onClick={runValidation}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 dark:bg-sky-500 text-white text-sm font-semibold hover:bg-sky-700 dark:hover:bg-sky-400 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98]"
              >
                Valider les données
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {validatedRows.length} valide(s)
              </span>
              {rowErrors.size > 0 && (
                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  {rowErrors.size} ligne(s) rejetée(s)
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nom</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Tél.</th>
                    <th className="px-3 py-2 font-semibold">Date RDV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {validatedRows.slice(0, 15).map((r, i) => (
                    <tr key={i} className="text-zinc-800 dark:text-zinc-200">
                      <td className="px-3 py-2 max-w-[120px] truncate">{r.name}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate">{r.email}</td>
                      <td className="px-3 py-2 tabular-nums">{r.phone}</td>
                      <td className="px-3 py-2 tabular-nums">{r.reservationDate ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validatedRows.length > 15 && (
                <p className="px-3 py-2 text-[11px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
                  … et {validatedRows.length - 15} autre(s) ligne(s)
                </p>
              )}
            </div>

            {rowErrors.size > 0 && (
              <details className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 text-xs text-rose-900 dark:text-rose-200">
                <summary className="cursor-pointer font-medium py-1">Détail des erreurs (n° ligne fichier)</summary>
                <ul className="mt-2 space-y-1 max-h-32 overflow-auto">
                  {[...rowErrors.entries()].slice(0, 50).map(([line, errs]) => (
                    <li key={line}>
                      <span className="font-mono font-semibold">L{line}</span> : {errs.join(' · ')}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="flex flex-wrap gap-2 justify-between">
              <button
                type="button"
                onClick={() => setStep('map')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour mapping
              </button>
              <button
                type="button"
                disabled={submitting || validatedRows.length === 0}
                onClick={() => void handleSubmit()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-40 transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    Importer {validatedRows.length} client(s)
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
