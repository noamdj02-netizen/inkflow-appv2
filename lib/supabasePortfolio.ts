/**
 * Upload des images portfolio vers Supabase Storage.
 * Path: portfolio/<slug>/<timestamp>_<index>.<ext>
 * Utilise le slug public (ex: mon-studio) pour éviter d'exposer l'email dans l'URL.
 */
import { supabase } from './supabase';

const BUCKET = 'inkflow-assets';
const FOLDER = 'portfolio';

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];

/** MIME valide pour Storage (évite `image/jpg`, rejeté par certains backends). */
function contentTypeForExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function uploadPortfolioImage(
  studioId: string,
  file: File | Blob,
  filename?: string,
  /** Slug public du studio (ex: mon-studio). Si fourni, utilisé pour le path au lieu de studioId. */
  studioSlug?: string | null
): Promise<string> {
  const ext = file instanceof File
    ? (file.name.split('.').pop()?.toLowerCase() || 'jpg')
    : 'jpg';
  const safeExt = ALLOWED_EXT.includes(ext) ? ext : 'jpg';
  const name = filename || `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  // Toujours utiliser un slug valide (a-z0-9-) : studioSlug ou partie après :: de studioId
  const slugFromId = studioId.includes('::') ? studioId.split('::')[1] : null;
  const pathSegment = (studioSlug && /^[a-z0-9-]+$/.test(studioSlug))
    ? studioSlug
    : (slugFromId && /^[a-z0-9-]+$/.test(slugFromId))
      ? slugFromId
      : studioId.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'portfolio';
  const path = `${FOLDER}/${pathSegment}/${name}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: contentTypeForExt(safeExt) });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

/** Convertit une data URL (base64) en Blob pour upload */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}
