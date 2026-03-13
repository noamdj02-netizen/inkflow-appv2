import React, { useMemo, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, CreditCard, Receipt, Banknote, Plus, Trash2, FileText, Download, Clock, Loader2 } from 'lucide-react';
import { Appointment } from '../../types';
import { InvoiceButton } from './InvoiceButton';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Modal } from '../ui/Modal';

type BilanPeriod = 'today' | 'week' | 'month';

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function getDateRange(period: BilanPeriod): { start: string; end: string; label: string } {
  const now = new Date();
  const toStr = (d: Date) => d.toISOString().split('T')[0];
  if (period === 'today') {
    const today = toStr(now);
    return { start: today, end: today, label: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) };
  }
  if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      start: toStr(start),
      end: toStr(end),
      label: `Semaine du ${start.getDate()} au ${end.getDate()} ${MONTH_LABELS[end.getMonth()]} ${end.getFullYear()}`,
    };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: toStr(start),
    end: toStr(end),
    label: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  };
}

interface FinanceBilanModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  cashEntries: CashEntry[];
}

function FinanceBilanModal({ isOpen, onClose, appointments, cashEntries }: FinanceBilanModalProps) {
  const [period, setPeriod] = useState<BilanPeriod>('today');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { start, end, label } = getDateRange(period);

  const inRange = (dateStr: string) => dateStr >= start && dateStr <= end;

  const periodAppointments = useMemo(
    () =>
      appointments.filter(
        (a) => inRange(a.date) && (a.status === 'completed' || a.depositPaid)
      ),
    [appointments, start, end]
  );
  const periodCash = useMemo(
    () => cashEntries.filter((e) => inRange(e.date)),
    [cashEntries, start, end]
  );

  const totalRevenue = periodAppointments
    .filter((a) => a.status === 'completed')
    .reduce((s, a) => s + a.price, 0);
  const totalCash = periodCash.reduce((s, e) => s + e.amount, 0);
  const totalCA = totalRevenue + totalCash;
  const depositsReceived = periodAppointments
    .filter((a) => a.depositPaid)
    .reduce((s, a) => s + a.deposit, 0);
  const restPaid = periodAppointments
    .filter((a) => a.status === 'completed')
    .reduce((s, a) => s + (a.price - a.deposit), 0);
  const clientCount = new Set(
    periodAppointments.map((a) => a.clientId || a.clientName)
  ).size;
  const totalMinutes = periodAppointments
    .filter((a) => a.status === 'completed' && typeof a.duration === 'number')
    .reduce((s, a) => s + a.duration, 0);
  const hoursTattooed = Math.floor(totalMinutes / 60);
  const minsTattooed = totalMinutes % 60;

  const transactions = useMemo(() => {
    const fromApts = periodAppointments.map((a) => ({
      id: a.id,
      type: 'rdv' as const,
      date: a.date,
      time: a.time || '',
      label: a.clientName,
      sub: a.service,
      amount: a.price,
      deposit: a.deposit,
      depositPaid: a.depositPaid,
      status: a.status,
    }));
    const fromCash = periodCash.map((e) => ({
      id: e.id,
      type: 'cash' as const,
      date: e.date,
      time: '',
      label: e.label,
      sub: 'Espèces',
      amount: e.amount,
    }));
    return [...fromApts, ...fromCash].sort((a, b) => {
      const da = new Date(a.date + 'T' + (a.time || '00:00'));
      const db = new Date(b.date + 'T' + (b.time || '00:00'));
      return db.getTime() - da.getTime();
    });
  }, [periodAppointments, periodCash]);

  const generateBilanPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = 20;

      const primaryColor: [number, number, number] = [23, 23, 23];
      const textColor: [number, number, number] = [23, 23, 23];
      const lightText: [number, number, number] = [115, 115, 115];

      const addPageIfNeeded = (needed: number) => {
        if (yPos + needed > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
        }
      };

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INKFLOW', margin, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Bilan financier', pageWidth - margin, 25, { align: 'right' });

      yPos = 50;
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Bilan du ${label}`, margin, yPos);
      yPos += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Chiffre d\'affaires:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalCA}€`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Nombre de clients:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(clientCount), pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Acomptes reçus:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${depositsReceived}€`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Reste à payer encaissé:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${restPaid}€`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 12;

      if (totalMinutes > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Temps passé:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${hoursTattooed}h${minsTattooed > 0 ? ` ${minsTattooed} min` : ''}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 12;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Transactions de la période', margin, yPos);
      yPos += 10;

      if (transactions.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...lightText);
        doc.text('Aucune transaction', margin, yPos);
        yPos += 15;
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textColor);
        const colW = [(pageWidth - 2 * margin) * 0.25, (pageWidth - 2 * margin) * 0.3, (pageWidth - 2 * margin) * 0.25, (pageWidth - 2 * margin) * 0.2];
        const colX = [margin, margin + colW[0], margin + colW[0] + colW[1], margin + colW[0] + colW[1] + colW[2]];
        doc.text('Date / Heure', colX[0], yPos);
        doc.text('Client', colX[1], yPos);
        doc.text('Service', colX[2], yPos);
        doc.text('Montant', pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        for (const t of transactions) {
          addPageIfNeeded(10);
          const line = `${t.date}${t.time ? ' ' + t.time : ''}`;
          doc.text(line.length > 18 ? line.slice(0, 15) + '…' : line, colX[0], yPos);
          doc.text(t.label.length > 22 ? t.label.slice(0, 19) + '…' : t.label, colX[1], yPos);
          doc.text(t.sub.length > 18 ? t.sub.slice(0, 15) + '…' : t.sub, colX[2], yPos);
          doc.text(`${t.amount}€`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 6;
        }
      }

      yPos += 10;
      addPageIfNeeded(15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightText);
      doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPos);
      doc.text('InkFlow - Bilan généré automatiquement', pageWidth - margin, yPos, { align: 'right' });

      const fileName = start === end ? `Bilan-${start}.pdf` : `Bilan-${start}-${end}.pdf`;
      doc.save(fileName);
    } catch (error) {
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [label, totalCA, clientCount, depositsReceived, restPaid, totalMinutes, hoursTattooed, minsTattooed, transactions, start, end]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bilan & Rapports" size="lg">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                period === p
                  ? 'bg-neutral-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-500/30'
              }`}
            >
              {p === 'today' ? 'Aujourd\'hui' : p === 'week' ? 'Cette semaine' : 'Ce mois'}
            </button>
          ))}
        </div>

        <div id="bilan-print-content" className="space-y-6">
          <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Bilan du {label}</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="dashboard-widget-card p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Chiffre d'affaires</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">{totalCA}€</div>
            </div>
            <div className="dashboard-widget-card p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Nombre de clients</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{clientCount}</div>
            </div>
            <div className="dashboard-widget-card p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Acomptes reçus</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{depositsReceived}€</div>
            </div>
            <div className="dashboard-widget-card p-4">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Reste à payer encaissé</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{restPaid}€</div>
            </div>
          </div>

          {totalMinutes > 0 && (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                Temps passé : {hoursTattooed}h {minsTattooed > 0 ? `${minsTattooed} min` : ''}
              </span>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Transactions de la période</h3>
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-sm">Aucune transaction</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-500/10 border-b border-neutral-200 dark:border-neutral-700">
                      <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">Heure</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">Client</th>
                      <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">Service</th>
                      <th className="text-right px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-500/5">
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {t.date} {t.time ? `• ${t.time}` : ''}
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{t.label}</td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{t.sub}</td>
                        <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">{t.amount}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={generateBilanPdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-h-[48px] py-2.5 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Génération...</>
            ) : (
              <><Download className="w-5 h-5" /> Télécharger PDF</>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300 rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-zinc-500/30"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface FinanceDashboardProps {
  appointments: Appointment[];
}

export interface CashEntry {
  id: string;
  date: string;
  amount: number;
  label: string;
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'inkflow_finance_cash_';

function loadCashEntries(userId: string): CashEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CashEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCashEntries(userId: string, entries: CashEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ appointments }) => {
  const { user } = useAuth();
  const userId = user?.id ?? user?.email ?? 'default';
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => loadCashEntries(userId));
  const [showAddCash, setShowAddCash] = useState(false);
  const [showBilan, setShowBilan] = useState(false);
  const [newCash, setNewCash] = useState({ date: new Date().toISOString().split('T')[0], amount: '', label: '' });

  const saveCash = useCallback(
    (entries: CashEntry[]) => {
      setCashEntries(entries);
      saveCashEntries(userId, entries);
    },
    [userId]
  );

  const addCashEntry = useCallback(() => {
    const amount = Math.round(parseFloat(newCash.amount) * 100) / 100;
    if (!newCash.date || isNaN(amount) || amount <= 0) return;
    const entry: CashEntry = {
      id: 'cash_' + Date.now(),
      date: newCash.date,
      amount,
      label: newCash.label.trim() || 'Encaissement espèces',
      createdAt: new Date().toISOString(),
    };
    saveCash([...cashEntries, entry]);
    setNewCash({ date: new Date().toISOString().split('T')[0], amount: '', label: '' });
    setShowAddCash(false);
  }, [cashEntries, newCash, saveCash]);

  const removeCashEntry = useCallback(
    (id: string) => {
      saveCash(cashEntries.filter((e) => e.id !== id));
    },
    [cashEntries, saveCash]
  );

  const totalRevenue = useMemo(
    () => appointments.filter((a) => a.status === 'completed').reduce((s, a) => s + a.price, 0),
    [appointments]
  );

  const totalCash = useMemo(() => cashEntries.reduce((s, e) => s + e.amount, 0), [cashEntries]);

  const totalDeposits = useMemo(
    () => appointments.filter((a) => a.depositPaid).reduce((s, a) => s + a.deposit, 0),
    [appointments]
  );

  const pendingDeposits = useMemo(
    () =>
      appointments
        .filter((a) => !a.depositPaid && !['cancelled'].includes(a.status))
        .reduce((s, a) => s + a.deposit, 0),
    [appointments]
  );

  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const totalGlobal = totalRevenue + totalCash;

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const rev = appointments
        .filter((a) => a.status === 'completed' && a.date >= monthStart && a.date <= monthEnd)
        .reduce((s, a) => s + a.price, 0);
      const cash = cashEntries
        .filter((e) => e.date >= monthStart && e.date <= monthEnd)
        .reduce((s, e) => s + e.amount, 0);
      return {
        month: MONTH_LABELS[d.getMonth()],
        revenue: rev,
        cash,
        total: rev + cash,
      };
    });
  }, [appointments, cashEntries]);

  const transactions = useMemo(() => {
    const fromApts = appointments
      .filter((a) => a.status === 'completed' || a.depositPaid)
      .map((a) => ({
        id: a.id,
        type: 'rdv' as const,
        date: a.date,
        label: a.clientName,
        sub: a.service,
        amount: a.price,
        appointment: a,
      }));
    const fromCash = cashEntries.map((e) => ({
      id: e.id,
      type: 'cash' as const,
      date: e.date,
      label: e.label,
      sub: 'Espèces',
      amount: e.amount,
      entry: e,
    }));
    return [...fromApts, ...fromCash]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [appointments, cashEntries]);

  const todayCash = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return cashEntries.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  }, [cashEntries]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Finance</h1>
          <p className="text-[var(--text-secondary)] mt-1">Revenus, espèces et paiements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowBilan(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-zinc-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Bilan & Rapports
          </button>
          <button
            onClick={() => setShowAddCash(true)}
            className="btn-primary"
          >
            <Banknote className="w-5 h-5" />
            Ajouter encaissement espèces
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="dashboard-widget-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-neutral-900 text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Total global</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalGlobal}€</div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">RDV + espèces</p>
        </div>
        <div className="dashboard-widget-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Revenus RDV</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalRevenue}€</div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Paiements carte / virement</p>
        </div>
        <div className="dashboard-widget-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Espèces</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalCash}€</div>
          {todayCash > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Dont {todayCash}€ aujourd'hui</p>
          )}
        </div>
        <div className="dashboard-widget-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Acomptes reçus</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalDeposits}€</div>
        </div>
        <div className="dashboard-widget-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Acomptes en attente</span>
          </div>
          <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">{pendingDeposits}€</div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{completedCount} RDV terminés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[var(--bg-card)] rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-4">Évolution des revenus (6 mois)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" stroke="#737373" style={{ fontSize: 12 }} />
              <YAxis stroke="#737373" style={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `${v}€`,
                  name === 'revenue' ? 'Revenus RDV' : name === 'cash' ? 'Espèces' : 'Total',
                ]}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#171717"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="cash"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#colorCash)"
                name="cash"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Caisse espèces</h3>
            <button
              onClick={() => setShowAddCash(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              aria-label="Ajouter"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {cashEntries.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-sm">Aucun encaissement espèces</div>
            ) : (
              cashEntries
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-500/10 group"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{e.label}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{e.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400">{e.amount}€</span>
                      <button
                        onClick={() => removeCashEntry(e.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-zinc-100 text-zinc-600 dark:hover:bg-zinc-500/20 dark:text-zinc-400 transition-opacity"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[var(--bg-card)] rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Dernières transactions</h3>
        </div>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 dark:text-neutral-500">Aucune transaction</div>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-500/10">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      t.type === 'cash' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400'
                    }`}
                  >
                    {t.type === 'cash' ? (
                      <Banknote className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">{t.label}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t.sub} • {t.date}
                      {t.type === 'cash' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-medium">
                          Espèces
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">{t.amount}€</span>
                  {t.type === 'rdv' && t.appointment && user && (
                    <InvoiceButton
                      appointment={t.appointment}
                      artist={user}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showBilan && (
        <FinanceBilanModal
          isOpen={showBilan}
          onClose={() => setShowBilan(false)}
          appointments={appointments}
          cashEntries={cashEntries}
        />
      )}

      {showAddCash && (
        <Modal
          isOpen={showAddCash}
          onClose={() => setShowAddCash(false)}
          title="Encaissement espèces"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
              <input
                type="date"
                value={newCash.date}
                onChange={(e) => setNewCash((c) => ({ ...c, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Montant (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={newCash.amount}
                onChange={(e) => setNewCash((c) => ({ ...c, amount: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Libellé (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Caisse du jour, Dépot client…"
                value={newCash.label}
                onChange={(e) => setNewCash((c) => ({ ...c, label: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={addCashEntry}
                disabled={!newCash.date || !newCash.amount || parseFloat(newCash.amount) <= 0}
                className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowAddCash(false)}
                className="px-4 py-2.5 bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300 rounded-xl font-semibold hover:bg-neutral-200 dark:hover:bg-zinc-500/30"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
