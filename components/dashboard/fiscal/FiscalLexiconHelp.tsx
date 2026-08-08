import React from 'react';
import { CircleHelp } from 'lucide-react';
import { Modal } from '../../ui/Modal';

interface FiscalLexiconHelpProps {
  title: string;
  children: React.ReactNode;
  /** Accessible short label when icon only */
  label: string;
}

/** Lexique PRD : une phrase d’aide par métrique, ouverte en modal légère. */
export const FiscalLexiconHelp: React.FC<FiscalLexiconHelpProps> = ({ title, children, label }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={label}
        aria-label={label}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
      >
        <CircleHelp className="w-4 h-4" />
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={title} size="sm">
        <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-2">
          {children}
        </div>
      </Modal>
    </>
  );
};
