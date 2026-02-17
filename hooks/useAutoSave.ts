import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  /** Debounce delay in ms. Default: 800. Set to 0 for immediate saves. */
  debounceMs?: number;
  /** If true, skips the initial save triggered by the first render. Default: true. */
  skipInitial?: boolean;
}

interface UseAutoSaveReturn {
  saving: boolean;
  saved: boolean;
  error: Error | null;
  /** Force an immediate save (e.g. for manual "Save" button clicks). */
  saveNow: () => void;
}

/**
 * Generic debounced auto-save hook.
 *
 * Watches `data` for changes and calls `saveFn` after a debounce period.
 * Provides `saving` / `saved` / `error` states for UI feedback.
 * Saves pending changes on unmount (cleanup).
 *
 * Usage:
 *   const { saving, saved, saveNow } = useAutoSave(settings, (s) => saveToSupabase(s));
 */
export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options?: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { debounceMs = 800, skipInitial = true } = options || {};

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const dirtyRef = useRef(false);
  const dataRef = useRef(data);
  const saveFnRef = useRef(saveFn);
  dataRef.current = data;
  saveFnRef.current = saveFn;

  const executeSave = useCallback(async (d: T) => {
    setSaving(true);
    setError(null);
    try {
      await saveFnRef.current(d);
      dirtyRef.current = false;
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      // Silent: do not set error (no UI/toast). Caller should use a try/catch inside saveFn for silent auto-save.
      console.warn('[useAutoSave] save failed (silent):', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleOrSave = useCallback((d: T, immediate: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dirtyRef.current = true;

    if (immediate || debounceMs === 0) {
      executeSave(d);
    } else {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        executeSave(d);
      }, debounceMs);
    }
  }, [debounceMs, executeSave]);

  // Watch data changes
  useEffect(() => {
    if (skipInitial && isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;
    scheduleOrSave(data, false);
  }, [data, scheduleOrSave, skipInitial]);

  // Cleanup: save pending on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (dirtyRef.current) {
        saveFnRef.current(dataRef.current).catch(console.error);
      }
    };
  }, []);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    executeSave(dataRef.current);
  }, [executeSave]);

  return { saving, saved, error, saveNow };
}
