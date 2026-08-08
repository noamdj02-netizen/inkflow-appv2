import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');

/** Stockage pour la persistance de session. localStorage explicite pour PWA Safari (évite déconnexion à la fermeture). */
const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined;

/** Client Supabase typé (Database) pour autocomplétion et typage des réponses */
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
});

/** Vérifie si Supabase est configuré (URL + anon key présents) */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.length > 10);
}

/**
 * Teste la connectivité Supabase (utile pour détecter le mode hors-ligne).
 * À appeler avec try/catch : en cas d'échec réseau, la promesse rejette.
 */
export async function pingSupabase(): Promise<boolean> {
  const { error } = await supabase.from('inkflow_studios').select('id').limit(1).maybeSingle();
  if (error && (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'PGRST301')) {
    return false;
  }
  return true;
}

/** Extrait le ref projet depuis l’URL Supabase (`https://xxxx.supabase.co` → `xxxx`). */
export function getSupabaseProjectRefFromEnv(): string | null {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const m = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

/** Claim `ref` du JWT utilisateur (doit matcher le projet configuré dans .env). */
export function getProjectRefFromAccessToken(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad =
      base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const json = JSON.parse(atob(base64 + pad)) as { ref?: string };
    return typeof json.ref === 'string' ? json.ref.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** False si le JWT a été émis pour un autre projet que `VITE_SUPABASE_URL` (souvent après changement de .env sans déconnexion). */
export function isAccessTokenForCurrentSupabaseProject(accessToken: string): boolean {
  const envRef = getSupabaseProjectRefFromEnv();
  const jwtRef = getProjectRefFromAccessToken(accessToken);
  if (!envRef || !jwtRef) return true;
  return envRef === jwtRef;
}

export function getStudioId(userEmail: string, studioName: string): string {
  /** Aligné sur `ensureStudio` / BDD : l’id est toujours `email en minuscules::slug`. Sinon OAuth peut garder la casse et on cible une ligne inexistante (Stripe Connect, paiements, etc.). */
  const emailKey = (userEmail || '').trim().toLowerCase();
  const slug = (studioName || emailKey)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') || 'default';
  return `${emailKey}::${slug}`;
}
