/**
 * Hook centralisé pour vérifier si Supabase est configuré.
 * Évite la duplication dans AuthContext, VitrineLinkButton, etc.
 */
export function useSupabaseEnabled(): boolean {
  const url = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL;
  const key = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY;
  const urlStr = typeof url === 'string' ? url : '';
  return !!(urlStr && key && urlStr.length > 10);
}
