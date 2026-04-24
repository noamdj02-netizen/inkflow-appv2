/**
 * Visite guidée avec spotlight : overlay SVG découpé, anneau de focus, tooltip dynamique.
 * Production-ready, accessible, mobile-first.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  /** Optionnel : switch l'onglet avant d'afficher le tooltip (ex. 'requests', 'overview'). */
  tabId?: string;
}

export interface TourStepChangeData {
  nextIndex: number;
}

interface DemoTourProps {
  steps: TourStep[];
  onFinish: () => void;
  /** Optionnel : notifie le parent à chaque changement d’étape (ex. guide vitrine pour ouvrir le modal flash). */
  onStepChange?: (data: TourStepChangeData) => void;
  /** Optionnel : mode contrôlé — le parent pilote l'index. */
  stepIndex?: number;
  /** Optionnel : libellé du bouton à la dernière étape (ex. "Créer mon compte"). */
  lastStepLabel?: string;
  /** Optionnel : lien du bouton à la dernière étape (remplace le bouton "Terminer"). */
  lastStepHref?: string;
}

const SPOTLIGHT_PADDING = 12;
const BADGE_SIZE = 28;
const TOOLTIP_MAX_WIDTH = 380;
const TOOLTIP_MIN_SPACE = 340;
const MOBILE_BREAKPOINT = 480;
const TOOLTIP_MOBILE_PADDING = 16;
const TOOLTIP_MIN_HEIGHT_ESTIMATE = 320;
const SCROLL_DELAY_MS = 380;
const TOOLTIP_VISIBLE_DELAY_MS = 380;
const MASK_TRANSITION = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
const FOCUS_RING_STYLE = {
  boxShadow: '0 0 0 3px #2563eb, 0 0 0 6px rgba(37,99,235,0.25)',
  borderRadius: 10,
};

type TooltipPlacement = 'bottom' | 'top' | 'right' | 'left' | 'center';

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getTargetRect(selector: string): TargetRect | null {
  if (selector === 'body') {
    return {
      x: window.innerWidth / 2 - 1,
      y: window.innerHeight / 2 - 1,
      width: 2,
      height: 2,
    };
  }
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}

function getTooltipPlacement(rect: TargetRect): TooltipPlacement {
  if (rect.width <= 2 && rect.height <= 2) return 'center';
  const vh = window.innerHeight;
  const spaceBelow = vh - (rect.y + rect.height) - 24;
  const spaceAbove = rect.y - 24;
  if (spaceBelow >= TOOLTIP_MIN_SPACE) return 'bottom';
  if (spaceAbove >= TOOLTIP_MIN_SPACE) return 'top';
  const spaceRight = window.innerWidth - (rect.x + rect.width) - 24;
  const spaceLeft = rect.x - 24;
  if (spaceRight >= TOOLTIP_MAX_WIDTH) return 'right';
  if (spaceLeft >= TOOLTIP_MAX_WIDTH) return 'left';
  return 'bottom';
}

function getTooltipPosition(
  rect: TargetRect,
  placement: TooltipPlacement
): { top: number; left: number; arrowPosition: 'bottom' | 'top' | 'left' | 'right' } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < MOBILE_BREAKPOINT;
  const padding = isMobile ? TOOLTIP_MOBILE_PADDING : 12;
  const width = Math.min(TOOLTIP_MAX_WIDTH, vw - padding * 2);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  let left = Math.max(padding, Math.min(cx - width / 2, vw - width - padding));
  if (isMobile) left = padding;

  if (placement === 'center') {
    const tooltipH = Math.min(TOOLTIP_MIN_HEIGHT_ESTIMATE, vh - 48);
    return {
      top: Math.max(padding, Math.min(vh / 2 - tooltipH / 2, vh - tooltipH - padding)),
      left: (vw - width) / 2,
      arrowPosition: 'bottom',
    };
  }

  const gap = isMobile ? 12 : 16;
  const tooltipH = TOOLTIP_MIN_HEIGHT_ESTIMATE;
  let top: number;
  let arrowPosition: 'bottom' | 'top' | 'left' | 'right';

  if (placement === 'bottom') {
    top = rect.y + rect.height + gap;
    arrowPosition = 'top';
    const maxTop = vh - tooltipH - padding;
    if (top + tooltipH > vh - padding) {
      top = Math.max(padding, maxTop);
      arrowPosition = 'top';
    }
  } else if (placement === 'top') {
    top = rect.y - tooltipH - gap;
    arrowPosition = 'bottom';
    if (isMobile && top < padding) {
      top = padding;
      arrowPosition = 'bottom';
    }
  } else if (placement === 'right') {
    top = Math.max(padding, Math.min(cy - 100, vh - tooltipH - padding));
    left = rect.x + rect.width + gap;
    arrowPosition = 'left';
  } else {
    top = Math.max(padding, Math.min(cy - 100, vh - tooltipH - padding));
    left = rect.x - width - gap;
    arrowPosition = 'right';
  }

  left = Math.max(padding, Math.min(left, vw - width - padding));
  /* Clamp top pour éviter que le tooltip soit coupé en bas du viewport */
  const bottomPadding = padding + 24;
  top = Math.max(padding, Math.min(top, vh - tooltipH - bottomPadding));
  return { top, left, arrowPosition };
}

export const DemoTour: React.FC<DemoTourProps> = ({
  steps,
  onFinish,
  onStepChange,
  stepIndex,
  lastStepLabel,
  lastStepHref,
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = stepIndex !== undefined;
  const index = isControlled ? stepIndex : internalIndex;
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<{
    top: number;
    left: number;
    width: number;
    arrowPosition: 'bottom' | 'top' | 'left' | 'right';
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const [maskPath, setMaskPath] = useState<string>('');

  const measureTarget = useCallback(() => {
    const step = steps[index];
    if (!step?.target) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect);
    if (!rect) {
      setTooltipStyle(null);
      setMaskPath('');
      return;
    }
    const placement = getTooltipPlacement(rect);
    const pos = getTooltipPosition(rect, placement);
    const vw = window.innerWidth;
    const width = Math.min(
      TOOLTIP_MAX_WIDTH,
      vw - (vw < MOBILE_BREAKPOINT ? TOOLTIP_MOBILE_PADDING * 2 : 32)
    );
    setTooltipStyle({
      top: pos.top,
      left: pos.left,
      width,
      arrowPosition: pos.arrowPosition,
    });
    if (step.target === 'body') {
      setMaskPath('');
      return;
    }
    const r = 10;
    const x = rect.x - SPOTLIGHT_PADDING;
    const y = rect.y - SPOTLIGHT_PADDING;
    const w = rect.width + SPOTLIGHT_PADDING * 2;
    const h = rect.height + SPOTLIGHT_PADDING * 2;
    const hole = `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    const full = `M 0 0 L ${window.innerWidth} 0 L ${window.innerWidth} ${window.innerHeight} L 0 ${window.innerHeight} Z`;
    setMaskPath(`${full} ${hole}`);
  }, [index, steps]);

  useEffect(() => {
    const step = steps[index];
    if (!step?.target) {
      setVisible(true);
      setTargetRect(null);
      setTooltipStyle(null);
      setMaskPath('');
      return;
    }

    setVisible(false);
    const el =
      step.target === 'body' ? null : (document.querySelector(step.target) as HTMLElement | null);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const t1 = setTimeout(measureTarget, 100);
    const t2 = setTimeout(() => setVisible(true), TOOLTIP_VISIBLE_DELAY_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [index, steps, measureTarget]);

  useEffect(() => {
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  const handleNext = () => {
    if (index >= steps.length - 1) {
      onFinish();
    } else if (isControlled && onStepChange) {
      onStepChange({ nextIndex: index + 1 });
    } else {
      setInternalIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      if (isControlled && onStepChange) {
        onStepChange({ nextIndex: index - 1 });
      } else {
        setInternalIndex((i) => i - 1);
      }
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const step = steps[index];
  if (!step) return null;

  const current = index + 1;
  const total = steps.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div
      className="fixed inset-0 z-[10000]"
      aria-modal="true"
      aria-label="Guide de démonstration"
      role="dialog"
    >
      {/* Overlay SVG avec découpe spotlight */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transition: MASK_TRANSITION }}
        aria-hidden
      >
        <defs>
          <mask id="demo-tour-spotlight-mask">
            <path
              fillRule="evenodd"
              fill="white"
              d={maskPath || 'M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z'}
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#demo-tour-spotlight-mask)"
        />
      </svg>

      {/* Anneau de focus sur l'élément cible */}
      {targetRect && step.target !== 'body' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: targetRect.x - SPOTLIGHT_PADDING,
            top: targetRect.y - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
            ...FOCUS_RING_STYLE,
            transition: MASK_TRANSITION,
          }}
          aria-hidden
        />
      )}

      {/* Badge numéroté */}
      {targetRect && step.target !== 'body' && (
        <div
          className="absolute w-7 h-7 rounded-full bg-[#2563eb] text-white font-bold text-sm flex items-center justify-center pointer-events-none z-[10001]"
          style={{
            left: targetRect.x - 14,
            top: targetRect.y - 14,
            transition: MASK_TRANSITION,
          }}
          aria-hidden
        >
          {current}
        </div>
      )}

      {/* Tooltip — responsive: full width on mobile avec safe-area */}
      <div
        className="absolute z-[10002] pointer-events-auto max-w-[calc(100vw-2rem)] sm:max-w-[380px] pb-[env(safe-area-inset-bottom)]"
        style={
          tooltipStyle
            ? {
                top: tooltipStyle.top,
                left: tooltipStyle.left,
                width: tooltipStyle.width,
                maxWidth: TOOLTIP_MAX_WIDTH,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
              }
            : {
                top: '50%',
                left: '50%',
                width: Math.min(
                  TOOLTIP_MAX_WIDTH,
                  typeof window !== 'undefined' ? window.innerWidth - 32 : 348
                ),
                maxWidth: TOOLTIP_MAX_WIDTH,
                opacity: visible ? 1 : 0,
                transform: visible
                  ? 'translate(-50%, -50%) translateY(0)'
                  : 'translate(-50%, -50%) translateY(8px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
              }
        }
        role="document"
      >
        <div className="rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900 w-full min-w-0 max-w-[calc(100vw-2rem)] sm:max-w-none">
          {/* Flèche vers la cible */}
          {tooltipStyle && step.target !== 'body' && (
            <div
              className="absolute w-3 h-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-sm"
              style={{
                width: 12,
                height: 12,
                borderWidth: '0 1px 1px 0',
                transform:
                  tooltipStyle.arrowPosition === 'bottom'
                    ? 'rotate(225deg)'
                    : tooltipStyle.arrowPosition === 'left'
                      ? 'rotate(-135deg)'
                      : 'rotate(45deg)',
                ...(tooltipStyle.arrowPosition === 'top' && {
                  bottom: '100%',
                  left: 24,
                  marginBottom: -6,
                }),
                ...(tooltipStyle.arrowPosition === 'bottom' && {
                  top: '100%',
                  left: 24,
                  marginTop: -6,
                }),
                ...(tooltipStyle.arrowPosition === 'left' && {
                  right: '100%',
                  top: 24,
                  marginRight: -6,
                  borderWidth: '1px 0 0 1px',
                }),
                ...(tooltipStyle.arrowPosition === 'right' && {
                  left: '100%',
                  top: 24,
                  marginLeft: -6,
                }),
              }}
            />
          )}

          {/* Header */}
          <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {current}
                </span>
                <h3
                  id="demo-tour-title"
                  className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 truncate"
                >
                  {step.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 touch-manipulation"
                aria-label="Passer le guide"
              >
                Passer
              </button>
            </div>
            <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-300"
                style={{ width: `${(current / total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              {current} / {total}
            </p>
          </div>

          {/* Content */}
          <div id="demo-tour-content" className="px-4 sm:px-5 py-4">
            <p className="text-[14px] sm:text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
              {step.content}
            </p>
          </div>

          {/* Footer — boutons touch 44px min sur mobile */}
          <div className="px-4 sm:px-5 pb-5 pt-2 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
            <div>
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-h-[44px] touch-manipulation"
                >
                  ← Précédent
                </button>
              )}
            </div>
            {isLast && lastStepHref ? (
              <a
                href={lastStepHref}
                onClick={handleNext}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity min-h-[44px] touch-manipulation inline-flex items-center justify-center"
              >
                {lastStepLabel ?? 'Créer mon compte'}
              </a>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity min-h-[44px] touch-manipulation"
              >
                {isLast ? (lastStepLabel ?? 'Terminer ✓') : 'Suivant →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
