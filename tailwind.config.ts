import type { Config } from 'tailwindcss';

export default {
  content: ['**/*.tsx', '**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
      colors: {
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
    },
  },
} satisfies Config;
