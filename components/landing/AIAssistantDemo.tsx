import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

/** Version démo de l’assistant IA : formulaire pré-rempli, estimation factice au clic (sans API). */
export const AIAssistantDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const description = "Tigre réaliste sur l'avant-bras";
  const placement = 'Avant-bras';
  const size = '~15 cm';

  const handleEstimate = () => {
    setLoading(true);
    setResult('');
    setTimeout(() => {
      setResult(
        'Estimation : 350€ – 450€ selon détails et finitions. Durée estimée : 2h–2h30. L’IA prend en compte le placement, la taille et le style pour vous proposer une fourchette cohérente.'
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Assistant IA</h3>
          <p className="text-neutral-500 text-sm">Pricing propulsé par l’IA</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-neutral-200 flex-1 flex flex-col min-h-0">
        <h4 className="font-semibold text-sm mb-3">Estimation de prix (démo)</h4>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-neutral-500 block mb-1">Description</label>
            <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800">
              {description}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-neutral-500 block mb-1">Emplacement</label>
              <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800">
                {placement}
              </div>
            </div>
            <div>
              <label className="text-neutral-500 block mb-1">Taille</label>
              <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800">
                {size}
              </div>
            </div>
          </div>
          <button
            onClick={handleEstimate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Estimer le prix
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-zinc-50 rounded-xl border border-blue-200 dark:border-blue-500/30 flex-1 min-h-0 overflow-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Résultat IA
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-neutral-800 leading-relaxed">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
};
