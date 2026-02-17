import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Client Supabase typé (Database) pour autocomplétion et typage des réponses */
export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
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

export function getStudioId(userEmail: string, studioName: string): string {
  const slug = (studioName || userEmail)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') || 'default';
  return `${userEmail}::${slug}`;
}
