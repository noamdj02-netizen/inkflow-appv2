import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    ignores: [
      '.claude/**',
      '.cursor/**',
      'dist/**',
      'node_modules/**',
      'supabase/functions/**',
      'app/**',
      'inkflow-mobile/**',
      'mobile/**',
      'mon-app/**',
      'video/**',
      'claude-skills/**',
      '**/*.mjs',
      'scripts/**',
      'public/**',
      '.agents/**',
      'coverage/**',
      'apps/**',
      '_design_import/**',
      'test-results/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
    languageOptions: {
      ...react.configs.flat['jsx-runtime'].languageOptions,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'preserve-caught-error': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
  {
    files: ['.figma-logo-code.js'],
    languageOptions: {
      globals: {
        atob: 'readonly',
        figma: 'readonly',
        ...globals.node,
      },
    },
  },
  /** Handlers Vercel en .js (évite l’analyse TS « ColonToken » sur le build cloud). */
  {
    files: ['api/**/*.js', 'lib/vercelFounderAuth.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  eslintConfigPrettier,
);
