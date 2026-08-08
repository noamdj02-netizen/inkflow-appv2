import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface AdminDarkModeToggleProps {
  light: boolean;
  onToggle: () => void;
}

/** Thème clair/sombre limité au bloc admin (classe sur le parent). */
export function AdminDarkModeToggle({
  light,
  onToggle,
}: AdminDarkModeToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative h-7 w-14 rounded-full border border-[var(--admin-border)] bg-[var(--admin-card)] transition-all duration-300 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400/35 dark:hover:border-zinc-600"
      aria-label={light ? 'Passer en thème sombre' : 'Passer en thème clair'}
    >
      <div
        className={`absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-text)] transition-transform duration-300 ${
          light ? 'translate-x-0' : 'translate-x-7'
        }`}
      >
        {light ? (
          <Sun className="h-3 w-3 text-[var(--admin-card)]" />
        ) : (
          <Moon className="h-3 w-3 text-[var(--admin-card)]" />
        )}
      </div>
    </button>
  );
}
