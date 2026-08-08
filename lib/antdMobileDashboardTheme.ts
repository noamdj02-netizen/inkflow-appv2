/** Tokens Ant Design Mobile alignés sur le thème Vercel / Geist du dashboard InkFlow. */
export function getAntdMobileDashboardTheme(isDark: boolean): Record<string, string> {
  return {
    '--adm-color-primary': isDark ? '#ffffff' : '#171717',
    '--adm-color-success': '#10b981',
    '--adm-color-warning': '#f59e0b',
    '--adm-color-danger': '#ef4444',
    '--adm-color-text': isDark ? '#fafafa' : '#171717',
    '--adm-color-text-secondary': isDark ? '#a3a3a3' : '#737373',
    '--adm-color-weak': isDark ? '#525252' : '#a3a3a3',
    '--adm-color-light': isDark ? '#262626' : '#f5f5f5',
    '--adm-color-background': isDark ? '#000000' : '#fcfcfc',
    '--adm-color-border': isDark ? '#262626' : '#e5e5e5',
    '--adm-color-box': isDark ? '#0a0a0a' : '#ffffff',
    /** CapsuleTabs actif : texte contrasté sur pill primary (dark = pill blanche → texte zinc-900). */
    '--adm-color-text-light-solid': isDark ? '#171717' : '#ffffff',
    '--adm-color-fill-content': isDark ? '#262626' : '#f4f4f5',
    '--adm-font-size-main': '14px',
    '--adm-font-family':
      'var(--font-geist, "Geist Variable", system-ui, -apple-system, sans-serif)',
    '--adm-border-radius-s': '8px',
    '--adm-border-radius-m': '12px',
    '--adm-border-radius-l': '16px',
  };
}
