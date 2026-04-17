import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { BookingFormData } from '../../types';

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void | Promise<void>;
  onCancel: () => void;
  preselectedFlash?: { id: string; title: string; price: number; depositAmount?: number };
  /** Dashboard : permet de saisir prix et acompte (sinon acompte fixe 50 € / flash). */
  studioManualMode?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  onCancel,
  preselectedFlash,
  studioManualMode = false,
}) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    tattooType: preselectedFlash ? 'flash' : 'custom',
    flashId: preselectedFlash?.id,
    description: preselectedFlash?.title
  });

  useEffect(() => {
    if (preselectedFlash) {
      setFormData(prev => ({ ...prev, tattooType: 'flash', flashId: preselectedFlash.id, description: preselectedFlash.title }));
    }
  }, [preselectedFlash]);

  useEffect(() => {
    if (!studioManualMode) return;
    const defaultDeposit = preselectedFlash
      ? (typeof preselectedFlash.depositAmount === 'number' && !Number.isNaN(preselectedFlash.depositAmount)
          ? preselectedFlash.depositAmount
          : Math.round(preselectedFlash.price * 0.3))
      : 0;
    const defaultPrice = preselectedFlash ? preselectedFlash.price : 0;
    setFormData((prev) => ({
      ...prev,
      price: defaultPrice,
      deposit: defaultDeposit,
      ...(!prev.location ? { location: 'other' as const } : {}),
      ...(!prev.size ? { size: 'medium' as const } : {}),
    }));
  }, [studioManualMode, preselectedFlash?.id, preselectedFlash?.price, preselectedFlash?.depositAmount]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => { if (step < 3) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const effectiveDepositAmount = (): number => {
    if (studioManualMode && typeof formData.deposit === 'number' && !Number.isNaN(formData.deposit)) {
      return Math.max(0, formData.deposit);
    }
    return calculateDeposit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const descRaw = formData.description?.trim() ?? '';
    const service =
      formData.tattooType === 'flash' && preselectedFlash
        ? preselectedFlash.title
        : (descRaw || (studioManualMode ? 'Projet sur mesure' : ''));
    const data = { ...formData, service, description: descRaw || (studioManualMode ? 'À préciser' : '') } as BookingFormData;
    if (studioManualMode) {
      const p = typeof formData.price === 'number' && !Number.isNaN(formData.price) ? Math.max(0, formData.price) : 0;
      const d =
        typeof formData.deposit === 'number' && !Number.isNaN(formData.deposit)
          ? Math.max(0, formData.deposit)
          : 0;
      data.price = p;
      data.deposit = d;
      if (d <= 0) {
        data.agreedToDeposit = true;
      }
    }
    if (!data.clientName?.trim() || !data.clientEmail?.trim()) {
      return;
    }
    if (!studioManualMode && !data.clientPhone?.trim()) {
      return;
    }
    if (!data.location || !data.size || !data.date || !data.time) {
      return;
    }
    const needDepositConsent = !studioManualMode || effectiveDepositAmount() > 0;
    if (needDepositConsent && !data.agreedToDeposit) {
      return;
    }
    setSubmitting(true);
    try {
      const result = onSubmit(data);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await (result as Promise<unknown>);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDeposit = (): number => {
    if (studioManualMode && typeof formData.deposit === 'number' && !Number.isNaN(formData.deposit)) {
      return Math.max(0, formData.deposit);
    }
    if (preselectedFlash) {
      if (typeof preselectedFlash.depositAmount === 'number' && !Number.isNaN(preselectedFlash.depositAmount)) {
        return preselectedFlash.depositAmount;
      }
      return Math.round(preselectedFlash.price * 0.3);
    }
    if (studioManualMode) {
      return 0;
    }
    return 50;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              s <= step ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-400'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-neutral-900' : 'bg-neutral-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Type de tatouage</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button type="button" onClick={() => updateFormData('tattooType', 'custom')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.tattooType === 'custom' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                }`}>
                <div className="text-3xl mb-3">🎨</div>
                <h4 className="font-bold text-lg mb-2">Design personnalisé</h4>
                <p className="text-sm text-neutral-600">Créez un tatouage unique avec notre artiste</p>
              </button>
              <button type="button" onClick={() => updateFormData('tattooType', 'flash')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.tattooType === 'flash' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                }`}
                disabled={!!preselectedFlash}>
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="font-bold text-lg mb-2">Flash</h4>
                <p className="text-sm text-neutral-600">Choisissez parmi nos designs prêts</p>
              </button>
            </div>
            {preselectedFlash && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white rounded-lg" />
                  <div>
                    <h4 className="font-bold">{preselectedFlash.title}</h4>
                    <p className="text-sm text-neutral-600">{preselectedFlash.price}€</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-2">
                <MapPin className="w-4 h-4 inline mr-2" aria-hidden />
                Emplacement
              </label>
              <select
                value={formData.location || ''}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              >
                <option value="">Choisir une zone…</option>
                <option value="arm">Bras</option>
                <option value="leg">Jambe</option>
                <option value="back">Dos</option>
                <option value="chest">Poitrine</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Taille estimée</label>
              <select
                value={formData.size || ''}
                onChange={(e) => updateFormData('size', e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              >
                <option value="">Choisir une taille…</option>
                <option value="small">Petit (5–10 cm)</option>
                <option value="medium">Moyen (10–20 cm)</option>
                <option value="large">Grand (20–30 cm)</option>
                <option value="extra_large">Très grand (30 cm+)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Description du projet
              {studioManualMode && (
                <span className="font-normal text-neutral-500 dark:text-neutral-400"> (facultatif)</span>
              )}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              className="w-full px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 min-h-[120px]"
              placeholder={studioManualMode ? 'Optionnel — ex. ligne fine, lettrage…' : 'Décrivez votre idée de tatouage…'}
              required={!studioManualMode && formData.tattooType !== 'flash'}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Vos informations</h3>
          <div>
            <label className="block text-sm font-semibold mb-2"><User className="w-4 h-4 inline mr-2" />Nom complet</label>
            <input type="text" value={formData.clientName || ''} onChange={(e) => updateFormData('clientName', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Jean Dupont" required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2"><Mail className="w-4 h-4 inline mr-2" />Email</label>
              <input type="email" value={formData.clientEmail || ''} onChange={(e) => updateFormData('clientEmail', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="jean@exemple.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Phone className="w-4 h-4 inline mr-2" aria-hidden />
                Téléphone
                {studioManualMode && (
                  <span className="font-normal text-neutral-500 dark:text-neutral-400"> (facultatif)</span>
                )}
              </label>
              <input
                type="tel"
                value={formData.clientPhone || ''}
                onChange={(e) => updateFormData('clientPhone', e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="+33 6 12 34 56 78"
                required={!studioManualMode}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Choisir un créneau</h3>
          {studioManualMode && (
            <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/40">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" aria-hidden />
                  Prix total estimé (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={formData.price === undefined || formData.price === null ? '' : formData.price}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateFormData('price', v === '' ? undefined : Math.max(0, parseFloat(v) || 0));
                  }}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" aria-hidden />
                  Acompte demandé (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={formData.deposit === undefined || formData.deposit === null ? '' : formData.deposit}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateFormData('deposit', v === '' ? undefined : Math.max(0, parseFloat(v) || 0));
                  }}
                  className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="0"
                />
              </div>
              <p className="md:col-span-2 text-xs text-neutral-500 dark:text-neutral-400">
                Mettez 0 € d&apos;acompte pour un proche ou un projet sans paiement anticipé.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold mb-2"><Calendar className="w-4 h-4 inline mr-2" aria-hidden />Date</label>
              <input type="date" value={formData.date || ''} onChange={(e) => updateFormData('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2"><Clock className="w-4 h-4 inline mr-2" aria-hidden />Heure</label>
              {studioManualMode ? (
                <input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              ) : (
                <select value={formData.time || ''} onChange={(e) => updateFormData('time', e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900" required>
                  <option value="">Sélectionner…</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              )}
            </div>
          </div>
          {effectiveDepositAmount() > 0 ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" aria-hidden />
                  <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Acompte requis</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Un acompte de <strong>{effectiveDepositAmount()}€</strong> sera requis pour confirmer votre réservation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="deposit-agree"
                  checked={formData.agreedToDeposit || false}
                  onChange={(e) => updateFormData('agreedToDeposit', e.target.checked)}
                  className="mt-1.5 h-5 w-5 shrink-0 rounded border-neutral-300"
                  required={effectiveDepositAmount() > 0}
                />
                <label htmlFor="deposit-agree" className="text-sm text-neutral-700 dark:text-neutral-300 py-2 -my-2 pl-1 cursor-pointer">
                  J&apos;accepte de payer l&apos;acompte de {effectiveDepositAmount()}€ pour confirmer ma réservation.
                </label>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/40 p-4">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <strong className="font-semibold">Sans acompte</strong> — adapté aux proches, amis ou projets internes. Vous pouvez ajouter un montant plus haut si besoin.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
        <button type="button" onClick={step === 1 ? onCancel : handleBack}
          className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:border-neutral-900 transition-colors">
          {step === 1 ? 'Annuler' : 'Précédent'}
        </button>
        {step < 3 ? (
          <button type="button" onClick={handleNext}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
            Suivant
          </button>
        ) : (
          <button type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {submitting ? 'Envoi en cours...' : 'Confirmer la réservation'}
          </button>
        )}
      </div>
    </form>
  );
};
