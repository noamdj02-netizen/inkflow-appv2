function initialsFromLabel(label: string): string {
  const t = label.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase().slice(0, 2);
  }
  return t.slice(0, 2).toUpperCase();
}

export interface BentoAvatarProps {
  name: string;
  className?: string;
}

/** Pastille initiales — taille fixe 40px pour aligner acomptes / inbox / listes CRM. */
export function BentoAvatar({ name, className = '' }: BentoAvatarProps) {
  return (
    <span
      className={[
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[13px] font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {initialsFromLabel(name)}
    </span>
  );
}
