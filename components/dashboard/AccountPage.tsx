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
  Languages,
} from 'lucide-react';
import { BillingSettings } from './BillingSettings';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  dashboardAvatarFrame,
  dashboardBtnAccent,
  dashboardBtnDanger,
  dashboardBtnPrimary,
  dashboardPageBg,
  dashboardSettingsDivide,
  dashboardSettingsGroup,
  dashboardSettingsRowIcon,
  dashboardSettingsRowIconAccent,
  dashboardListRowCompact,
  dashboardStatusBadge,
  dashboardStickyActionBar,
} from './ui/dashboardChrome';
import { cn } from '@/lib/utils';
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
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      dashboardListRowCompact,
      'text-left active:scale-[0.99]',
      danger && 'text-red-400/80 hover:bg-zinc-900 dark:text-red-400/80 dark:hover:bg-zinc-900',
      !danger && 'text-zinc-900 dark:text-zinc-100',
      disabled && 'cursor-not-allowed opacity-40'
    )}
  >
    <span
      className={cn(
        danger
          ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/35 dark:text-rose-400'
          : accent
            ? dashboardSettingsRowIconAccent
            : dashboardSettingsRowIcon
      )}
    >
      {icon}
    </span>

    {/* Label */}
    <span className="flex-1 text-[15px] font-medium">{label}</span>

    {/* Badge */}
    {badge && <span className={dashboardStatusBadge.new}>{badge}</span>}

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
    <div className={cn(dashboardSettingsGroup, dashboardSettingsDivide)}>{children}</div>
  </div>
);

// ─── Sub-page header ───────────────────────────────────────────────────────────
const SubPageHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="flex items-center gap-3 mb-6">
    <button
      onClick={onBack}
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <h2 className="type-heading-sm">{title}</h2>
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
  <div className="px-4 py-3.5">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-zinc-900 dark:text-zinc-100">{icon}</span>
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
  avatarInputRef: _avatarInputRef,
  avatarUploading,
  onAvatarClick,
  onAvatarRemove,
  artists,
  onGoToCollaborateurs,
  onGoToBilling: _onGoToBilling,
  onGoToNotifications,
  onLogout,
  subscriptionStatus,
  trialEndsAt,
  onRefreshStudioSubscription,
  isStudioOwner = true,
}) => {
  const toast = useToast();
  const { t } = useLanguage();
  const [view, setView] = useState<AccountView>('home');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const firstName = user?.name?.split(' ')[0] || user?.studioName || 'Tatoueur';
  const displayName = user?.studioName || user?.name || 'Mon Studio';
  const displayEmail = user?.email || email || '';

  const planLabel =
    subscriptionStatus === 'active'
      ? t('dashboard.account.planActive')
      : subscriptionStatus === 'trialing'
        ? t('dashboard.account.planTrial')
        : t('dashboard.account.planFree');

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === 'home') {
    return (
      <div className={cn('mx-auto w-full max-w-lg space-y-5 px-1 pb-24', dashboardPageBg)}>
        {/* Profile header card */}
        <div
          className={cn(dashboardSettingsGroup, 'relative flex flex-col items-center gap-3 p-6')}
        >
          <button
            onClick={() => setView('profil')}
            className={cn(
              dashboardBtnAccent,
              'absolute top-4 right-4 !size-10 !min-h-0 !p-0 rounded-full'
            )}
            aria-label={t('dashboard.account.editProfile')}
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className={cn(dashboardAvatarFrame, 'size-20 object-cover')}
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-blue-600 ring-2 ring-zinc-100 dark:ring-zinc-800">
                <span className="type-stat text-white">{firstName.slice(0, 1).toUpperCase()}</span>
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
            <p className="type-body text-muted-foreground mt-0.5">{displayEmail}</p>
          </div>

          {/* Plan badge */}
          <span
            className={
              subscriptionStatus === 'active'
                ? dashboardStatusBadge.active
                : subscriptionStatus === 'trialing'
                  ? dashboardStatusBadge.new
                  : dashboardStatusBadge.neutral
            }
          >
            {planLabel}
          </span>
        </div>

        {/* Mon compte */}
        <Section title={t('dashboard.account.sectionAccount')}>
          <Row
            icon={<User className="w-4 h-4" />}
            label={t('dashboard.account.studioInfo')}
            value={siret ? `SIRET ${siret.slice(0, 6)}…` : t('dashboard.account.complete')}
            onClick={() => setView('profil')}
          />
          <Row
            icon={<CreditCard className="w-4 h-4" />}
            label={t('dashboard.account.billing')}
            value={planLabel}
            onClick={() => setView('facturation')}
            accent={subscriptionStatus !== 'active'}
          />
        </Section>

        <Section title={t('dashboard.account.sectionStudio')}>
          <Row
            icon={<Users className="w-4 h-4" />}
            label={t('dashboard.account.collaborators')}
            value={
              artists.length === 1
                ? t('dashboard.account.memberOne')
                : t('dashboard.account.memberMany').replace('{n}', String(artists.length))
            }
            onClick={onGoToCollaborateurs}
          />
          <Row
            icon={<Bell className="w-4 h-4" />}
            label={t('dashboard.account.notifications')}
            onClick={onGoToNotifications}
          />
        </Section>

        <Section title={t('settings.language.section')}>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className={dashboardSettingsRowIcon}>
                <Languages className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
                  {t('settings.language.title')}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t('settings.language.description')}
                </p>
              </div>
            </div>
            <LanguageToggle variant="buttons" />
          </div>
        </Section>

        {/* Déconnexion */}
        <Section>
          <Row
            icon={<LogOut className="w-4 h-4" />}
            label={t('dashboard.account.logout')}
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
                  {t('dashboard.account.deleteTitle')}
                </p>
                <p className="text-xs text-red-800/90 dark:text-red-300/90 mt-1 leading-relaxed">
                  {t('dashboard.account.deleteDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(true);
                    setDeleteConfirm('');
                  }}
                  className={cn(dashboardBtnDanger, 'mt-3 w-full sm:w-auto min-h-[44px]')}
                >
                  {t('dashboard.account.deleteButton')}
                </button>
                {deleteOpen && (
                  <div className="mt-4 space-y-2 p-3 rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-red-200/80 dark:border-red-800/40">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {t('dashboard.account.deleteConfirmHint')}{' '}
                      <strong className="text-zinc-900 dark:text-zinc-100">{displayEmail}</strong>{' '}
                      {t('dashboard.account.deleteConfirmFor')}
                    </p>
                    <input
                      type="email"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                      placeholder={t('dashboard.account.deleteEmailPlaceholder')}
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
                        {deleteBusy
                          ? t('dashboard.account.deleteBusy')
                          : t('dashboard.account.deleteConfirm')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteOpen(false)}
                        className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 text-sm"
                      >
                        {t('dashboard.account.cancel')}
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
      <div className={cn('mx-auto w-full max-w-lg space-y-4 px-1 pb-28', dashboardPageBg)}>
        <SubPageHeader title={t('dashboard.account.profileTitle')} onBack={() => setView('home')} />

        <Section>
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className={cn(dashboardAvatarFrame, 'size-16 object-cover')}
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-blue-600">
                  <span className="type-heading-sm text-white">
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
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500"
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
                title={t('dashboard.account.removePhoto')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <Field
            icon={<Building2 className="w-4 h-4" />}
            label={t('dashboard.account.studioName')}
            value={studioName}
            onChange={onStudioNameChange}
            placeholder={t('dashboard.account.studioNamePlaceholder')}
          />
          <Field
            icon={<Mail className="w-4 h-4" />}
            label={t('dashboard.account.email')}
            value={email}
            onChange={onEmailChange}
            type="email"
            placeholder="contact@example.com"
            hint={t('dashboard.account.emailHint')}
          />
          <Field
            icon={<Hash className="w-4 h-4" />}
            label={t('dashboard.account.siret')}
            value={siret}
            onChange={(v) => onSiretChange(v.replace(/\D/g, '').slice(0, 14))}
            inputMode="numeric"
            pattern="[0-9\s]*"
            maxLength={14}
            placeholder="12345678900012"
            hint={t('dashboard.account.siretHint')}
          />
        </Section>

        <div className={dashboardStickyActionBar}>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={cn(
              'w-full py-3.5 text-base font-semibold',
              saved ? cn(dashboardBtnPrimary, 'w-full') : cn(dashboardBtnAccent, 'w-full py-3.5'),
              saving && 'opacity-50'
            )}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enregistrement…
              </span>
            ) : saved ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="size-5" />
                Enregistré
              </span>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── FACTURATION ──────────────────────────────────────────────────────────
  if (view === 'facturation') {
    return (
      <div className={cn('mx-auto w-full max-w-3xl px-1 pb-24', dashboardPageBg)}>
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
