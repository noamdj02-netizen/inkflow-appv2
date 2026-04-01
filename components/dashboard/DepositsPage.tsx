import React, { useMemo, useState, useCallback } from 'react';
import {
  Receipt, CheckCircle, Clock, AlertCircle, Send, Search,
  Calendar, User, CreditCard, ChevronRight, Phone, ExternalLink,
  Loader2, Copy, Link2, Check, DollarSign, Banknote
} from 'lucide-react';
import { Appointment } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { markDepositAsPaid } from '../../lib/supabaseDashboard';
import { createCheckoutSession } from '../../lib/stripeClient';

interface DepositsPageProps {
  appointments: Appointment[];
  studioId: string | null;
  onDepositUpdated?: () => void;
}

type FilterTab = 'all' | 'received' | 'pending';

export const DepositsPage: React.FC<DepositsPageProps> = ({
  appointments,
  studioId,
  onDepositUpdated,
}) => {
  const toast = useToast();
  const { privacyMode } = useStudioPrivacy();
  
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<Appointment | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [appointmentToSend, setAppointmentToSend] = useState<Appointment | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [generatedPaymentUrl, setGeneratedPaymentUrl] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const depositsData = useMemo(() => {
    const validAppointments = appointments.filter(
      (a) => a.deposit > 0 && !['cancelled', 'no_show'].includes(a.status)
    );

    const received = validAppointments.filter((a) => a.depositPaid);
    const pending = validAppointments.filter((a) => !a.depositPaid);

    return {
      all: validAppointments,
      received,
      pending,
      totalReceived: received.reduce((sum, a) => sum + a.deposit, 0),
      totalPending: pending.reduce((sum, a) => sum + a.deposit, 0),
      totalExpected: validAppointments.reduce((sum, a) => sum + a.deposit, 0),
    };
  }, [appointments]);

  const filteredDeposits = useMemo(() => {
    let list: Appointment[] = [];
    
    switch (activeTab) {
      case 'received':
        list = depositsData.received;
        break;
      case 'pending':
        list = depositsData.pending;
        break;
      default:
        list = depositsData.all;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.clientEmail?.toLowerCase().includes(q) ||
          a.service?.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTab, depositsData, searchQuery]);

  const handleSendLink = (apt: Appointment) => {
    setAppointmentToSend(apt);
    setGeneratedPaymentUrl(null);
    setShowSendModal(true);
  };

  const generatePaymentLink = useCallback(async () => {
    if (!appointmentToSend || !studioId) return;
    
    setIsSendingLink(true);
    try {
      const result = await createCheckoutSession({
        studioId,
        amount: appointmentToSend.deposit,
        clientEmail: appointmentToSend.clientEmail || '',
        clientName: appointmentToSend.clientName,
        appointmentId: appointmentToSend.id,
        serviceName: appointmentToSend.service,
        type: 'deposit',
      });

      if ('url' in result) {
        setGeneratedPaymentUrl(result.url);
        toast.success('Lien de paiement généré !');
      }
    } catch (error) {
      console.error('Erreur génération lien:', error);
      toast.error('Impossible de générer le lien de paiement');
    } finally {
      setIsSendingLink(false);
    }
  }, [appointmentToSend, studioId, toast]);

  const copyPaymentLink = useCallback(() => {
    if (generatedPaymentUrl) {
      navigator.clipboard.writeText(generatedPaymentUrl);
      toast.success('Lien copié !');
    }
  }, [generatedPaymentUrl, toast]);

  const handleMarkAsPaid = useCallback(async (apt: Appointment) => {
    if (!studioId) return;
    
    setIsMarkingPaid(apt.id);
    try {
      await markDepositAsPaid(apt.id, studioId);
      toast.success(privacyMode ? 'Acompte marqué comme payé' : `Acompte de ${apt.deposit}€ marqué comme payé`);
      onDepositUpdated?.();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast.error('Impossible de marquer comme payé');
    } finally {
      setIsMarkingPaid(null);
    }
  }, [studioId, toast, onDepositUpdated, privacyMode]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Acomptes</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Suivez vos acomptes clients</p>
        </div>
      </div>

      {/* KPI Cards - Style Finance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Acomptes reçus</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatEuroPrivacy(depositsData.totalReceived, privacyMode)}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{depositsData.received.length} reçus</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">En attente</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {formatEuroPrivacy(depositsData.totalPending, privacyMode)}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{depositsData.pending.length} en attente</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Total attendu</span>
            <div className="p-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {formatEuroPrivacy(depositsData.totalExpected, privacyMode)}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{depositsData.all.length} acomptes</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Taux de paiement</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {depositsData.all.length > 0 ? Math.round((depositsData.received.length / depositsData.all.length) * 100) : 0}%
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">des acomptes payés</p>
        </div>
      </div>

      {/* Filters - Simple tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'all' as FilterTab, label: 'Tous', count: depositsData.all.length },
          { id: 'received' as FilterTab, label: 'Reçus', count: depositsData.received.length },
          { id: 'pending' as FilterTab, label: 'En attente', count: depositsData.pending.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-zinc-400 dark:text-zinc-500">{tab.count}</span>
          </button>
        ))}

        {/* Search */}
        <div className="flex-1 flex justify-end">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Deposits List - Clean table style */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {filteredDeposits.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mx-auto mb-4 flex items-center justify-center">
              <Receipt className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun acompte</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredDeposits.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {/* Left: Client info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    apt.depositPaid 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {apt.depositPaid ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{apt.clientName}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {apt.service} • {new Date(apt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Right: Amount + Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`font-bold tabular-nums ${
                      apt.depositPaid 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
                      {formatEuroPrivacy(apt.deposit, privacyMode)}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">sur {formatEuroPrivacy(apt.price, privacyMode)}</p>
                  </div>

                  {!apt.depositPaid && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSendLink(apt)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors"
                        title="Générer lien"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMarkAsPaid(apt)}
                        disabled={isMarkingPaid === apt.id}
                        className="p-2 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                        title="Marquer payé"
                      >
                        {isMarkingPaid === apt.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Link Modal - Simplified */}
      {showSendModal && appointmentToSend && (
        <Modal
          isOpen={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setAppointmentToSend(null);
            setGeneratedPaymentUrl(null);
          }}
          title="Lien de paiement"
          size="sm"
        >
          <div className="space-y-5">
            {/* Client summary */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">{appointmentToSend.clientName}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(appointmentToSend.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {formatEuroPrivacy(appointmentToSend.deposit, privacyMode)}
              </p>
            </div>

            {generatedPaymentUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Lien généré !</span>
                </div>
                
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate font-mono">
                    {generatedPaymentUrl}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={copyPaymentLink}
                    className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </button>
                  <a
                    href={generatedPaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={generatePaymentLink}
                disabled={isSendingLink}
                className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Générer le lien Stripe
                  </>
                )}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DepositsPage;
