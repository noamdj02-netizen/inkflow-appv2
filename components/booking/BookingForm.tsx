import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { BookingFormData } from '../../types';

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
  preselectedFlash?: { id: string; title: string; price: number };
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  onCancel,
  preselectedFlash
}) => {
  const [step, setStep] = useState(1);
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

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => { if (step < 3) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const service = formData.tattooType === 'flash' && preselectedFlash ? preselectedFlash.title : (formData.description || '');
    onSubmit({ ...formData, service } as BookingFormData);
  };

  const calculateDeposit = () => {
    if (preselectedFlash) return preselectedFlash.price * 0.3;
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
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2"><MapPin className="w-4 h-4 inline mr-2" />Emplacement</label>
              <select value={formData.location || ''} onChange={(e) => updateFormData('location', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900" required>
                <option value="">Sélectionner...</option>
                <option value="arm">Bras</option>
                <option value="leg">Jambe</option>
                <option value="back">Dos</option>
                <option value="chest">Poitrine</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Taille estimée</label>
              <select value={formData.size || ''} onChange={(e) => updateFormData('size', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900" required>
                <option value="">Sélectionner...</option>
                <option value="small">Petit (5-10cm)</option>
                <option value="medium">Moyen (10-20cm)</option>
                <option value="large">Grand (20-30cm)</option>
                <option value="extra_large">Très grand (30cm+)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description du projet</label>
            <textarea value={formData.description || ''} onChange={(e) => updateFormData('description', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 min-h-[120px]"
              placeholder="Décrivez votre idée de tatouage..." required={formData.tattooType !== 'flash'} />
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
              <label className="block text-sm font-semibold mb-2"><Phone className="w-4 h-4 inline mr-2" />Téléphone</label>
              <input type="tel" value={formData.clientPhone || ''} onChange={(e) => updateFormData('clientPhone', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="+33 6 12 34 56 78" required />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4">Choisir un créneau</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2"><Calendar className="w-4 h-4 inline mr-2" />Date</label>
              <input type="date" value={formData.date || ''} onChange={(e) => updateFormData('date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2"><Clock className="w-4 h-4 inline mr-2" />Heure</label>
              <select value={formData.time || ''} onChange={(e) => updateFormData('time', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900" required>
                <option value="">Sélectionner...</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
              </select>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-green-900 mb-1">Acompte requis</h4>
                <p className="text-sm text-green-700">
                  Un acompte de <strong>{calculateDeposit()}€</strong> sera requis pour confirmer votre réservation.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input type="checkbox" id="deposit-agree" checked={formData.agreedToDeposit || false}
              onChange={(e) => updateFormData('agreedToDeposit', e.target.checked)} className="mt-1 rounded border-neutral-300" required />
            <label htmlFor="deposit-agree" className="text-sm text-neutral-700">
              J'accepte de payer l'acompte de {calculateDeposit()}€ pour confirmer ma réservation.
            </label>
          </div>
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
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
            Confirmer la réservation
          </button>
        )}
      </div>
    </form>
  );
};
