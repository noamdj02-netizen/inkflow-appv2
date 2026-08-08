import { cn } from '@/lib/utils';

const DASHBOARD_SCREENSHOT = '/images/hero-dashboard-mockup.webp';

/** @efferd/hero-3 — preview dashboard screenshot (partie visuelle hero). */
export function HeroSection({ className }: { className?: string }) {
  return (
    <section className={cn('relative w-full bg-zinc-50', className)}>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-x-6 inset-y-0 -z-10 rounded-full',
          'bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.06),transparent_70%)]',
          'blur-2xl'
        )}
      />
      <div
        className={cn(
          'mask-b-from-70% relative overflow-hidden',
          'fade-in slide-in-from-bottom-5 animate-in fill-mode-backwards duration-1000 ease-out'
        )}
      >
        <div className="relative bg-zinc-50">
          <img
            src={DASHBOARD_SCREENSHOT}
            alt="Aperçu du dashboard InkFlow — agenda, demandes et CRM"
            className="aspect-[16/10] w-full object-cover object-top"
            width={1920}
            height={1200}
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-50/95 to-transparent" />
        </div>
      </div>
    </section>
  );
}
