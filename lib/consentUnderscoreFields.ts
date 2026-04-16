/**
 * Découpe un modèle de consentement : champs soulignés (4+ « _ ») et cases ☐ / ☑ / ☒.
 */

/** Cases à cocher Unicode (ballot box empty / checked). */
const CHECKBOX_CHARS = /[\u2610\u2611\u2612]/gu;

function splitUnderscoresInChunk(
  chunk: string,
  parts: ConsentInteractiveSegment[],
  fieldIndex: { n: number }
): void {
  if (chunk === '') return;
  let last = 0;
  const re = /_{4,}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'text', value: chunk.slice(last, m.index) });
    }
    const len = m[0].length;
    const widthCh = Math.min(42, Math.max(4, Math.round(len * 0.55)));
    parts.push({ type: 'field', fieldIndex: fieldIndex.n++, widthCh });
    last = m.index + m[0].length;
  }
  if (last < chunk.length) {
    parts.push({ type: 'text', value: chunk.slice(last) });
  }
}

export type ConsentInteractiveSegment =
  | { type: 'text'; value: string }
  | { type: 'field'; fieldIndex: number; widthCh: number }
  | { type: 'checkbox'; checkIndex: number; initialChecked: boolean };

export function parseConsentInteractive(template: string): ConsentInteractiveSegment[] {
  const parts: ConsentInteractiveSegment[] = [];
  const fieldIndex = { n: 0 };
  let checkIndex = 0;
  let last = 0;
  const re = new RegExp(CHECKBOX_CHARS.source, 'gu');
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    splitUnderscoresInChunk(template.slice(last, match.index), parts, fieldIndex);
    const ch = match[0];
    const initialChecked = ch === '\u2611' || ch === '\u2612';
    parts.push({ type: 'checkbox', checkIndex: checkIndex++, initialChecked });
    last = match.index + ch.length;
  }
  splitUnderscoresInChunk(template.slice(last), parts, fieldIndex);
  return parts;
}

/** @deprecated Utiliser parseConsentInteractive */
export function parseConsentUnderscoreFields(template: string): ConsentInteractiveSegment[] {
  return parseConsentInteractive(template);
}

export function countConsentFields(segments: ConsentInteractiveSegment[]): number {
  return segments.filter(s => s.type === 'field').length;
}

export function countConsentCheckboxes(segments: ConsentInteractiveSegment[]): number {
  return segments.filter(s => s.type === 'checkbox').length;
}

/** Texte archivable : texte + champs + ☑ ou ☐ selon l’état des cases. */
export function buildFilledConsentText(
  segments: ConsentInteractiveSegment[],
  fieldValues: string[],
  checkValues: boolean[]
): string {
  return segments
    .map(s => {
      if (s.type === 'text') return s.value;
      if (s.type === 'field') return fieldValues[s.fieldIndex] ?? '';
      return checkValues[s.checkIndex] ? '\u2611' : '\u2610';
    })
    .join('');
}
