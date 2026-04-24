/**
 * A few await retries for transient network / Postgrest failures (sans React Query).
 */
export function defaultIsRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';
  const m = msg.toLowerCase();
  return (
    m.includes('fetch') ||
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    code === 'PGRST301' ||
    code === 'PGRST116'
  );
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number; isRetryable?: (err: unknown) => boolean }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 400;
  const isRetryable = options?.isRetryable ?? defaultIsRetryableError;
  let last: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isRetryable(e) || i === maxAttempts - 1) {
        break;
      }
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
