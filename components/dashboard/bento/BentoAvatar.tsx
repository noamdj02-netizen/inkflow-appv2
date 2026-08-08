import { ClientPhotoAvatar } from '@/components/common/ClientPhotoAvatar';
import { cn } from '@/lib/utils';

export interface BentoAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

/** Pastille 40px — photo client ou initiales (aligné agenda / CRM). */
export function BentoAvatar({ name, src, className = '' }: BentoAvatarProps) {
  return (
    <span
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 text-[13px] font-semibold uppercase text-zinc-700 ring-1 ring-black/[0.04] dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/[0.06]',
        className
      )}
      aria-hidden
    >
      <ClientPhotoAvatar
        name={name}
        src={src}
        className="size-full"
        textClassName="text-[13px] font-semibold uppercase text-zinc-700 dark:text-zinc-200"
        imgClassName="rounded-full"
      />
    </span>
  );
}
