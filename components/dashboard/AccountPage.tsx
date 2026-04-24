import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Hash,
  Camera,
  Trash2,
  Users,
  CreditCard,
  Bell,
  LogOut,
  Check,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { BillingSettings } from './BillingSettings';
import { useToast } from '../../contexts/ToastContext';
import { deleteStudioAccountForOwner } from '../../lib/studioDataPortability';
import type { ArtistAccount } from '../../types';

type AccountView = 'home' | 'profil' | 'facturation';

interface AccountPageProps {
  // User
  user: { name?: string; email?: string; avatar?: string; studioName?: string } | null;
  studioId: string | null;
  // Profile form state (lifted from DashboardPro)
  studioName: string;
  email: string;
  siret: string;
  onStudioNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSiretChange: (v: string) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  // Avatar
  avatarInputRef: React.RefObject<HTMLInputElement>;
  avatarUploading: boolean;
  onAvatarClick: () => void;
  onAvatarRemove: () => void;
  /** Pour afficher le nombre sur la ligne Collaborateurs */
  artists: ArtistAccount[];
  /** Ouvre l’onglet Établissement (liste, rôles, invitations) — seule entrée pour éviter le doublon avec « Mon équipe » */
  onGoToCollaborateurs: () => void;
  // Navigation
  onGoToBilling: () => void;
  onGoToNotifications: () => void;
  onLogout: () => void | Promise<void>;
  // Subscription
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  /** Recharge le statut studio (après fin d’essai, etc.) */
  onRefreshStudioSubscription?: () => void | Promise<void>;
  /** Faux si membre invité — la suppression n’est proposée qu’au titulaire. */
  isStudioOwner?: boolean;
}

// ─── Row atom ─────────────────────────────────────────────────────────────────
interface RowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  accent?: boolean;
  badge?: string;
  disabled?: boolean;
}

const Row: React.FC<RowProps> = ({
  icon,
  label,
  value,
  onClick,
  danger,
  accent,
  badge,
  disabled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3.5 px-4 py-3.5 text-left
      transition-colors duration-150 active:opacity-70
      disabled:opacity-40 disabled:cursor-not-allowed
      ${
        danger
          ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
          : accent
            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10'
            : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
      }
    `}
  >
    {/* Icon container */}
    <span
      className={`
      w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm
      ${
        danger
          ? 'bg-red-100 dark:bg-red-500/15 text-red-500 dark:text-red-400'
          : accent
            ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
      }
    `}
    >
      {icon}
    </span>

    {/* Label */}
    <span className="flex-1 text-[15px] font-medium">{label}</span>

    {/* Badge */}
    {badge && (
      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
        {badge}
      </span>
    )}

    {/* Value */}
    {value && !badge && (
      <span className="text-sm text-zinc-400 dark:text-zinc-500 truncate max-w-[120px]">
        {value}
      </span>
    )}

    {/* Chevron */}
    {onClick && !danger && (
      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 flex-shrink-0 -mr-1" />
    )}
  </button>
);

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-0">
    {title && (
      <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </p>
    )}
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
      {children}
    </div>
  </div>
);

// ─── Sub-page header ───────────────────────────────────────────────────────────
const SubPageHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center gap-3 mb-6">
    <button
      onClick={onBack}
      className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{title}</h2>
  </div>
);

// ─── Field ────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  pattern?: string;
}> = ({
  icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  inputMode,
  maxLength,
  pattern,
}) => (
  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 px-4 py-3.5">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {label}
      </label>
    </div>
    <input
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
      pattern={pattern}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-[16px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
    />
    {hint && <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────────
export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  studioId,
  studioName,
  email,
  siret,
  onStudioNameChange,
  onEmailChange,
  onSiretChange,
  saving,
  saved,
  onSave,
  avatarInputRef,
  avatarUploading,
  onAvatarClick,
  onAvatarRemove,
  artists,
  onGoToCollaborateurs,
  onGoToBilling,
  onGoToNotifications,
  onLogout,
  subscriptionStatus,
  trialEndsAt,
  onRefreshStudioSubscription,
  isStudioOwner = true,
}) => {
  const toast = useToast();
  const [view, setView] = useState<AccountView>('home');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const firstName = user?.name?.split(' ')[0] || user?.studioName || 'Tatoueur';
  const displayName = user?.studioName || user?.name || 'Mon Studio';
  const displayEmail = user?.email || email || '';

  const planLabel =
    subscriptionStatus === 'active'
      ? 'Plan Pro actif'
      : subscriptionStatus === 'trialing'
        ? "Période d'essai"
        : 'Plan gratuit';

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === 'home') {
    return (
      <div className="w-full max-w-lg mx-auto space-y-5 px-1 pb-24">
        {/* Profile header card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center gap-3 relative">
          {/* Edit button */}
          <button
            onClick={() => setView('profil')}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors active:scale-95"
            aria-label="Modifier le profil"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-zinc-900 shadow"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-white dark:ring-zinc-900 shadow">
                <span className="text-2xl font-bold text-white">
                  {firstName.slice(0, 1).toUpperCase()}
                </span>
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Name + email */}
          <div className="text-center">
            <p className="text-lg font-bold text-zinc-900 dark:text-white">{displayName}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{displayEmail}</p>
          </div>

          {/* Plan badge */}
          <span
            className={`
            px-3 py-1 rounded-full text-xs font-semibold
            ${
              subscriptionStatus === 'active'
                ? 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400'
                : subscriptionStatus === 'trialing'
                  ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }
          `}
          >
            {planLabel}
          </span>
        </div>

        {/* Mon compte */}
        <Section title="Mon compte">
          <Row
            icon={<User className="w-4 h-4" />}
            label="Informations du studio"
            value={siret ? `SIRET ${siret.slice(0, 6)}…` : 'Compléter'}
            onClick={() => setView('profil')}
          />
          <Row
            icon={<CreditCard className="w-4 h-4" />}
            label="Abonnement & Factures"
            value={planLabel}
            onClick={() => setView('facturation')}
            accent={subscriptionStatus !== 'active'}
          />
        </Section>

        {/* Mon studio */}
        <Section title="Mon studio">
          <Row
            icon={<Users className="w-4 h-4" />}
            label="Collaborateurs"
            value={`${artists.length} membre${artists.length !== 1 ? 's' : ''}`}
            onClick={onGoToCollaborateurs}
          />
          <Row
            icon={<Bell className="w-4 h-4" />}
            label="Notifications"
            onClick={onGoToNotifications}
          />
        </Section>

        {/* Déconnexion */}
        <Section>
          <Row
            icon={<LogOut className="w-4 h-4" />}
            label="Déconnexion"
            onClick={() => void onLogout()}
            danger
          />
        </Section>

        {isStudioOwner && studioId && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Compte &amp; données
                </p>
                <p className="text-xs text-red-800/90 dark:text-red-300/90 mt-1 leading-relaxed">
                  Suppression définitive : studio, clients, messages, acomptes côté app, fichiers
                  d’illustration liés. Les obligations comptables / Stripe peuvent conserver des
                  traces (factures, législation). Pas de simple « désactivation ».
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(true);
                    setDeleteConfirm('');
                  }}
                  className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors min-h-[44px]"
                >
                  Supprimer mon compte studio
                </button>
                {deleteOpen && (
                  <div className="mt-4 space-y-2 p-3 rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-red-200/80 dark:border-red-800/40">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Tape ton email{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100">{displayEmail}</strong>{' '}
                      pour confirmer.
                    </p>
                    <input
                      type="email"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                      placeholder="Email du compte"
                      autoComplete="off"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={deleteBusy}
                        onClick={async () => {
                          if (!studioId) return;
                          setDeleteBusy(true);
                          const r = await deleteStudioAccountForOwner({
                            studioId,
                            confirmEmail: deleteConfirm.trim().toLowerCase(),
                          });
                          setDeleteBusy(false);
                          if ('error' in r) {
                            toast.error(r.error);
                            return;
                          }
                          toast.success(r.message);
                          setDeleteOpen(false);
                          try {
                            localStorage.removeItem('inkflow_user');
                            localStorage.removeItem('inkflow_studio_name');
                            localStorage.removeItem('inkflow_email');
                            localStorage.removeItem('inkflow_avatar');
                          } catch {
                            /* ignore */
                          }
                          await onLogout();
                          window.location.href = '/';
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {deleteBusy ? 'Suppression…' : 'Confirmer la suppression définitive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteOpen(false)}
                        className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PROFIL ────────────────────────────────────────────────────────────────
  if (view === 'profil') {
    return (
      <div className="w-full max-w-lg mx-auto pb-24 space-y-4 px-1">
        <SubPageHeader title="Mon profil" onBack={() => setView('home')} />

        {/* Avatar section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {firstName.slice(0, 1).toUpperCase()}
                </span>
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <button
              onClick={onAvatarClick}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow hover:bg-blue-500 transition-colors"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{displayEmail}</p>
          </div>
          {user?.avatar && (
            <button
              onClick={onAvatarRemove}
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Supprimer la photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <Field
            icon={<Building2 className="w-4 h-4" />}
            label="Nom du studio"
            value={studioName}
            onChange={onStudioNameChange}
            placeholder="Mon studio de tatouage"
          />
          <Field
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={email}
            onChange={onEmailChange}
            type="email"
            placeholder="contact@example.com"
            hint="Utilisé pour les notifications et la facturation."
          />
          <Field
            icon={<Hash className="w-4 h-4" />}
            label="N° SIRET"
            value={siret}
            onChange={(v) => onSiretChange(v.replace(/\D/g, '').slice(0, 14))}
            inputMode="numeric"
            pattern="[0-9\s]*"
            maxLength={14}
            placeholder="12345678900012"
            hint="Obligatoire pour la facturation et les mentions légales."
          />
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={saving}
          className={`
            w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 '
            }
          `}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Enregistrement…
            </span>
          ) : saved ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Enregistré !
            </span>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </div>
    );
  }

  // ── FACTURATION ──────────────────────────────────────────────────────────
  if (view === 'facturation') {
    return (
      <div className="w-full max-w-3xl mx-auto pb-24 px-1">
        <SubPageHeader title="Abonnement & Factures" onBack={() => setView('home')} />
        <BillingSettings
          studioId={studioId}
          userEmail={email}
          trialEndsAt={trialEndsAt}
          studioSubscriptionStatus={subscriptionStatus}
          onStudioSubscriptionRefresh={onRefreshStudioSubscription}
        />
      </div>
    );
  }

  return null;
};
