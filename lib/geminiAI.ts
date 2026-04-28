import { supabase, isSupabaseConfigured } from './supabase';
import { COMPARATOR_CATEGORY_OPTIONS } from './consumableCategories';

function getSupabaseConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, key };
}

/** Appel direct via fetch pour lire le message d'erreur réel en cas de non-2xx. Exige une session utilisateur (JWT). */
async function callGemini(
  prompt: string,
  options?: { imageBase64?: string; imageMimeType?: string; responseMimeType?: string }
): Promise<string> {
  if (!isSupabaseConfigured()) throw new Error('Gemini nécessite Supabase (clé API côté serveur).');

  const { url: baseUrl, key } = getSupabaseConfig();
  if (!baseUrl || !key) throw new Error('Supabase non configuré.');

  const {
    data: { session },
  } = await supabase.auth.getSession();
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
        : 'Impossible de contacter l’assistant pour le moment. Réessayez dans quelques instants.'
    );
  }

  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (res.ok) return data?.text ?? '';

  const msg = data?.error || `Erreur ${res.status}`;
  if (res.status === 401) {
    throw new Error(
      typeof msg === 'string' && msg.length > 0
        ? msg
        : 'Session expirée. Reconnectez-vous puis réessayez.'
    );
  }
  if (res.status === 429) {
    throw new Error(
      typeof msg === 'string' && msg.length > 0
        ? msg
        : 'Trop de requêtes. Réessayez dans une minute.'
    );
  }
  if (res.status === 500 && msg.toLowerCase().includes('not configured')) {
    throw new Error(
      'Gemini non configuré. Ajoutez GEMINI_API_KEY dans les secrets Supabase (Edge Function call-gemini).'
    );
  }
  if (res.status === 502) {
    throw new Error(msg);
  }
  if (res.status === 504) {
    throw new Error("Délai dépassé. L'image est peut-être trop volumineuse.");
  }
  if (res.status === 413) {
    throw new Error('Image trop volumineuse. Essayez une photo plus légère.');
  }
  throw new Error(msg);
}

export async function suggestPrice(
  description: string,
  placement: string,
  size: string
): Promise<string> {
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

export async function generateDescription(
  title: string,
  style: string,
  placement: string[]
): Promise<string> {
  const prompt = `Tu es un tatoueur professionnel qui écrit des descriptions pour son portfolio.
Génère une description courte et accrocheuse (2-3 phrases max) pour ce tatouage:

Titre: ${title}
Style: ${style}
Emplacements suggérés: ${placement.join(', ')}

Réponds en français, ton professionnel mais accessible.`;

  return callGemini(prompt);
}

export async function suggestResponse(
  clientName: string,
  projectDescription: string,
  placement: string,
  budget: string
): Promise<string> {
  const prompt = `Tu es un tatoueur professionnel qui répond à une demande de projet.
Génère une réponse professionnelle, chaleureuse et personnalisée pour ce client.

Client: ${clientName}
Projet: ${projectDescription}
Emplacement: ${placement || 'Non précisé'}
Budget: ${budget || 'Non précisé'}

Réponds en français en 4-5 lignes max. Commence par saluer le client par son prénom, montre de l'enthousiasme pour le projet, et propose de fixer un rendez-vous pour en discuter.`;

  return callGemini(prompt);
}

/**
 * Analyse comparative des tarifs fournisseurs (consommables) via Gemini.
 * S’appuie uniquement sur les lignes fournies (pas de prix marché inventés).
 */
export async function analyzeStockSupplierPrices(
  rows: {
    product: string;
    supplier: string;
    priceEur: number;
    packSize: number;
    eurPerUnit: number;
    isBest: boolean;
  }[]
): Promise<string> {
  if (rows.length === 0) {
    return 'Ajoute au moins un tarif produit/fournisseur pour lancer l’analyse.';
  }
  const lines = rows
    .slice(0, 42)
    .map(
      (r) =>
        `${r.product} | ${r.supplier} | ${r.priceEur.toFixed(2)} € (lot ${r.packSize}) | ${r.eurPerUnit.toFixed(4)} €/unité${r.isBest ? ' | meilleur €/u' : ''}`
    )
    .join('\n');

  const prompt = `Tu es un conseiller achats pour un studio de tatouage (consommables : hygiène, aiguilles, encres, etc.).

Données tarifaires internes (fournisseur réel, ne pas inventer d’autres enseignes ni de prix web) :
${lines}

Consignes :
1. Regroupe par produit : indique quelle ligne a le meilleur prix à l’unité (€/unité) et l’écart en % face à l’offre la plus chère pour CE produit.
2. Signale les écarts importants (>15 %) entre fournisseurs pour un même produit.
3. Propose 2 à 4 actions concrètes pour réduire les coûts (négociation, regroupement de commandes, vérifier conditionnement) sans compromettre l’hygiène obligatoire.
4. Si les libellés produits semblent trop vagues pour comparer, dis-le en une phrase.

Réponds en français, listes à puces courtes, ton pro. Maximum ~180 mots.`;

  return callGemini(prompt);
}

const CATALOG_IMPORT_MAX_CHARS = 14_000;

/** Brouillon d’import catalogue — uniquement depuis texte collé par l’utilisateur (pas de scraping). */
export interface CatalogImportDraftRow {
  name: string;
  brand: string | null;
  sku: string | null;
  ean: string | null;
  category: string;
  pack_size: number;
  list_price_eur: number | null;
  price_eur: number;
  promo_price_eur: number | null;
  promo_label: string | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  product_url: string | null;
  notes: string | null;
}

function nullableString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function nullableNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function isYyyyMmDd(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * Extraction structurée pour le catalogue fournisseur : le texte doit être fourni par le tatoueur
 * (copier-coller d’un export, e-mail, PDF converti en texte, etc.). Aucune recherche web.
 */
export async function suggestCatalogImportFromPastedContent(
  pastedText: string,
  supplierDisplayName: string
): Promise<CatalogImportDraftRow[]> {
  const raw = pastedText.trim();
  if (!raw) return [];
  if (raw.length > CATALOG_IMPORT_MAX_CHARS) {
    throw new Error(
      `Texte trop long (max. ${CATALOG_IMPORT_MAX_CHARS} caractères). Découpe en plusieurs imports.`
    );
  }

  const catSlugs = [...COMPARATOR_CATEGORY_OPTIONS.map((c) => c.slug), 'other'].join(', ');

  const instructions = `Tu es un assistant de saisie pour un professionnel du tatouage. Le texte ci-dessous a été COLLÉ VOLONTAIREMENT par l'utilisateur à partir de ses propres documents, exports tableur, e-mails ou factures — qu'il affirme avoir le droit d'utiliser.

RÈGLES STRICTES :
- NE PAS simuler de navigation web ni inventer des prix, promos ou URLs absents du texte.
- Extraire UNIQUEMENT des informations explicitement présentes dans le collage.
- Si une information manque : null (ou category "other", pack_size 1).
- category doit être exactement un de ces slugs : ${catSlugs}

Contexte fournisseur (pour t'aider à lire le tableau ; ne répète pas le nom dans chaque objet) : ${supplierDisplayName}

Pour chaque ligne produit / tarif identifiable, un objet JSON avec :
- name (string, requis)
- brand, sku, ean (string ou null)
- category (slug)
- pack_size (entier >= 1)
- list_price_eur (nombre ou null) = prix barré / conseillé / avant réduction si indiqué
- price_eur (nombre) = prix TTC catalogue ou actuel pour le conditionnement décrit
- promo_price_eur, promo_label, promo_starts_at, promo_ends_at (dates YYYY-MM-DD ou null)
- product_url (string URL complète ou null) UNIQUEMENT si une URL figure dans le texte
- notes (string ou null)

Réponds avec un UNIQUE tableau JSON, sans markdown ni commentaire. Max 80 objets. Si rien d'exploitable : [].`;

  const text = await callGemini(`${instructions}\n\n---\nTEXTE COLLÉ :\n${raw}`, {
    responseMimeType: 'application/json',
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      'Réponse IA illisible. Réessaie avec un extrait plus court ou des colonnes plus explicites (nom, prix).'
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Format inattendu renvoyé par l’IA.');
  }

  const allowed = new Set<string>([...COMPARATOR_CATEGORY_OPTIONS.map((c) => c.slug), 'other']);
  const out: CatalogImportDraftRow[] = [];

  for (const item of parsed.slice(0, 80)) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    if (!name) continue;

    let category = typeof o.category === 'string' ? o.category.trim() : 'other';
    if (!allowed.has(category)) category = 'other';

    const packRaw = Number(o.pack_size);
    const pack_size =
      Number.isFinite(packRaw) && packRaw >= 1 ? Math.min(10_000, Math.floor(packRaw)) : 1;

    const price_eur = nullableNumber(o.price_eur);
    if (price_eur == null) continue;

    const list_price_eur = nullableNumber(o.list_price_eur);
    const promo_price_eur = nullableNumber(o.promo_price_eur);

    let promo_starts_at = nullableString(o.promo_starts_at);
    let promo_ends_at = nullableString(o.promo_ends_at);
    if (promo_starts_at && !isYyyyMmDd(promo_starts_at)) promo_starts_at = null;
    if (promo_ends_at && !isYyyyMmDd(promo_ends_at)) promo_ends_at = null;

    let product_url = nullableString(o.product_url);
    if (product_url && !/^https?:\/\//i.test(product_url)) product_url = null;

    out.push({
      name,
      brand: nullableString(o.brand),
      sku: nullableString(o.sku),
      ean: nullableString(o.ean),
      category,
      pack_size,
      list_price_eur,
      price_eur,
      promo_price_eur,
      promo_label: nullableString(o.promo_label),
      promo_starts_at,
      promo_ends_at,
      product_url,
      notes: nullableString(o.notes),
    });
  }

  return out;
}

export async function analyzePortfolioImage(imageDescription: string): Promise<string[]> {
  const prompt = `Tu es un expert en tatouage. Basé sur cette description d'image de tatouage, génère 5-8 tags pertinents (style, technique, thème, emplacement).

Description: ${imageDescription}

Réponds avec uniquement les tags séparés par des virgules, sans numérotation.`;

  const result = await callGemini(prompt);
  return result
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const PORTFOLIO_CATEGORIES = [
  'Realisme',
  'Traditionnel',
  'Neo-traditionnel',
  'Japonais',
  'Minimaliste',
  'Geometrique',
  'Aquarelle',
  'Dotwork',
  'Lettering',
  'Autre',
];

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
    const parsed = JSON.parse(jsonStr) as {
      category?: string;
      description?: string;
      tags?: string | string[];
    };
    const category = PORTFOLIO_CATEGORIES.includes(parsed.category || '')
      ? parsed.category!
      : 'Autre';
    const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
    const tags =
      typeof parsed.tags === 'string'
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
