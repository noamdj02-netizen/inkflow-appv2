import React, { useCallback, useMemo, useState } from 'react';
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
  FileDown,
  Plus,
  Trash2,
  Keyboard,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  parseClientImportFile,
  isClientImportFileNameOk,
  downloadClientImportTemplateXlsx,
} from '../../lib/parseClientImportFile';
import posthog from '../../lib/posthog';

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

/** Valeur « aucune colonne » dans les selects de mapping */
const EMPTY_MAP = '';

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

const MANUAL_COL = {
  name: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  reservationDate: 'Date de réservation',
} as const;

type ManualRow = {
  id: string;
  nom: string;
  email: string;
  phone: string;
  date: string;
};

function newManualRow(): ManualRow {
  return {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `mr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    nom: '',
    email: '',
    phone: '',
    date: '',
  };
}

function validateParsedRows(
  rows: Record<string, string>[],
  mapping: Record<ClientImportFieldKey, string>
): { validatedRows: ClientCsvImportRow[]; rowErrors: Map<number, string[]> } {
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
        reservationDate = null;
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

  return { validatedRows: ok, rowErrors: errors };
}

export interface ClientCsvImportProps {
  onImport: (rows: ClientCsvImportRow[]) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  maxFileSizeMb?: number;
  maxRows?: number;
}

type Step = 'drop' | 'map' | 'preview';

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
  const [sourceTab, setSourceTab] = useState<'file' | 'manual'>('file');
  const [importSource, setImportSource] = useState<'file' | 'manual'>('file');
  const [manualRows, setManualRows] = useState<ManualRow[]>(() =>
    Array.from({ length: 5 }, () => newManualRow())
  );
  const [templateLoading, setTemplateLoading] = useState(false);

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
    setSourceTab('file');
    setImportSource('file');
    setManualRows(Array.from({ length: 5 }, () => newManualRow()));
  }, []);

  const applyGuessMapping = useCallback((fields: string[]) => {
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
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!isClientImportFileNameOk(file.name)) {
        toast.error('Formats acceptés : CSV, Excel (.xlsx, .xls)');
        return;
      }
      const maxBytes = maxFileSizeMb * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`Fichier trop volumineux (max ${maxFileSizeMb} Mo)`);
        return;
      }

      try {
        const { columns: fields, rows: data } = await parseClientImportFile(file);

        if (data.length > maxRows) {
          toast.error(`Trop de lignes (max ${maxRows}). Découpe ton fichier.`);
          return;
        }

        setImportSource('file');
        setFileName(file.name);
        setColumns(fields);
        setRows(data);
        applyGuessMapping(fields);
        setStep('map');
        toast.success(`${data.length} ligne(s) détectée(s)`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Lecture du fichier impossible');
      }
    },
    [applyGuessMapping, maxFileSizeMb, maxRows, toast]
  );

  const handleDownloadTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      await downloadClientImportTemplateXlsx();
      toast.success('Modèle téléchargé — ouvre-le dans Excel ou Google Sheets');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Téléchargement impossible');
    } finally {
      setTemplateLoading(false);
    }
  }, [toast]);

  const handleManualValidate = useCallback(() => {
    const built: Record<string, string>[] = manualRows
      .filter((r) => r.nom.trim() || r.email.trim() || r.phone.trim() || r.date.trim())
      .map((r) => ({
        [MANUAL_COL.name]: r.nom.trim(),
        [MANUAL_COL.email]: r.email.trim(),
        [MANUAL_COL.phone]: r.phone.trim(),
        [MANUAL_COL.reservationDate]: r.date.trim(),
      }));

    if (built.length === 0) {
      toast.error('Ajoute au moins une ligne avec un nom ou un email');
      return;
    }
    if (built.length > maxRows) {
      toast.error(`Trop de lignes (max ${maxRows})`);
      return;
    }

    const fixedMapping: Record<ClientImportFieldKey, string> = {
      name: MANUAL_COL.name,
      email: MANUAL_COL.email,
      phone: MANUAL_COL.phone,
      reservationDate: MANUAL_COL.reservationDate,
    };

    const { validatedRows: ok, rowErrors: errors } = validateParsedRows(built, fixedMapping);

    setImportSource('manual');
    setFileName('Saisie manuelle');
    setColumns([MANUAL_COL.name, MANUAL_COL.email, MANUAL_COL.phone, MANUAL_COL.reservationDate]);
    setRows(built);
    setMapping(fixedMapping);
    setRowErrors(errors);
    setValidatedRows(ok);

    if (ok.length === 0) {
      toast.error('Aucune ligne valide. Vérifie les emails et les dates.');
      return;
    }

    if (errors.size > 0) {
      toast.error(`${errors.size} ligne(s) en erreur — corrige ou supprime ces lignes`);
    } else {
      toast.success(`${ok.length} ligne(s) prêtes à l’import`);
    }

    setStep('preview');
  }, [manualRows, maxRows, toast]);

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
      toast.error('Une même colonne est utilisée plusieurs fois. Corrige le mapping.');
      return;
    }

    const { validatedRows: ok, rowErrors: errors } = validateParsedRows(rows, mapping);

    setRowErrors(errors);
    setValidatedRows(ok);

    if (ok.length === 0) {
      toast.error('Aucune ligne valide. Vérifie le mapping et les données.');
      return;
    }

    if (errors.size > 0) {
      toast.error(`${errors.size} ligne(s) en erreur — corrige le fichier ou le mapping`);
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
      posthog.capture('crm_clients_imported', {
        client_count: validatedRows.length,
        import_source: importSource,
      });
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
            <h3 className="text-sm font-semibold truncate">Importer des clients</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {step === 'drop' &&
                'CSV ou Excel — ou saisis tes clients directement ici (enregistrés dans ton CRM)'}
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {importSource === 'manual' || (step === 'drop' && sourceTab === 'manual') ? (
            <>
              <span
                className={
                  step === 'preview'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'font-semibold text-sky-600 dark:text-sky-400'
                }
              >
                Saisie
              </span>
              <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
              <span
                className={
                  step === 'preview'
                    ? 'font-semibold text-sky-600 dark:text-sky-400'
                    : 'opacity-70'
                }
              >
                Validation
              </span>
            </>
          ) : (
            (['drop', 'map', 'preview'] as const).map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <ArrowRight className="w-3.5 h-3.5 opacity-50 shrink-0" />}
                <span
                  className={
                    step === s
                      ? 'font-semibold text-sky-600 dark:text-sky-400'
                      : 'opacity-70'
                  }
                >
                  {s === 'drop' ? 'Fichier' : s === 'map' ? 'Colonnes' : 'Validation'}
                </span>
              </React.Fragment>
            ))
          )}
        </div>

        {step === 'drop' && (
          <div className="space-y-4">
            <div
              role="tablist"
              className="flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 gap-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === 'file'}
                onClick={() => setSourceTab('file')}
                className={`flex-1 min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                  sourceTab === 'file'
                    ? 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 shrink-0" />
                  Fichier
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sourceTab === 'manual'}
                onClick={() => setSourceTab('manual')}
                className={`flex-1 min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                  sourceTab === 'manual'
                    ? 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200/80 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Keyboard className="w-4 h-4 shrink-0" />
                  Saisie à la main
                </span>
              </button>
            </div>

            {sourceTab === 'file' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Modèle prêt à remplir (Excel, Numbers, Google Sheets).
                  </p>
                  <button
                    type="button"
                    disabled={templateLoading}
                    onClick={() => void handleDownloadTemplate()}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {templateLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    Télécharger le modèle (.xlsx)
                  </button>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-2xl border-2 border-dashed transition-all
                    ${
                      dragOver
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20'
                        : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40'
                    }
                  `}
                >
                  <FileSpreadsheet
                    className={`w-10 h-10 ${dragOver ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400'}`}
                  />
                  <p className="text-sm text-center text-zinc-600 dark:text-zinc-300 max-w-md">
                    Glisse-dépose un fichier <strong>.csv</strong>, <strong>.xlsx</strong> ou{' '}
                    <strong>.xls</strong> (première feuille = tableau avec en-têtes)
                  </p>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98]">
                      Parcourir…
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      className="hidden"
                      onChange={onFileInput}
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500 text-center max-w-md leading-relaxed">
                    Max {maxFileSizeMb} Mo · {maxRows} lignes · UTF-8 pour le CSV. Tu peux aussi exporter depuis
                    Excel / Google Sheets en <strong>.xlsx</strong> sans passer par le CSV.
                  </p>
                </div>
              </>
            )}

            {sourceTab === 'manual' && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Une ligne = un client. <span className="text-rose-500 dark:text-rose-400">*</span> Nom et email
                  obligatoires pour valider la ligne.
                </p>
                <div className="max-h-[min(50vh,320px)] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs min-w-[520px]">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                      <tr>
                        <th className="px-2 py-2 font-semibold w-10" aria-hidden />
                        <th className="px-2 py-2 font-semibold">
                          Nom <span className="text-rose-500">*</span>
                        </th>
                        <th className="px-2 py-2 font-semibold">
                          Email <span className="text-rose-500">*</span>
                        </th>
                        <th className="px-2 py-2 font-semibold">Tél.</th>
                        <th className="px-2 py-2 font-semibold">Date RDV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {manualRows.map((row, idx) => (
                        <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                          <td className="px-1 py-1 align-middle text-center text-zinc-400 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="px-1 py-1">
                            <input
                              value={row.nom}
                              onChange={(e) =>
                                setManualRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, nom: e.target.value } : r
                                  )
                                )
                              }
                              className="w-full min-w-0 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                              placeholder="Prénom Nom"
                              autoComplete="name"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="email"
                              value={row.email}
                              onChange={(e) =>
                                setManualRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, email: e.target.value } : r
                                  )
                                )
                              }
                              className="w-full min-w-0 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                              placeholder="email@…"
                              autoComplete="email"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              value={row.phone}
                              onChange={(e) =>
                                setManualRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, phone: e.target.value } : r
                                  )
                                )
                              }
                              className="w-full min-w-0 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm tabular-nums"
                              placeholder="06…"
                              inputMode="tel"
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              value={row.date}
                              onChange={(e) =>
                                setManualRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, date: e.target.value } : r
                                  )
                                )
                              }
                              className="w-full min-w-[7rem] px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                              placeholder="JJ/MM/AAAA"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualRows((prev) => [...prev, newManualRow()])}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une ligne
                  </button>
                  {manualRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setManualRows((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)))
                      }
                      className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-sm text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer la dernière ligne
                    </button>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleManualValidate}
                    className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-sky-600 dark:bg-sky-500 text-white text-sm font-semibold hover:bg-sky-700 dark:hover:bg-sky-400 transition-all active:scale-[0.98]"
                  >
                    Vérifier et continuer
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
                onClick={() => {
                  if (importSource === 'manual') {
                    setStep('drop');
                    setSourceTab('manual');
                  } else {
                    setStep('map');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                {importSource === 'manual' ? 'Retour à la saisie' : 'Retour au mapping'}
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
