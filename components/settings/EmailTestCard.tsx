import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { testEmailConnection } from '../../lib/sendNotification';

interface EmailTestCardProps {
  userEmail: string | null | undefined;
}

/**
 * Carte Paramètres — vérifie Resend + secrets Supabase en un clic (email sur le compte connecté).
 */
export function EmailTestCard({ userEmail }: EmailTestCardProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!userEmail?.trim()) {
      toast.error('Aucun email sur ce compte.');
      return;
    }
    setLoading(true);
    try {
      const r = await testEmailConnection();
      if (r.ok) {
        toast.success(r.message);
      } else {
        toast.error(r.message);
        if (r.details) {
          console.error('[InkFlow] test email détail:', r.details);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white font-display tracking-tight">
          Test d’envoi email
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-2xl">
          Vérifie que Resend et les secrets Supabase (RESEND_API_KEY, RESEND_FROM_EMAIL) sont corrects. Un email de test
          est envoyé à <span className="text-zinc-700 dark:text-zinc-300">{userEmail || '—'}</span>.
        </p>
      </div>
      <div className="p-6">
        <button
          type="button"
          onClick={handleTest}
          disabled={loading || !userEmail}
          className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {loading ? 'Envoi…' : 'Envoyer un email de test'}
        </button>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-4">
          Si rien n’arrive : vérifiez le domaine d’expédition sur resend.com, les secrets du projet Supabase (pas seulement
          Vercel), et les spams.
        </p>
      </div>
    </div>
  );
}
