import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { Bell, Search } from 'lucide-react';

/** @efferd/header-3 — barre chrome dashboard InkFlow (preview landing). */
export function Header({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-3 py-2.5 backdrop-blur-sm sm:px-4',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo size="xs" />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-zinc-900">InkFlow</p>
          <p className="truncate text-[10px] text-zinc-500">Dashboard Pro</p>
        </div>
      </div>
      <nav className="hidden items-center gap-1 sm:flex" aria-label="Navigation dashboard (aperçu)">
        {['Accueil', 'Agenda', 'Demandes', 'Clients'].map((item, i) => (
          <span
            key={item}
            className={cn(
              'rounded-lg px-2 py-1 text-[10px] font-medium',
              i === 0 ? 'bg-zinc-900 text-white' : 'text-zinc-500'
            )}
          >
            {item}
          </span>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-1.5 text-zinc-400">
        <Search className="size-3.5" strokeWidth={2} aria-hidden />
        <Bell className="size-3.5" strokeWidth={2} aria-hidden />
        <span className="hidden size-6 rounded-full bg-zinc-200 sm:inline-block" aria-hidden />
      </div>
    </header>
  );
}
