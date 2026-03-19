import { APP_URL } from './urls';

/** OG / Twitter exigent une URL absolue. */
export function toAbsoluteUrl(src: string | undefined | null, fallback: string): string {
  if (!src || !String(src).trim()) return fallback;
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${APP_URL.replace(/\/$/, '')}${path}`;
}
