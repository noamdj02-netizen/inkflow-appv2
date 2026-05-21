import { supabase } from './supabase';
import { compressImageFileToWebP } from './imageResize';
import { invokeEdgeFunctionViaFetch } from './edgeFunctionInvoke';

const BUCKET = 'inkflow-assets';
const FOLDER = 'feedback-reports';
export const FEEDBACK_MAX_SCREENSHOTS = 5;
const MAX_BYTES = 5 * 1024 * 1024;

export type FeedbackType = 'bug' | 'idea' | 'question' | 'other';

export type FeedbackModule =
  | 'agenda'
  | 'demandes'
  | 'clients'
  | 'finance'
  | 'vitrine'
  | 'reservation'
  | 'parametres'
  | 'autre';

export interface SubmitProductFeedbackInput {
  type: FeedbackType;
  module: FeedbackModule;
  message: string;
  files: File[];
  pageUrl?: string;
}

export async function submitProductFeedback(
  input: SubmitProductFeedbackInput
): Promise<{ reportId: string }> {
  const message = input.message.trim();
  if (message.length < 10) {
    throw new Error('Décris le problème en au moins 10 caractères.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    throw new Error('Session expirée. Reconnecte-toi puis réessaie.');
  }

  const reportId = crypto.randomUUID();
  const screenshotPaths: string[] = [];

  for (let i = 0; i < Math.min(input.files.length, FEEDBACK_MAX_SCREENSHOTS); i++) {
    const file = input.files[i];
    if (file.size > MAX_BYTES) {
      throw new Error(`Capture trop lourde (max 5 Mo) : ${file.name}`);
    }
    const blob = await compressImageFileToWebP(file);
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${FOLDER}/${user.id}/${reportId}/${i}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });
    if (uploadError) {
      throw new Error(
        uploadError.message || "Impossible d'envoyer la capture. Réessaie ou envoie sans image."
      );
    }
    screenshotPaths.push(path);
  }

  const { data, error } = await invokeEdgeFunctionViaFetch('submit-product-feedback', {
    reportId,
    type: input.type,
    module: input.module,
    message,
    screenshotPaths,
    pageUrl: input.pageUrl ?? (typeof window !== 'undefined' ? window.location.href : undefined),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  });

  if (error) {
    const hint = /404|not found/i.test(error)
      ? ' Service indisponible — réessaie dans quelques minutes.'
      : '';
    throw new Error(`${error}${hint}`);
  }

  const payload = data as { ok?: boolean; reportId?: string; error?: string } | null;
  if (payload?.error) {
    throw new Error(payload.error);
  }

  return { reportId: payload?.reportId ?? reportId };
}
