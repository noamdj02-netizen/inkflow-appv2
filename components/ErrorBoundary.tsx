import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    const props = (this as Component<Props, State>).props;
    const state = (this as Component<Props, State>).state;
    const setState = (this as Component<Props, State>).setState.bind(this);
    if (state.hasError) {
      if (props.fallback) return props.fallback;
      const errMsg = state.error?.message ?? '';
      const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl" aria-hidden>⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Une erreur s&apos;est produite</h1>
            <p className="text-neutral-600 text-sm mb-6">
              Le tableau de bord n&apos;a pas pu s&apos;afficher. Réessayez ou déconnectez-vous.
            </p>
            {isDev && errMsg && (
              <p className="text-left text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-500/20 p-3 rounded-lg mb-6 font-mono break-all">
                {errMsg}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setState({ hasError: false, error: null })}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800"
              >
                Réessayer
              </button>
              <a
                href="/login"
                className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Retour à la connexion
              </a>
            </div>
          </div>
        </div>
      );
    }
    return props.children;
  }
}
