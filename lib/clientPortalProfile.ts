/**
 * Profil espace client : photo persistée (Supabase Storage + inkflow_client_portal_profiles).
 * Prioritaire sur les URLs OAuth (user_metadata peu fiables).
 */
import { supabase } from './supabase';

const BUCKET = 'inkflow-assets';
const CLIENT_AVATAR_PREFIX = 'client-avatars';

export function clientAvatarStoragePath(userId: string, ext: 'jpg' | 'jpeg' | 'png' | 'webp'): string {
  const normalized = ext === 'jpeg' ? 'jpg' : ext;
  return `${CLIENT_AVATAR_PREFIX}/${userId}.${normalized}`;
}

export async function fetchPortalAvatarUrl(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('inkflow_client_portal_profiles')
    .select('portal_avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (import.meta.env.DEV) console.warn('[clientPortalProfile] fetch', error.message);
    return null;
  }
  return data?.portal_avatar_url?.trim() || null;
}

export function oauthAvatarFromUserMetadata(meta: Record<string, unknown> | undefined): string | null {
  if (!meta) return null;
  const a = meta.avatar_url;
  const p = meta.picture;
  if (typeof a === 'string' && a.trim()) return a.trim();
  if (typeof p === 'string' && p.trim()) return p.trim();
  return null;
}

/**
 * Photo à joindre à une demande de RDV (vitrine) : priorité profil portail, puis OAuth.
 * À appeler côté client connecté uniquement.
 */
export async function getCurrentClientAvatarUrlForBooking(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;
  const portal = await fetchPortalAvatarUrl(user.id);
  if (portal) return portal;
  return oauthAvatarFromUserMetadata(user.user_metadata as Record<string, unknown>);
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: string }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}

/** Message utilisateur lisible (RLS, table absente, réseau…). */
export function formatClientAvatarError(e: unknown): string {
  const m = errMsg(e).toLowerCase();
  if (m.includes('jwt') || m.includes('session') || m.includes('expired') || m.includes('401')) {
    return 'Session expirée. Reconnecte-toi puis réessaie.';
  }
  if (m.includes('row-level security') || m.includes('permission denied') || m.includes('42501') || m.includes('403')) {
    return 'Droits insuffisants ou session invalide. Déconnecte-toi et reconnecte-toi.';
  }
  if (m.includes('does not exist') || m.includes('42p01') || m.includes('relation')) {
    return 'Service photo indisponible (base à jour). Réessaie plus tard ou contacte le support.';
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch')) {
    return 'Problème réseau. Vérifie ta connexion.';
  }
  if (m.includes('image') || m.includes('blob') || m.includes('canvas')) {
    return 'Ce fichier image n’a pas pu être lu. Essaie JPG ou PNG.';
  }
  return 'Impossible d’enregistrer la photo.';
}

type WH = { w: number; h: number };

async function getBitmapOrImageDimensions(file: File): Promise<{ source: CanvasImageSource; cleanup: () => void; wh: WH }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file);
      return {
        source: bmp,
        cleanup: () => bmp.close(),
        wh: { w: bmp.width, h: bmp.height },
      };
    } catch {
      /* repli <img> */
    }
  }
  const img = document.createElement('img');
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image'));
      img.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new Error('image');
    return {
      source: img,
      cleanup: () => URL.revokeObjectURL(url),
      wh: { w, h },
    };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/**
 * Redimensionne en carré JPEG (cover), avec décodage robuste (createImageBitmap + repli img).
 * Limite la taille source pour éviter plantages mémoire sur très gros fichiers.
 */
export async function resizeImageFileToJpegBlob(
  file: File,
  sizePx = 400,
  quality = 0.88,
): Promise<Blob> {
  const { source, cleanup, wh } = await getBitmapOrImageDimensions(file);
  try {
    let sw = wh.w;
    let sh = wh.h;
    let drawSource: CanvasImageSource = source;

    const MAX_SRC = 4096;
    if (sw > MAX_SRC || sh > MAX_SRC) {
      const scale = Math.min(MAX_SRC / sw, MAX_SRC / sh);
      const tw = Math.max(1, Math.round(sw * scale));
      const th = Math.max(1, Math.round(sh * scale));
      const pre = document.createElement('canvas');
      pre.width = tw;
      pre.height = th;
      const pctx = pre.getContext('2d');
      if (!pctx) throw new Error('canvas');
      pctx.drawImage(source, 0, 0, tw, th);
      drawSource = pre;
      sw = tw;
      sh = th;
    }

    const canvas = document.createElement('canvas');
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');

    const scale = Math.max(sizePx / sw, sizePx / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    const ox = (sizePx - dw) / 2;
    const oy = (sizePx - dh) / 2;
    ctx.drawImage(drawSource, ox, oy, dw, dh);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', quality);
    });
    if (blob.size < 80) throw new Error('blob');
    return blob;
  } finally {
    cleanup();
  }
}

export async function uploadClientPortalAvatarJpeg(jpegBlob: Blob, userId: string): Promise<string> {
  const path = clientAvatarStoragePath(userId, 'jpg');
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, jpegBlob, { upsert: true, cacheControl: '3600', contentType: 'image/jpeg' });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const baseUrl = pub.publicUrl;

  const { error: dbErr } = await supabase.from('inkflow_client_portal_profiles').upsert(
    {
      user_id: userId,
      portal_avatar_url: baseUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw dbErr;
  }
  return `${baseUrl}?t=${Date.now()}`;
}

/** Si le redimensionnement échoue, envoie un JPEG déjà compatible tel quel (même chemin .jpg). */
export async function uploadClientPortalAvatarJpegWithFallback(file: File, userId: string): Promise<string> {
  const tryBlob = async (blob: Blob) => uploadClientPortalAvatarJpeg(blob, userId);

  try {
    const blob = await resizeImageFileToJpegBlob(file);
    return await tryBlob(blob);
  } catch (resizeErr) {
    const t = (file.type || '').toLowerCase();
    if (t === 'image/jpeg' || t === 'image/jpg') {
      if (file.size > 10 * 1024 * 1024) throw resizeErr;
      try {
        return await tryBlob(file);
      } catch (uploadErr) {
        throw uploadErr;
      }
    }
    throw resizeErr;
  }
}

export async function removeClientPortalAvatar(userId: string): Promise<void> {
  const pathJpg = clientAvatarStoragePath(userId, 'jpg');
  await supabase.storage.from(BUCKET).remove([pathJpg]);
  const { error } = await supabase.from('inkflow_client_portal_profiles').upsert(
    {
      user_id: userId,
      portal_avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

/** URL publique sans ?t= (pour RPC CRM). */
export function avatarUrlForCrm(url: string | null): string | null {
  if (!url?.trim()) return null;
  const s = url.trim();
  const q = s.indexOf('?');
  return q >= 0 ? s.slice(0, q) : s;
}

/** Met à jour les fiches `inkflow_clients` (tous studios) dont l’email = session. */
export async function syncClientCrmFromPortal(
  displayName: string,
  avatarPublicUrl: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('sync_client_crm_from_portal', {
    p_display_name: displayName,
    p_avatar_url: avatarPublicUrl,
  });
  if (error) throw error;
}

export async function trySyncClientCrmProfile(
  displayName: string,
  avatarDisplayUrl: string | null,
): Promise<void> {
  try {
    await syncClientCrmFromPortal(displayName, avatarUrlForCrm(avatarDisplayUrl));
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[trySyncClientCrmProfile]', e);
  }
}
