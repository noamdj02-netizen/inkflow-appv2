/**
 * Questionnaire de Santé obligatoire avant paiement
 * Design cohérent avec le tunnel de réservation (épuré, blanc, zinc)
 */
import { useState, useMemo, type FC, type FormEvent } from 'react';
import { AlertTriangle, Check, ChevronLeft, Heart } from 'lucide-react';

export interface HealthFormData {
  clientName: string;
  clientBirthdate: string;
  clientInstagram: string;

  allergies: boolean | null;
  allergiesDetails: string;
  grossesse: boolean | null;
  allaitement: boolean | null;
  maladiesInfectieuses: boolean | null;
  infectionsVirales: boolean | null;
  troubleCicatriciel: boolean | null;
  diabete: boolean | null;
  antibiotiques: boolean | null;
  antiInflammatoires: boolean | null;
  steroides: boolean | null;

  certifiedAccurate: boolean;
  signatureText: string;
}

interface HealthQuestionnaireFormProps {
  initialData?: Partial<HealthFormData>;
  onComplete: (data: HealthFormData) => void;
  onBack?: () => void;
  clientName?: string;
  clientEmail?: string;
}

const INITIAL_STATE: HealthFormData = {
  clientName: '',
  clientBirthdate: '',
  clientInstagram: '',
  allergies: null,
  allergiesDetails: '',
  grossesse: null,
  allaitement: null,
  maladiesInfectieuses: null,
  infectionsVirales: null,
  troubleCicatriciel: null,
  diabete: null,
  antibiotiques: null,
  antiInflammatoires: null,
  steroides: null,
  certifiedAccurate: false,
  signatureText: '',
};

interface YesNoFieldProps {
  label: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
  required?: boolean;
}

const YesNoField: FC<YesNoFieldProps> = ({
  label,
  value,
  onChange,
  required: _required = true,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-zinc-100 last:border-0 gap-2 sm:gap-4">
    <span className="text-sm text-zinc-700 font-medium">{label}</span>
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 sm:flex-none min-w-[60px] min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] touch-manipulation ${
          value === true ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
        }`}
      >
        Oui
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 sm:flex-none min-w-[60px] min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] touch-manipulation ${
          value === false ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
        }`}
      >
        Non
      </button>
    </div>
  </div>
);

export const HealthQuestionnaireForm: FC<HealthQuestionnaireFormProps> = ({
  initialData,
  onComplete,
  onBack,
  clientName = '',
}) => {
  const [form, setForm] = useState<HealthFormData>({
    ...INITIAL_STATE,
    clientName,
    ...initialData,
  });

  const update = <K extends keyof HealthFormData>(key: K, value: HealthFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isComplete = useMemo(() => {
    const requiredBooleans: (keyof HealthFormData)[] = [
      'allergies',
      'grossesse',
      'allaitement',
      'maladiesInfectieuses',
      'infectionsVirales',
      'troubleCicatriciel',
      'diabete',
      'antibiotiques',
      'antiInflammatoires',
      'steroides',
    ];

    for (const key of requiredBooleans) {
      if (form[key] === null) return false;
    }

    if (form.allergies && !form.allergiesDetails.trim()) return false;
    if (!form.certifiedAccurate) return false;
    if (!form.signatureText.trim()) return false;
    if (!form.clientName.trim()) return false;
    if (!form.clientBirthdate) return false;

    return true;
  }, [form]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    onComplete(form);
  };

  const answeredCount = useMemo(() => {
    const fields: (keyof HealthFormData)[] = [
      'allergies',
      'grossesse',
      'allaitement',
      'maladiesInfectieuses',
      'infectionsVirales',
      'troubleCicatriciel',
      'diabete',
      'antibiotiques',
      'antiInflammatoires',
      'steroides',
    ];
    return fields.filter((f) => form[f] !== null).length;
  }, [form]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto px-1">
      {/* Header */}
      <div className="bg-white rounded-t-2xl border border-zinc-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">Questionnaire de santé</h2>
            <p className="text-xs text-zinc-500">Obligatoire avant le paiement</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-zinc-500 tabular-nums">{answeredCount}/10</span>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white border-x border-zinc-200 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Vos informations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Prénom</label>
            <input
              type="text"
              value={form.clientName.split(' ')[0] || ''}
              onChange={(e) => {
                const lastName = form.clientName.split(' ').slice(1).join(' ') || '';
                update('clientName', `${e.target.value} ${lastName}`.trim());
              }}
              placeholder="Jean"
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-base"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nom</label>
            <input
              type="text"
              value={form.clientName.split(' ').slice(1).join(' ') || ''}
              onChange={(e) => {
                const firstName = form.clientName.split(' ')[0] || '';
                update('clientName', `${firstName} ${e.target.value}`.trim());
              }}
              placeholder="Dupont"
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-base"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Date de naissance
          </label>
          <input
            type="date"
            value={form.clientBirthdate}
            onChange={(e) => update('clientBirthdate', e.target.value)}
            className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-base"
            required
          />
        </div>
      </div>

      {/* Questions de santé */}
      <div className="bg-white border-x border-zinc-200 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3">Questions de santé</h3>
        <div className="space-y-0">
          <YesNoField
            label="Allergies connues"
            value={form.allergies}
            onChange={(v) => update('allergies', v)}
          />
          {form.allergies && (
            <div className="py-3 border-b border-zinc-100">
              <input
                type="text"
                value={form.allergiesDetails}
                onChange={(e) => update('allergiesDetails', e.target.value)}
                placeholder="Précisez vos allergies..."
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-base bg-zinc-50"
                required
              />
            </div>
          )}
          <YesNoField
            label="Grossesse en cours"
            value={form.grossesse}
            onChange={(v) => update('grossesse', v)}
          />
          <YesNoField
            label="Allaitement"
            value={form.allaitement}
            onChange={(v) => update('allaitement', v)}
          />
          <YesNoField
            label="Maladies infectieuses ou bactériennes"
            value={form.maladiesInfectieuses}
            onChange={(v) => update('maladiesInfectieuses', v)}
          />
          <YesNoField
            label="Infections virales"
            value={form.infectionsVirales}
            onChange={(v) => update('infectionsVirales', v)}
          />
          <YesNoField
            label="Trouble cicatriciel"
            value={form.troubleCicatriciel}
            onChange={(v) => update('troubleCicatriciel', v)}
          />
          <YesNoField label="Diabète" value={form.diabete} onChange={(v) => update('diabete', v)} />
          <YesNoField
            label="Prise d'antibiotiques"
            value={form.antibiotiques}
            onChange={(v) => update('antibiotiques', v)}
          />
          <YesNoField
            label="Anti-inflammatoires"
            value={form.antiInflammatoires}
            onChange={(v) => update('antiInflammatoires', v)}
          />
          <YesNoField
            label="Stéroïdes"
            value={form.steroides}
            onChange={(v) => update('steroides', v)}
          />
        </div>
      </div>

      {/* Avertissements */}
      {(form.diabete || form.maladiesInfectieuses || form.infectionsVirales) && (
        <div className="bg-amber-50 border-x border-amber-200 px-4 sm:px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1">
              {form.diabete && <p>Diabète : cicatrisation potentiellement plus lente</p>}
              {form.maladiesInfectieuses && <p>Maladie infectieuse : validité médicale requise</p>}
              {form.infectionsVirales && (
                <p>Infection virale : consultation médicale recommandée</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certification et signature */}
      <div className="bg-white border-x border-b border-zinc-200 rounded-b-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <input
            type="checkbox"
            id="certify"
            checked={form.certifiedAccurate}
            onChange={(e) => update('certifiedAccurate', e.target.checked)}
            className="mt-0.5 w-6 h-6 min-w-[24px] accent-zinc-900 rounded cursor-pointer"
            required
          />
          <label htmlFor="certify" className="text-sm text-zinc-600 leading-relaxed cursor-pointer">
            Je certifie sur l'honneur que les informations ci-dessus sont exactes. Je comprends
            qu'une omission pourrait compromettre ma sécurité.
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Signature (tapez votre nom complet)
          </label>
          <input
            type="text"
            value={form.signatureText}
            onChange={(e) => update('signatureText', e.target.value)}
            placeholder="Votre nom complet"
            className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-base font-medium italic"
            required
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 min-h-[52px] px-5 py-3.5 rounded-xl border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-50 transition-colors active:scale-[0.98] touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
        )}
        <button
          type="submit"
          disabled={!isComplete}
          className={`flex-1 min-h-[56px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] touch-manipulation ${
            isComplete
              ? 'bg-zinc-900 text-white hover:bg-zinc-800'
              : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5" />
          Valider et continuer
        </button>
      </div>

      {!isComplete && (
        <p className="text-center text-xs text-zinc-500 mt-3 pb-4">
          Répondez à toutes les questions et signez pour continuer
        </p>
      )}
    </form>
  );
};
