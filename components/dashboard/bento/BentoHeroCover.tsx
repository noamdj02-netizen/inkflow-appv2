import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { optimizeDashboardHeroImageUrl } from '@/lib/optimizeDashboardHeroImageUrl';

interface BentoHeroCoverProps {
  url: string | null | undefined;
  className?: string;
}

/**
 * Couverture hero mobile — preload + URL réduite, sans lazy (above the fold).
 */
export function BentoHeroCover({ url, className }: BentoHeroCoverProps) {
  const raw = url?.trim() || null;
  const optimizedSrc = useMemo(() => optimizeDashboardHeroImageUrl(url, 720), [url]);
  const [useOriginal, setUseOriginal] = useState(false);
  const displaySrc = useOriginal && raw ? raw : optimizedSrc;

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUseOriginal(false);
  }, [raw]);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    if (!displaySrc) return;

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!cancelled) setReady(true);
    };
    img.onerror = () => {
      if (!cancelled) {
        if (!useOriginal && raw && optimizedSrc && raw !== optimizedSrc) {
          setUseOriginal(true);
          return;
        }
        setFailed(true);
      }
    };
    img.src = displaySrc;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [displaySrc, raw, optimizedSrc, useOriginal]);

  if (!displaySrc || failed) {
    return <div className={cn('absolute inset-0 z-0 bg-zinc-900', className)} aria-hidden />;
  }

  return (
    <>
      <div
        className={cn(
          'absolute inset-0 z-0 bg-zinc-900 transition-opacity duration-300',
          ready ? 'opacity-0' : 'opacity-100',
          className
        )}
        aria-hidden
      />
      <img
        src={displaySrc}
        alt=""
        width={720}
        height={400}
        decoding="async"
        loading="eager"
        fetchPriority="high"
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)}
        className={cn(
          'pointer-events-none absolute inset-0 z-0 h-full w-full max-w-none object-cover object-[center_24%] transition-opacity duration-300',
          ready ? 'opacity-100' : 'opacity-0'
        )}
      />
    </>
  );
}
