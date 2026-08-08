/** Identité éditeur InkFlow — source : formalité Guichet Unique J00223343989 (mars 2026). */

function envStr(key: string): string | null {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export const INKFLOW_LEGAL_DEFAULTS = {
  /** Entrepreneur individuel — raison sociale = nom de l'entrepreneur. */
  entrepreneurName: 'Noam Brochet',
  legalForm: 'Entrepreneur individuel (micro-entreprise)',
  tradeName: 'InkFlow',
  siren: '102143153',
  siret: '10214315300017',
  address: '9 rue Perciere, 76000 Rouen, France',
  rne: 'Immatriculée au Registre National des Entreprises (RNE) — formalité validée le 17 mars 2026',
  ape: '6201Z — Programmation informatique',
  tva: 'TVA non applicable, article 293 B du CGI (franchise en base)',
  director: 'Noam Brochet',
  contactEmail: 'contact@ink-flow.me',
  website: 'https://ink-flow.me',
  hostingInfo:
    'Hébergement de l’application : Vercel Inc. (États-Unis) — https://vercel.com. Données applicatives (base de données) : Supabase (région UE selon paramétrage du projet) — https://supabase.com.',
} as const;

export function formatSirenDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 9) return raw.trim();
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

/** Affichage lisible SIRET (14 chiffres → groupes). */
export function formatSiretDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 14) return raw.trim();
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 14)}`;
}

export function getLegalIdentity() {
  const sirenRaw = envStr('VITE_LEGAL_SIREN') ?? INKFLOW_LEGAL_DEFAULTS.siren;
  const siretRaw = envStr('VITE_LEGAL_SIRET') ?? INKFLOW_LEGAL_DEFAULTS.siret;

  return {
    entrepreneurName:
      envStr('VITE_LEGAL_ENTREPRENEUR_NAME') ?? INKFLOW_LEGAL_DEFAULTS.entrepreneurName,
    legalForm: envStr('VITE_LEGAL_FORM') ?? INKFLOW_LEGAL_DEFAULTS.legalForm,
    tradeName: envStr('VITE_LEGAL_TRADE_NAME') ?? INKFLOW_LEGAL_DEFAULTS.tradeName,
    siren: formatSirenDisplay(sirenRaw),
    siret: formatSiretDisplay(siretRaw),
    siretRaw: siretRaw.replace(/\D/g, ''),
    rne: envStr('VITE_LEGAL_RNE') ?? INKFLOW_LEGAL_DEFAULTS.rne,
    ape: envStr('VITE_LEGAL_APE') ?? INKFLOW_LEGAL_DEFAULTS.ape,
    tva: envStr('VITE_LEGAL_TVA') ?? INKFLOW_LEGAL_DEFAULTS.tva,
    address: envStr('VITE_LEGAL_ADDRESS') ?? INKFLOW_LEGAL_DEFAULTS.address,
    director: envStr('VITE_LEGAL_DIRECTOR') ?? INKFLOW_LEGAL_DEFAULTS.director,
    contactEmail: INKFLOW_LEGAL_DEFAULTS.contactEmail,
    website: INKFLOW_LEGAL_DEFAULTS.website,
    hostingInfo: envStr('VITE_HOSTING_INFO') ?? INKFLOW_LEGAL_DEFAULTS.hostingInfo,
    /** Libellé court pour CGU / pied de page. */
    editorLabel: `${envStr('VITE_LEGAL_ENTREPRENEUR_NAME') ?? INKFLOW_LEGAL_DEFAULTS.entrepreneurName} — ${envStr('VITE_LEGAL_TRADE_NAME') ?? INKFLOW_LEGAL_DEFAULTS.tradeName}`,
  };
}
