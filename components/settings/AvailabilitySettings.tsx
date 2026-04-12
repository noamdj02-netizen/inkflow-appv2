import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, Calendar, AlertCircle, Timer, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AvailabilitySettingsProps {
  studioId?: string | null;
  onSave?: (settings: unknown) => void;
}

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
  breaks: { start: string; end: string }[];
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const DEFAULT_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  tuesday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  wednesday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  thursday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  friday: { enabled: true, open: '10:00', close: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
  saturday: { enabled: true, open: '11:00', close: '20:00', breaks: [] },
  sunday: { enabled: false, open: '10:00', close: '19:00', breaks: [] }
};

export const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({ studioId, onSave }) => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);

  const [bookingSettings, setBookingSettings] = useState({
    slotDuration: 60,       // durée créneau en minutes
    bufferTime: 15,         // pause entre 2 clients en minutes
    overrunMargin: 0,       // marge de sécurité pour pièces complexes
    advanceBooking: 7,      // délai min de réservation en jours
    maxDailyBookings: 8,
    requireDeposit: true,
    depositPercentage: 30,
    bookingWindowDays: 60,
  });

  const [closedDates, setClosedDates] = useState<string[]>(['2024-12-25', '2024-01-01']);
  const [newClosedDate, setNewClosedDate] = useState('');

  // Créneaux fixes personnalisés (vide = on utilise les slots par défaut)
  const [customSlots, setCustomSlots] = useState<string[]>(['10:30', '14:00', '15:30', '17:00']);
  const [newSlot, setNewSlot] = useState('');

  // Périodes bloquées (ex : agenda déjà rempli jusqu'en mai)
  interface BlockedRange { start: string; end: string; label: string }
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [newRange, setNewRange] = useState<BlockedRange>({ start: '', end: '', label: '' });

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  const updateDay = (day: string, field: string, value: unknown) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const addBreak = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        breaks: [...prev[day as keyof typeof prev].breaks, { start: '13:00', end: '14:00' }]
      }
    }));
  };

  const removeBreak = (day: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        breaks: prev[day as keyof typeof prev].breaks.filter((_, i) => i !== index)
      }
    }));
  };

  const addClosedDate = () => {
    if (newClosedDate && !closedDates.includes(newClosedDate)) {
      setClosedDates([...closedDates, newClosedDate]);
      setNewClosedDate('');
    }
  };

  const removeClosedDate = (date: string) => {
    setClosedDates(closedDates.filter(d => d !== date));
  };

  const addBlockedRange = () => {
    if (!newRange.start || !newRange.end) return;
    if (newRange.end < newRange.start) return;
    setBlockedRanges([...blockedRanges, { ...newRange, label: newRange.label || 'Indisponible' }]);
    setNewRange({ start: '', end: '', label: '' });
  };

  const removeBlockedRange = (idx: number) => {
    setBlockedRanges(blockedRanges.filter((_, i) => i !== idx));
  };

  const addSlot = () => {
    if (!newSlot) return;
    // Valider format HH:MM
    if (!/^\d{1,2}:\d{2}$/.test(newSlot)) return;
    const sorted = [...customSlots, newSlot].sort();
    setCustomSlots([...new Set(sorted)]);
    setNewSlot('');
  };

  const removeSlot = (slot: string) => {
    setCustomSlots(customSlots.filter((s) => s !== slot));
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres existants depuis Supabase
  useEffect(() => {
    if (!studioId) {
      setIsLoading(false);
      return;
    }
    
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('inkflow_studios')
          .select('availability_settings')
          .eq('id', studioId)
          .single();
        
        if (data?.availability_settings) {
          const settings = data.availability_settings as Record<string, unknown>;
          
          // Restaurer weeklySchedule
          if (settings.weeklySchedule && typeof settings.weeklySchedule === 'object') {
            setSchedule({ ...DEFAULT_SCHEDULE, ...(settings.weeklySchedule as WeeklySchedule) });
          }
          
          // Restaurer les paramètres de réservation
          setBookingSettings(prev => ({
            ...prev,
            slotDuration: (settings.slotDuration as number) ?? prev.slotDuration,
            bufferTime: (settings.bufferTime as number) ?? prev.bufferTime,
            overrunMargin: (settings.overrunMargin as number) ?? prev.overrunMargin,
            advanceBooking: (settings.advanceBookingDays as number) ?? prev.advanceBooking,
            maxDailyBookings: (settings.maxDailyBookings as number) ?? prev.maxDailyBookings,
            depositPercentage: (settings.depositPercentage as number) ?? prev.depositPercentage,
            bookingWindowDays: (settings.bookingWindowDays as number) ?? prev.bookingWindowDays,
            requireDeposit: typeof settings.requireDeposit === 'boolean' ? settings.requireDeposit : prev.requireDeposit,
          }));

          // Restaurer les créneaux personnalisés
          if (Array.isArray(settings.customSlots)) {
            setCustomSlots(settings.customSlots as string[]);
          }

          // Restaurer les périodes bloquées
          if (Array.isArray(settings.blockedRanges)) {
            setBlockedRanges(settings.blockedRanges as BlockedRange[]);
          }

          // Restaurer les dates fermées
          if (Array.isArray(settings.closedDates)) {
            setClosedDates(settings.closedDates as string[]);
          }
        }
      } catch (err) {
        console.error('Erreur chargement availability_settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [studioId]);

  const handleSave = async () => {
    const settings = { schedule, bookingSettings, closedDates, customSlots, blockedRanges };
    onSave?.(settings);
    if (!studioId) return;
    setSaveStatus('saving');
    try {
      // Structure complète des paramètres de disponibilité
      const availabilitySettings = {
        // Créneaux et périodes
        customSlots,
        blockedRanges,
        closedDates,

        // Paramètres de base
        bookingWindowDays: bookingSettings.bookingWindowDays,
        depositPercentage: bookingSettings.depositPercentage,
        requireDeposit: bookingSettings.requireDeposit,

        // Jours fermés (calculés depuis schedule)
        offDays: Object.entries(schedule)
          .filter(([, v]) => !(v as { enabled?: boolean }).enabled)
          .map(([k]) => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(k))
          .filter((i) => i >= 0),

        // Paramètres avancés de temps
        slotDuration: bookingSettings.slotDuration,
        bufferTime: bookingSettings.bufferTime,
        overrunMargin: bookingSettings.overrunMargin,
        maxDailyBookings: bookingSettings.maxDailyBookings,
        advanceBookingDays: bookingSettings.advanceBooking,

        // Planning hebdomadaire complet avec pauses
        weeklySchedule: schedule,
      };
      
      const { error } = await supabase
        .from('inkflow_studios')
        .update({ availability_settings: availabilitySettings })
        .eq('id', studioId);
      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Disponibilités</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Configurez vos horaires de travail et vos pauses</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            saveStatus === 'saved' ? 'bg-emerald-600 text-white' :
            saveStatus === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          <Save className="w-5 h-5" />
          {saveStatus === 'saving' ? 'Enregistrement…' : saveStatus === 'saved' ? 'Enregistré ✓' : saveStatus === 'error' ? 'Erreur' : 'Enregistrer'}
        </button>
      </div>

      {/* Info buffer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Gestion intelligente des créneaux</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              Configurez la <strong>durée de vos séances</strong>, le <strong>temps de pause entre clients</strong> (buffer) 
              et une <strong>marge de sécurité</strong> pour les pièces complexes. Ces paramètres s'appliquent automatiquement 
              au calendrier de réservation pour éviter les chevauchements.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
        <h3 className="text-lg font-bold mb-6 text-[var(--text-primary)]">Paramètres de réservation</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Durée des créneaux</label>
            <select
              value={bookingSettings.slotDuration}
              onChange={(e) => setBookingSettings({ ...bookingSettings, slotDuration: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
              <option value={90}>1h30</option>
              <option value={120}>2 heures</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
              Temps de pause entre RDV
              <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">(buffer)</span>
            </label>
            <select
              value={bookingSettings.bufferTime}
              onChange={(e) => setBookingSettings({ ...bookingSettings, bufferTime: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value={0}>Aucun</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 heure</option>
            </select>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Ce temps est automatiquement bloqué après chaque RDV
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
              Marge de sécurité
              <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">(overrun)</span>
            </label>
            <select
              value={bookingSettings.overrunMargin}
              onChange={(e) => setBookingSettings({ ...bookingSettings, overrunMargin: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value={0}>Aucune</option>
              <option value={15}>+15 minutes</option>
              <option value={30}>+30 minutes</option>
              <option value={45}>+45 minutes</option>
              <option value={60}>+1 heure</option>
            </select>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Pour les pièces complexes qui peuvent durer plus longtemps
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Délai min de réservation (jours)</label>
            <input
              type="number"
              value={bookingSettings.advanceBooking}
              onChange={(e) => setBookingSettings({ ...bookingSettings, advanceBooking: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              min={0}
              max={30}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Ex: 7 = pas de réservation avant J+7
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">RDV max par jour</label>
            <input
              type="number"
              value={bookingSettings.maxDailyBookings}
              onChange={(e) => setBookingSettings({ ...bookingSettings, maxDailyBookings: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              min={1}
              max={20}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Ouverture du planning (jours)</label>
            <div className="relative">
              <input
                type="number"
                value={bookingSettings.bookingWindowDays}
                onChange={(e) => setBookingSettings({ ...bookingSettings, bookingWindowDays: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-ink-accent/50"
                min={0}
                max={365}
                placeholder="60"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-tertiary)]">jours (0 = illimité)</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Ex : 90 = les clients voient les créneaux jusqu'à 90 jours à l'avance
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
              <div>
                <div className="font-semibold">Acompte obligatoire</div>
                <div className="text-sm text-neutral-600">Exiger un acompte pour confirmer</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingSettings.requireDeposit}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, requireDeposit: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
          {bookingSettings.requireDeposit && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">Pourcentage d'acompte</label>
              <div className="relative">
                <input
                  type="number"
                  value={bookingSettings.depositPercentage}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, depositPercentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  min={10}
                  max={100}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]">%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
        <h3 className="text-lg font-bold mb-6 text-[var(--text-primary)]">Horaires hebdomadaires</h3>
        <div className="space-y-4">
          {daysOfWeek.map(({ key, label }) => {
            const day = schedule[key as keyof typeof schedule];
            return (
              <div key={key} className="border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => updateDay(key, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                    <span className="font-semibold text-[var(--text-primary)]">{label}</span>
                  </div>
                  {day.enabled && (
                    <button onClick={() => addBreak(key)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Ajouter une pause
                    </button>
                  )}
                </div>
                {day.enabled && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Ouverture</label>
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) => updateDay(key, 'open', e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Fermeture</label>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) => updateDay(key, 'close', e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                    {day.breaks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                        {day.breaks.map((breakTime, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-3 items-end">
                            <div>
                              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Début pause</label>
                              <input
                                type="time"
                                value={breakTime.start}
                                onChange={(e) => {
                                  const newBreaks = [...day.breaks];
                                  newBreaks[idx] = { ...newBreaks[idx], start: e.target.value };
                                  updateDay(key, 'breaks', newBreaks);
                                }}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Fin pause</label>
                                <input
                                  type="time"
                                  value={breakTime.end}
                                  onChange={(e) => {
                                    const newBreaks = [...day.breaks];
                                    newBreaks[idx] = { ...newBreaks[idx], end: e.target.value };
                                    updateDay(key, 'breaks', newBreaks);
                                  }}
                                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                              </div>
                              <button onClick={() => removeBreak(key, idx)} className="p-2 h-fit self-end text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Créneaux fixes */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <Timer className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Créneaux horaires fixes</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Définissez vos heures de départ exactes (ex : 10h30, 14h00, 15h30). Vos clients ne verront que ces horaires.
        </p>
        <div className="flex gap-3 mb-4">
          <input
            type="time"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-ink-accent/50"
          />
          <button
            onClick={addSlot}
            className="px-6 py-3 bg-ink-accent text-ink-bg rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
        {customSlots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customSlots.map((slot) => (
              <div
                key={slot}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card-secondary)] border border-[var(--border)] rounded-full"
              >
                <Clock className="w-4 h-4 text-ink-accent" />
                <span className="font-mono font-semibold text-[var(--text-primary)] text-sm">{slot}</span>
                <button
                  onClick={() => removeSlot(slot)}
                  className="ml-1 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--text-tertiary)]">
            <Timer className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun créneau — les horaires par défaut s'appliquent (10h, 12h, 14h, 16h, 18h)</p>
          </div>
        )}
      </div>

      {/* Périodes bloquées */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Périodes bloquées</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Bloquez une plage entière (ex : agenda déjà complet jusqu'en mai). Les créneaux seront invisibles pour vos clients.
        </p>
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Du</label>
              <input
                type="date"
                value={newRange.start}
                onChange={(e) => setNewRange((r) => ({ ...r, start: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-ink-accent/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Au</label>
              <input
                type="date"
                value={newRange.end}
                min={newRange.start}
                onChange={(e) => setNewRange((r) => ({ ...r, end: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-ink-accent/50 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newRange.label}
              onChange={(e) => setNewRange((r) => ({ ...r, label: e.target.value }))}
              placeholder="Motif (ex : Vacances, Déjà réservé...)"
              className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-ink-accent/50 text-sm"
            />
            <button
              onClick={addBlockedRange}
              disabled={!newRange.start || !newRange.end}
              className="px-5 py-2.5 bg-ink-accent text-ink-bg rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Bloquer
            </button>
          </div>
        </div>
        {blockedRanges.length > 0 ? (
          <div className="space-y-2">
            {blockedRanges.map((range, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div>
                  <span className="font-semibold text-[var(--text-primary)] text-sm">
                    {new Date(range.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {' → '}
                    {new Date(range.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {range.label && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{range.label}</p>
                  )}
                </div>
                <button
                  onClick={() => removeBlockedRange(idx)}
                  className="p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--text-tertiary)]">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune période bloquée</p>
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)]">
        <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Dates de fermeture</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Vacances, jours fériés, etc.</p>
        <div className="flex gap-3 mb-4">
          <input
            type="date"
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button onClick={addClosedDate} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
        {closedDates.length > 0 ? (
          <div className="space-y-2">
            {closedDates.map((date, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-card-secondary)] rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[var(--text-tertiary)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <button onClick={() => removeClosedDate(date)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune date de fermeture configurée</p>
          </div>
        )}
      </div>
    </div>
  );
};
