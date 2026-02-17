import { useState, useEffect } from 'react';

const STORAGE_KEY = 'inkflow-theme';
const DEFAULT_THEME = 'light';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    return (localStorage.getItem(STORAGE_KEY) as Theme) || DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, setTheme, toggleTheme };
}

/** Initialize theme from localStorage on app load (call once in root, e.g. App.tsx) */
export function initTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}
