import { supabase, isSupabaseConfigured } from './supabase';

function getSupabaseConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, key };
}

/** Appel direct via fetch pour lire le message d'erreur réel en cas de non-2xx. Exige une session utilisateur (JWT). */
async function callGemini(prompt: string, options?: { imageBase64?: string; imageMimeType?: string; responseMimeType?: string }): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error('Gemini nécessite Supabase (clé API côté serveur).');

  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) throw new Error('Supabase non configuré.');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Connectez-vous pour utiliser l’assistant IA.');
  }

  const body: Record<string, unknown> = { prompt };
  if (options?.imageBase64) body.imageBase64 = options.imageBase64;
  if (options?.imageMimeType) body.imageMimeType = options.imageMimeType;
  if (options?.responseMimeType) body.responseMimeType = options.responseMimeType;

  const fnUrl = `${baseUrl}/functions/v1/call-gemini`;
  let res: Response;
  try {
    res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: key,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const isNetwork =
      err instanceof TypeError || (err instanceof Error && err.message === 'Failed to fetch');
    throw new Error(
      isNetwork
        ? 'Connexion instable ou serveur injoignable. Vérifiez le réseau et réessayez.'
        : 'Impossible de contacter l’assistant pour le moment. Réessayez dans quelques instants.',
    );
  }

  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (res.ok) return data?.text ?? '';

  const msg = data?.error || `Erreur ${res.status}`;
  if (res.status === 401) {
    throw new Error(typeof msg === 'string' && msg.length > 0 ? msg : 'Session expirée. Reconnectez-vous puis réessayez.');
  }
  if (res.status === 429) {
    throw new Error(typeof msg === 'string' && msg.length > 0 ? msg : 'Trop de requêtes. Réessayez dans une minute.');
  }
  if (res.status === 500 && msg.toLowerCase().includes('not configured')) {
    throw new Error('Gemini non configuré. Ajoutez GEMINI_API_KEY dans les secrets Supabase (Edge Function call-gemini).');
  }
  if (res.status === 502) {
    throw new Error(msg);
  }
  if (res.status === 504) {
    throw new Error('Délai dépassé. L\'image est peut-être trop volumineuse.');
  }
  if (res.status === 413) {
    throw new Error('Image trop volumineuse. Essayez une photo plus légère.');
  }
  throw new Error(msg);
}

export async function suggestPrice(description: string, placement: string, size: string): Promise<string> {
  const prompt = `Tu es un expert en tarification de tatouages en France.
Basé sur les informations suivantes, suggère un prix en euros avec une fourchette réaliste (min-max) et une brève justification en 2-3 lignes.

Description: ${description}
Emplacement: ${placement}
Taille: ${size}

Réponds en français avec ce format exact:
Fourchette: [prix min]€ - [prix max]€
Justification: [ta justification ici]`;

  return callGemini(prompt);
}

export async function generateDescription(title: string, style: string, placement: string[]): Promise<string> {
  const prompt = `Tu es un tatoueur professionnel qui écrit des descriptions pour son portfolio.
Génère une description courte et accrocheuse (2-3 phrases max) pour ce tatouage:

Titre: ${title}
Style: ${style}
Emplacements suggérés: ${placement.join(', ')}

Réponds en français, ton professionnel mais accessible.`;

  return callGemini(prompt);
}

export async function suggestResponse(clientName: string, projectDescription: string, placement: string, budget: string): Promise<string> {
  const prompt = `Tu es un tatoueur professionnel qui répond à une demande de projet.
Génère une réponse professionnelle, chaleureuse et personnalisée pour ce client.

Client: ${clientName}
Projet: ${projectDescription}
Emplacement: ${placement || 'Non précisé'}
Budget: ${budget || 'Non précisé'}

Réponds en français en 4-5 lignes max. Commence par saluer le client par son prénom, montre de l'enthousiasme pour le projet, et propose de fixer un rendez-vous pour en discuter.`;

  return callGemini(prompt);
}

export async function analyzePortfolioImage(imageDescription: string): Promise<string[]> {
  const prompt = `Tu es un expert en tatouage. Basé sur cette description d'image de tatouage, génère 5-8 tags pertinents (style, technique, thème, emplacement).

Description: ${imageDescription}

Réponds avec uniquement les tags séparés par des virgules, sans numérotation.`;

  const result = await callGemini(prompt);
  return result.split(',').map(tag => tag.trim()).filter(Boolean);
}

const PORTFOLIO_CATEGORIES = ['Realisme', 'Traditionnel', 'Neo-traditionnel', 'Japonais', 'Minimaliste', 'Geometrique', 'Aquarelle', 'Dotwork', 'Lettering', 'Autre'];

export interface PortfolioAIAnalysis {
  category: string;
  description: string;
  tags: string;
}

const MAX_IMAGE_SIZE = 1024;
const JPEG_QUALITY = 0.8;

/** Réduit la taille de l'image pour éviter timeout et dépassement de quota. */
async function compressImageForAI(dataUrl: string): Promise<string> {
  if (typeof document === 'undefined' || !dataUrl.startsWith('data:image')) return dataUrl;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      if (w <= MAX_IMAGE_SIZE && h <= MAX_IMAGE_SIZE) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(MAX_IMAGE_SIZE / w, MAX_IMAGE_SIZE / h, 1);
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, cw, ch);
      try {
        const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Analyse une photo de tatouage et génère catégorie, description et tags.
 * Le tatoueur peut garder ou modifier les suggestions.
 */
export async function analyzePortfolioPhoto(imageDataUrl: string): Promise<PortfolioAIAnalysis> {
  const compressed = await compressImageForAI(imageDataUrl);
  const mimeMatch = compressed.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const base64 = compressed;

  const prompt = `Tu es un expert en tatouage professionnel. Analyse cette photo de tatouage et génère une fiche pour un portfolio.

Réponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour, avec exactement ces 3 clés:
- "category": une seule catégorie parmi: Realisme, Traditionnel, Neo-traditionnel, Japonais, Minimaliste, Geometrique, Aquarelle, Dotwork, Lettering, Autre
- "description": 1 à 2 phrases descriptives et accrocheuses en français (style, sujet, technique)
- "tags": 4 à 8 tags séparés par des virgules (ex: réalisme, noir et blanc, manchette, portrait, détaillé)`;

  const result = await callGemini(prompt, {
    imageBase64: base64,
    imageMimeType: mimeType,
  });

  try {
    let jsonStr = result.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr) as { category?: string; description?: string; tags?: string | string[] };
    const category = PORTFOLIO_CATEGORIES.includes(parsed.category || '') ? parsed.category! : 'Autre';
    const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
    const tags = typeof parsed.tags === 'string'
      ? parsed.tags.trim()
      : Array.isArray(parsed.tags)
        ? (parsed.tags as string[]).join(', ')
        : '';
    return { category, description, tags };
  } catch {
    return { category: 'Autre', description: '', tags: '' };
  }
}

/** Gemini est disponible via l'Edge Function lorsque Supabase est configuré. */
export function isGeminiConfigured(): boolean {
  return isSupabaseConfigured();
}
