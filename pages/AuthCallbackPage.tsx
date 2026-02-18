import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';

export const AuthCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion en cours…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error') || params.get('error_code');
    const errorDesc = params.get('error_description');

    if (error) {
      setStatus('error');
      setMessage(decodeURIComponent(errorDesc || error));
      return;
    }

    setStatus('success');
    setMessage('Connexion réussie. Redirection…');
    const redirectUrl =
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)) || '/dashboard';
    try {
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    } catch {
      // ignore
    }
    const t = setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  const goLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="landing-scroll bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
        <div className="text-center">
          {status === 'loading' && <Loader2 className="animate-spin text-neutral-900 mx-auto mb-4" size={40} />}
          {status === 'success' && <CheckCircle className="text-green-600 mx-auto mb-4" size={44} />}
          {status === 'error' && <AlertCircle className="text-red-600 mx-auto mb-4" size={44} />}

          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {status === 'loading' ? 'Connexion' : status === 'success' ? 'Succès' : 'Erreur'}
          </h1>
          <p className="text-neutral-600">{message}</p>

          {status === 'error' && (
            <button
              type="button"
              onClick={goLogin}
              className="mt-6 w-full bg-neutral-900 text-white font-semibold py-3 rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
