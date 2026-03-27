/**
 * Questionnaire de Santé obligatoire avant paiement
 * Design inspiré papier/vintage pour garder l'authenticité du studio
 */
import React, { useState, useMemo } from 'react';
import { AlertTriangle, Check, FileText, Pen } from 'lucide-react';

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

const YesNoField: React.FC<YesNoFieldProps> = ({ label, value, onChange, required = true }) => (
  <div className="flex items-center justify-between py-2 border-b border-dashed border-stone-300/60">
    <span className="text-sm text-stone-800 font-medium tracking-wide uppercase" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      {label}
    </span>
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="radio"
          name={label}
          checked={value === true}
          onChange={() => onChange(true)}
          className="w-4 h-4 accent-stone-800"
          required={required && value === null}
        />
        <span className="text-xs font-semibold text-stone-700">OUI</span>
        <span className="text-amber-500 text-xs">★</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="radio"
          name={label}
          checked={value === false}
          onChange={() => onChange(false)}
          className="w-4 h-4 accent-stone-800"
          required={required && value === null}
        />
        <span className="text-xs font-semibold text-stone-700">NON</span>
        <span className="text-amber-500 text-xs">★</span>
      </label>
    </div>
  </div>
);

export const HealthQuestionnaireForm: React.FC<HealthQuestionnaireFormProps> = ({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    onComplete(form);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 31px,
              rgba(120, 100, 80, 0.08) 31px,
              rgba(120, 100, 80, 0.08) 32px
            ),
            linear-gradient(135deg, #f5f0e8 0%, #ebe5da 50%, #e8e2d6 100%)
          `,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        {/* Effet texture papier */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Header */}
        <div className="relative px-5 pt-6 pb-4 border-b-2 border-stone-400/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-stone-600" strokeWidth={1.5} />
          </div>
          <h2
            className="text-center text-2xl font-black text-stone-900 tracking-tight"
            style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.02em' }}
          >
            QUESTIONNAIRE
          </h2>
          <h3
            className="text-center text-xl font-black text-stone-900"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            DE SANTÉ
          </h3>
        </div>

        {/* Contenu */}
        <div className="relative px-5 py-5 space-y-4">
          {/* Informations personnelles */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Nom</label>
                <input
                  type="text"
                  value={form.clientName.split(' ')[1] || form.clientName}
                  onChange={(e) => {
                    const firstName = form.clientName.split(' ')[0] || '';
                    update('clientName', `${firstName} ${e.target.value}`.trim());
                  }}
                  placeholder="....................."
                  className="w-full bg-transparent border-b-2 border-dotted border-stone-400 px-1 py-1.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-600"
                  style={{ fontFamily: "'Courier New', monospace" }}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Prénom</label>
                <input
                  type="text"
                  value={form.clientName.split(' ')[0] || ''}
                  onChange={(e) => {
                    const lastName = form.clientName.split(' ').slice(1).join(' ') || '';
                    update('clientName', `${e.target.value} ${lastName}`.trim());
                  }}
                  placeholder="....................."
                  className="w-full bg-transparent border-b-2 border-dotted border-stone-400 px-1 py-1.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-600"
                  style={{ fontFamily: "'Courier New', monospace" }}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Date de naissance</label>
              <input
                type="date"
                value={form.clientBirthdate}
                onChange={(e) => update('clientBirthdate', e.target.value)}
                className="w-full bg-transparent border-b-2 border-dotted border-stone-400 px-1 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-stone-600"
                style={{ fontFamily: "'Courier New', monospace" }}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Instagram</label>
              <input
                type="text"
                value={form.clientInstagram}
                onChange={(e) => update('clientInstagram', e.target.value)}
                placeholder="@....................."
                className="w-full bg-transparent border-b-2 border-dotted border-stone-400 px-1 py-1.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-600"
                style={{ fontFamily: "'Courier New', monospace" }}
              />
            </div>
          </div>

          {/* Section gauche : Allergies, Maladies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-4">
            <div className="space-y-1">
              <YesNoField label="Allergies" value={form.allergies} onChange={(v) => update('allergies', v)} />
              {form.allergies && (
                <div className="pl-2 pb-2">
                  <input
                    type="text"
                    value={form.allergiesDetails}
                    onChange={(e) => update('allergiesDetails', e.target.value)}
                    placeholder="Si oui : ........................"
                    className="w-full bg-transparent border-b border-dotted border-stone-400 px-1 py-1 text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none"
                    style={{ fontFamily: "'Courier New', monospace" }}
                    required
                  />
                </div>
              )}
              
              <YesNoField label="Maladies infectieuses & bactériennes" value={form.maladiesInfectieuses} onChange={(v) => update('maladiesInfectieuses', v)} />
              <YesNoField label="Infections virales" value={form.infectionsVirales} onChange={(v) => update('infectionsVirales', v)} />
              <YesNoField label="Trouble cicatriciel" value={form.troubleCicatriciel} onChange={(v) => update('troubleCicatriciel', v)} />
            </div>
            
            <div className="space-y-1">
              <YesNoField label="Grossesse" value={form.grossesse} onChange={(v) => update('grossesse', v)} />
              <YesNoField label="Allaitement" value={form.allaitement} onChange={(v) => update('allaitement', v)} />
              <YesNoField label="Antibiotiques" value={form.antibiotiques} onChange={(v) => update('antibiotiques', v)} />
              <YesNoField label="Anti-inflammatoires" value={form.antiInflammatoires} onChange={(v) => update('antiInflammatoires', v)} />
              <YesNoField label="Stéroïdes" value={form.steroides} onChange={(v) => update('steroides', v)} />
            </div>
          </div>

          {/* Diabète séparé avec mention spéciale */}
          <div className="pt-2">
            <YesNoField label="Diabète" value={form.diabete} onChange={(v) => update('diabete', v)} />
          </div>

          {/* Avertissements */}
          <div className="mt-4 p-3 bg-stone-200/50 rounded-lg border border-stone-300/50">
            <div className="flex items-start gap-2 text-xs text-stone-600" style={{ fontFamily: "'Courier New', monospace" }}>
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>SI DIABÈTE = CICATRISATION LENTE</p>
                <p>SI MALADIE INFECTIEUSE → VALIDITÉ MÉDICALE</p>
                <p>SI MALADIE LIÉE AU SANG → VALIDITÉ MÉDICALE</p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-6 pt-4 border-t-2 border-stone-300/50">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="certify"
                checked={form.certifiedAccurate}
                onChange={(e) => update('certifiedAccurate', e.target.checked)}
                className="mt-1 w-5 h-5 accent-stone-800 rounded"
                required
              />
              <label htmlFor="certify" className="text-xs text-stone-700 leading-relaxed">
                Je certifie sur l'honneur que les informations fournies ci-dessus sont exactes et complètes. 
                Je comprends que toute omission ou fausse déclaration pourrait compromettre ma sécurité.
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                <Pen className="w-3.5 h-3.5" />
                Signature (tapez votre nom complet)
              </label>
              <input
                type="text"
                value={form.signatureText}
                onChange={(e) => update('signatureText', e.target.value)}
                placeholder="Votre signature ici..."
                className="w-full bg-white/50 border-2 border-stone-300 rounded-lg px-4 py-3 text-lg text-stone-800 focus:outline-none focus:border-stone-600 focus:ring-2 focus:ring-stone-200"
                style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontStyle: 'italic' }}
                required
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="relative px-5 py-4 border-t border-stone-300/50 bg-stone-100/30">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 h-12 rounded-xl border-2 border-stone-300 text-stone-700 font-semibold hover:bg-stone-200/50 transition-colors active:scale-[0.98]"
              >
                Retour
              </button>
            )}
            <button
              type="submit"
              disabled={!isComplete}
              className={`flex-1 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isComplete
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 h-5" />
              Valider le questionnaire
            </button>
          </div>
          {!isComplete && (
            <p className="text-center text-xs text-amber-600 mt-2">
              Veuillez répondre à toutes les questions et signer
            </p>
          )}
        </div>
      </div>
    </form>
  );
};
