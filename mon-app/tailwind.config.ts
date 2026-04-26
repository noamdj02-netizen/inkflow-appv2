import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /** Échelle fluide — mobile d’abord, max lisible sur desktop (cf. globals.css) */
        'ink-display': [
          'var(--text-ink-display)',
          {
            lineHeight: 'var(--leading-ink-display)',
            letterSpacing: 'var(--tracking-ink-tight)',
          },
        ],
        'ink-h1': [
          'var(--text-ink-h1)',
          {
            lineHeight: 'var(--leading-ink-h1)',
            letterSpacing: 'var(--tracking-ink-tight)',
          },
        ],
        'ink-h2': [
          'var(--text-ink-h2)',
          {
            lineHeight: 'var(--leading-ink-h2)',
            letterSpacing: 'var(--tracking-ink-tight)',
          },
        ],
        'ink-h3': [
          'var(--text-ink-h3)',
          {
            lineHeight: 'var(--leading-ink-h3)',
          },
        ],
        'ink-lead': [
          'var(--text-ink-lead)',
          { lineHeight: 'var(--leading-ink-lead)' },
        ],
        'ink-body': [
          'var(--text-ink-body)',
          { lineHeight: 'var(--leading-ink-body)' },
        ],
        'ink-caption': [
          'var(--text-ink-caption)',
          { lineHeight: 'var(--leading-ink-caption)' },
        ],
        'ink-detail': [
          'var(--text-ink-detail)',
          { lineHeight: 'var(--leading-ink-detail)' },
        ],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
