import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { FOUNDER_ADMIN_NAV } from '../../lib/founderAdminNav';
import { cn } from '../../lib/utils';

export interface AdminShellProps {
  userDisplayName: string;
  userEmail: string;
  roleLabel?: string;
  pageTitle: string;
  pageSubtitle?: string;
  actions: React.ReactNode;
  onLogout: () => void | Promise<void>;
  /** Ex. `/admin` ou `/admin/revenus-saas` — surligne l’entrée de menu active */
  activeNavPath: string;
  children: React.ReactNode;
}

export function AdminShell({
  userDisplayName,
  userEmail,
  roleLabel = 'Fondateur InkFlow',
  pageTitle,
  pageSubtitle,
  actions,
  onLogout,
  activeNavPath,
  children,
}: AdminShellProps): React.ReactElement {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const NavLinks = ({ onPick }: { onPick?: () => void }) => (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="Sections admin">
      <a
        href="/admin"
        onClick={() => onPick?.()}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]',
          activeNavPath === '/admin'
            ? 'bg-zinc-100 text-zinc-900 shadow-sm'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Tout</span>
        <span className="truncate">Tableau complet</span>
      </a>
      {FOUNDER_ADMIN_NAV.map((item) => {
        const Icon = item.icon;
        const active = activeNavPath === item.path;
        return (
          <a
            key={item.path}
            href={item.path}
            onClick={() => onPick?.()}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]',
              active ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            {item.label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="founder-admin-scroll-root founder-admin-light flex min-h-screen bg-zinc-100 text-zinc-900">
      {/* Sidebar — desktop */}
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex xl:w-64"
        aria-label="Navigation admin"
      >
        <div className="border-b border-zinc-100 px-5 py-6">
          <p className="font-display text-lg font-bold tracking-tight text-zinc-900">InkFlow</p>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">Admin</p>
        </div>
        <div className="flex flex-1 flex-col px-3 py-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <img
              src="/logo-inkflow-if.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl object-contain invert"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{userDisplayName}</p>
              <p className="truncate text-xs text-zinc-500">{roleLabel}</p>
            </div>
          </div>
          <NavLinks />
        </div>
        <div className="border-t border-zinc-100 p-3">
          <p className="mb-2 truncate px-3 text-[11px] text-zinc-400" title={userEmail}>
            {userEmail}
          </p>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-700 active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-zinc-200 bg-white shadow-xl transition-transform lg:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4">
          <span className="font-display font-bold text-zinc-900">InkFlow Admin</span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks onPick={() => setMobileNavOpen(false)} />
        </div>
        <div className="border-t border-zinc-100 p-3">
          <button
            type="button"
            onClick={() => void onLogout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="mt-0.5 rounded-xl border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50 lg:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{pageTitle}</h1>
                {pageSubtitle ? (
                  <p className="mt-1 max-w-2xl text-sm text-zinc-500">{pageSubtitle}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 founder-admin-no-print">{actions}</div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
