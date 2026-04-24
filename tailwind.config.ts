import type { Config } from 'tailwindcss';

/** Design System aligné Framer (ink-flow.me) ↔ App (app.ink-flow.me) — voir docs/DESIGN_SYSTEM-FRAMER.md */
export default {
  content: ['**/*.tsx', '**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        display: ['var(--font-syne)', 'Syne', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        /* Framer-aligned dark premium */
        inkflow: {
          bg: '#000000',
          card: '#09090b',
          input: '#18181b',
          border: '#27272a',
          'border-light': '#3f3f46',
        },
        /* Aligner indigo sur la palette maquette InkFlow (violet / lavande) */
        indigo: {
          50: '#f5f0ff',
          100: '#ede9fe',
          200: '#e5e0ff',
          300: '#c9bff0',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6328d4',
          700: '#5220b8',
          800: '#4c1d95',
          900: '#3b1668',
          950: '#1e1535',
        },
        /** Accent marque — blue-600 + blanc (cf. index.css : --pro-accent) */
        pro: {
          accent: '#2563eb',
          'accent-fg': '#ffffff',
        },
      },
      borderRadius: {
        'inkflow-card': '1rem',
        'inkflow-btn': '9999px',
        /** Pro UI — mêmes rayons partout (éviter 9px, 10.5px, etc.) */
        'pro-btn': '8px',
        'pro-card': '12px',
        'pro-modal': '16px',
      },
      boxShadow: {
        /** Une seule ombre « produit » — préférer partout */
        pro: '0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.1)',
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
        /** Multiples de 4px — pas 13, 21, 27 */
        'pro-1': '4px',
        'pro-2': '8px',
        'pro-3': '12px',
        'pro-4': '16px',
        'pro-5': '24px',
        'pro-6': '32px',
        'pro-7': '48px',
      },
      fontWeight: {
        /** Préférer regular + medium seulement sur les écrans « pro » */
        'pro-regular': '400',
        'pro-medium': '500',
      },
    },
  },
} satisfies Config;
