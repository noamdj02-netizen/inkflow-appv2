/**
 * Client Supabase pour l'app mobile (React Native / Expo).
 * Persistance de session via AsyncStorage pour garder l'utilisateur connecté.
 *
 * Configure EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans app.config.js ou .env.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL as string) || '';
export const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) || '';

function hasValidSupabaseUrl(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  if (raw.includes('xxxx.supabase.co')) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function hasValidSupabaseAnonKey(key: string): boolean {
  const raw = key.trim();
  if (!raw) return false;
  if (raw.includes('...')) return false;
  return raw.length > 40;
}

export function isSupabaseConfigured(): boolean {
  return hasValidSupabaseUrl(supabaseUrl) && hasValidSupabaseAnonKey(supabaseAnonKey);
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
