/**
 * Les demandes depuis la vitrine (`PublicStudioPagePro`) concatènent dans `description` :
 * `Sujet: …`, `Téléphone: …`, puis le message (souvent `\n\n`, parfois tout sur une ligne).
 */

/** Valeurs du `<select>` vitrine — clés stockées dans la chaîne « Sujet: » */
export const VITRINE_CONTACT_SUBJECT_LABELS: Record<string, string> = {
  quote: 'Demande de devis',
  appointment: 'Prise de rendez-vous',
  info: "Demande d'information",
  other: 'Autre',
};

export function labelForVitrineSubjectValue(value: string): string {
  const v = value.trim();
  if (!v) return '';
  const key = v.toLowerCase();
  return VITRINE_CONTACT_SUBJECT_LABELS[key] ?? v;
}

export interface ParsedVitrineProjectDescription {
  raw: string;
  subjectLabel: string;
  phone?: string;
  message: string;
}

function normalizePhoneDigits(s: string): string {
  return s.replace(/[\s.\u00A0-]/g, '');
}

/** Même ligne : numéro puis texte message */
const INLINE_TEL_MSG =
  /^((?:\+|00)\d[\d\s.\u00A0-]{6,}\d|0\d[\d\s.\u00A0-]{7,}\d)\s+(.+)$/is;
/** Ligne seule : uniquement le numéro */
const LINE_ONLY_TEL =
  /^((?:\+|00)\d[\d\s.\u00A0-]{6,}\d|0\d[\d\s.\u00A0-]{7,}\d)\s*$/i;

/**
 * Découpe une description projet vitrine pour l’affichage client (libellés clairs).
 */
export function parseVitrineProjectDescription(raw: string): ParsedVitrineProjectDescription {
  const text = (raw || '').trim();
  if (!text) {
    return { raw: '', subjectLabel: '', message: '' };
  }

  let rest = text;
  let subjectLabel = '';
  const sub = rest.match(/Sujet:\s*([^\n\r]+)/i);
  if (sub && sub.index !== undefined) {
    subjectLabel = labelForVitrineSubjectValue(sub[1].trim());
    rest = (rest.slice(0, sub.index) + rest.slice(sub.index + sub[0].length)).trim();
  }

  let phone: string | undefined;

  const telIdx = rest.search(/Téléphone:\s*/i);
  if (telIdx >= 0) {
    const beforeTel = rest.slice(0, telIdx);
    let after = rest.slice(telIdx).replace(/^Téléphone:\s*/i, '');
    const nl = after.search(/\r?\n/);

    if (nl >= 0) {
      phone = after.slice(0, nl).trim();
      rest = `${beforeTel}${after.slice(nl + 1)}`.trim();
    } else {
      const inline = after.match(INLINE_TEL_MSG);
      if (inline) {
        phone = normalizePhoneDigits(inline[1]);
        rest = `${beforeTel}${inline[2]}`.trim();
      } else {
        const onlyNum = after.match(LINE_ONLY_TEL);
        if (onlyNum) {
          phone = normalizePhoneDigits(onlyNum[1]);
          rest = beforeTel.trim();
        } else {
          phone = after.trim();
          rest = beforeTel.trim();
        }
      }
    }
  }

  const message = rest.replace(/^\s+|\s+$/g, '');

  return {
    raw: text,
    subjectLabel,
    phone,
    message: message || (!subjectLabel && !phone ? text : ''),
  };
}
