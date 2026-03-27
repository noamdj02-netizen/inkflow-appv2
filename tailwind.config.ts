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
      },
      borderRadius: {
        'inkflow-card': '1rem',
        'inkflow-btn': '9999px',
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
      },
    },
  },
} satisfies Config;
