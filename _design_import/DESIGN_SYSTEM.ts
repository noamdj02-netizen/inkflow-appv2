/**
 * 🎨 InkFlow Dashboard Design System
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * A modern, maintainable design system for the dashboard overview.
 * Organized by intent, not by implementation details.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Primary hierarchy:
 * - Blue (primary actions, brand)
 * - Zinc (neutral, surfaces, backgrounds)
 * - Semantic colors (emerald/growth, rose/decline, amber/pending, violet/premium)
 */

const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  semantic: {
    success: { bg: '#ecfdf5', text: '#065f46', icon: '#10b981' },
    warning: { bg: '#fefce8', text: '#92400e', icon: '#f59e0b' },
    error: { bg: '#fef2f2', text: '#7f1d1d', icon: '#ef4444' },
    info: { bg: '#eff6ff', text: '#1e40af', icon: '#3b82f6' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. SPACING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 4px base unit → 8px rhythm for natural, readable layouts
 * Breakpoints: mobile-first (sm: 640, md: 768, lg: 1024, xl: 1280, 2xl: 1536)
 */

const SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem', // 48px
};

const SECTION_GAPS = {
  mobile: '0.75rem', // 12px
  tablet: '1rem', // 16px
  desktop: '1.5rem', // 24px
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hierarchy:
 * - Display: 28-32px (rare, hero/page title only on desktop)
 * - Heading: 20-24px (section titles)
 * - Subheading: 16-18px (card titles)
 * - Body: 14-16px (main content, default 16px for accessibility)
 * - Caption: 12px (labels, secondary info)
 * - Tiny: 11px (badges, fine print only)
 *
 * Line-height: 1.5 (body), 1.2 (headings)
 * Letter-spacing: -0.02em (tight, headings), 0 (body), +0.05em (labels)
 */

const TYPOGRAPHY = {
  // Responsive heading
  heading: {
    mobile: 'text-xl font-bold leading-tight', // 20px
    desktop: 'text-2xl font-bold leading-snug', // 24px
  },
  // Card/section title
  subheading: {
    mobile: 'text-base font-semibold leading-tight', // 16px
    desktop: 'text-lg font-semibold leading-snug', // 18px
  },
  // Body text (default)
  body: {
    base: 'text-base leading-relaxed', // 16px
    mobile: 'text-sm leading-normal', // 14px on constraints
  },
  // Labels, captions
  caption: 'text-xs font-medium text-zinc-500 dark:text-zinc-400',
  // Tiny (avoid, use sparingly)
  tiny: 'text-[11px] font-medium text-zinc-400 dark:text-zinc-500',
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. BORDER & SHADOW
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Borders: Always use semantic or relative colors, never raw hex.
 * Shadows: Elevation layers (sm, md, lg); reduced on dark mode.
 */

const BORDERS = {
  // Default surface divider
  divider: 'border-zinc-200/80 dark:border-zinc-800',
  // Interactive element
  interactive: 'border-zinc-300 dark:border-zinc-700',
  // Focus ring
  focus:
    'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900',
};

const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  // Elevated card
  card: 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]',
  // Inset top edge (subtle light leak)
  insetLight: '[box-shadow:0_1px_0_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(15,23,42,0.04)]',
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. COMPONENTS — Base Classes
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// CARDS
// ─────────────────────────────────────────────────────────────────────────

const CARDS = {
  // Standard card (rounded-3xl, border, soft shadow)
  base: 'rounded-3xl border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70',

  // Desktop-specific (larger padding, inset ring)
  desktop: 'rounded-[1.25rem] p-6 ring-1 ring-inset ring-zinc-900/[0.04] dark:ring-white/[0.05]',

  // Interactive hover
  interactive: 'hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-shadow',
};

// ─────────────────────────────────────────────────────────────────────────
// BUTTONS
// ─────────────────────────────────────────────────────────────────────────

const BUTTONS = {
  // Primary action
  primary:
    'min-h-11 px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98]',

  // Secondary (outline)
  secondary:
    'min-h-11 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-semibold transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800',

  // Icon button (44×44 touch target minimum)
  icon: 'min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.97] motion-reduce:active:scale-100',

  // Small button (fit content, no padding enforcement)
  sm: 'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
};

// ─────────────────────────────────────────────────────────────────────────
// BADGES / PILLS
// ─────────────────────────────────────────────────────────────────────────

const BADGES = {
  // Pending / Warning
  pending:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',

  // Neutral / Info
  neutral:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200/90 text-zinc-800 dark:bg-zinc-600/30 dark:text-zinc-200',

  // Success / Growth
  growth:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',

  // Decline
  decline:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',

  // Premium / VIP (bleu marque — aligné UI accueil)
  vip: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200',
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. KPI WIDGET SHELLS
// ═══════════════════════════════════════════════════════════════════════════

const KPI_SHELLS = {
  // Desktop
  desktop: {
    outer: 'p-5 h-full flex flex-col justify-between min-h-[130px] min-w-0',
    caption: 'text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight shrink-0',
    metric: 'text-2xl font-bold text-numeric tabular-nums tracking-tight mt-2',
    icon: 'w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0',
  },

  // Mobile
  mobile: {
    outer:
      'h-full min-w-0 min-h-[128px] flex flex-row rounded-[1.25rem] border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#1C1C1E] shadow-[0_2px_12px_rgba(15,23,42,0.06)] dark:shadow-none overflow-hidden',
    inner: 'flex flex-1 min-h-0 min-w-0 flex-col justify-between gap-0.5 p-3.5 min-[400px]:p-4',
    strip: 'w-[3px] shrink-0 self-stretch',
    caption:
      'text-[12px] font-medium text-zinc-500 dark:text-zinc-400 leading-snug pr-1 tracking-tight',
    metric:
      'text-[28px] min-[400px]:text-[32px] font-semibold tabular-nums tracking-[-0.03em] text-numeric leading-none',
    icon: 'shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-zinc-100/95 dark:bg-zinc-800/95 active:scale-[0.97] active:opacity-80 transition-all motion-reduce:active:scale-100',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. LAYOUT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const LAYOUTS = {
  // Mobile-first responsive grid
  mobileGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4',

  // Three-column dashboard layout
  dashboard: 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start',

  // Two-column sidebar (8 + 4)
  withSidebar: 'lg:col-span-8 space-y-6',
  sidebar: 'lg:col-span-4 space-y-6',
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. ANIMATION & MOTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Always respect prefers-reduced-motion.
 * Durations: 150-300ms for micro-interactions
 * Easing: spring (playful) or ease-out (professional)
 */

const MOTION = {
  durations: {
    micro: 150, // Button, toggle
    short: 200, // Card expand, fade
    medium: 300, // Modal, nav
  },
  spring: {
    stiffness: 400,
    damping: 32,
    mass: 0.86,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. ACCESSIBILITY
// ═══════════════════════════════════════════════════════════════════════════

const A11Y = {
  // Touch targets: minimum 44×44px (iOS) or 48×48dp (Android)
  touchTarget: 'min-h-[44px] min-w-[44px]',

  // Spacing between targets: 8px minimum
  touchGap: 'gap-2',

  // Focus ring
  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900',

  // Text contrast: 4.5:1 (normal), 3:1 (large)
  contrastHigh: 'text-zinc-900 dark:text-white', // 4.5:1
  contrastNormal: 'text-zinc-700 dark:text-zinc-200', // ~4:1
  contrastSecondary: 'text-zinc-600 dark:text-zinc-300', // ~3:1

  // Reduced motion
  reducedMotion: 'motion-reduce:transition-none motion-reduce:animate-none',
};

// ═══════════════════════════════════════════════════════════════════════════
// 10. RESPONSIVE BREAKPOINTS & STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mobile-first:
 * - Default: mobile (320-639px)
 * - sm: 640px (larger phone)
 * - md: 768px (tablet portrait) — often a transition point
 * - lg: 1024px (tablet landscape, small desktop)
 * - xl: 1280px (desktop)
 * - 2xl: 1536px (large desktop)
 *
 * Use `useBreakpointMd()` hook to mount/unmount entire layout sections.
 * Use Tailwind classes for granular responsive styling within sections.
 */

const RESPONSIVE = {
  // Mobile-first margins/padding
  containerPadding: 'px-3.5 sm:px-4 md:px-5 lg:px-6',

  // Layout shift point: use `useBreakpointMd()` to mount/unmount
  layoutShift: 'md',

  // Content max-width
  maxWidth: 'max-w-[min(1800px,100%)]',
};

// ═══════════════════════════════════════════════════════════════════════════
// 11. USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ✅ GOOD: Semantic use of design tokens
 * ──────────────────────────────────────
 * <div className={cn(CARDS.base, CARDS.interactive)}>
 *   <p className={TYPOGRAPHY.subheading.mobile}>Title</p>
 *   <p className={cn(TYPOGRAPHY.caption, A11Y.contrastSecondary)}>Subtitle</p>
 * </div>
 *
 * ❌ BAD: Hardcoded colors, no token reuse
 * ───────────────────────────────────────
 * <div className="rounded-3xl bg-white border border-[#e5e5e5] shadow-sm">
 *   <p className="text-base font-semibold">Title</p>
 *   <p className="text-xs text-[#737373]">Subtitle</p>
 * </div>
 *
 * ✅ GOOD: Responsive with proper accessibility
 * ──────────────────────────────────────────────
 * <button className={cn(BUTTONS.primary, A11Y.focusRing, 'active:scale-[0.98]')}>
 *   Action
 * </button>
 *
 * ✅ GOOD: Mobile-first responsive grid
 * ──────────────────────────────────────
 * <div className={LAYOUTS.mobileGrid}>
 *   {kpis.map(kpi => <KpiCard key={kpi.id} {...kpi} />)}
 * </div>
 */

// ═══════════════════════════════════════════════════════════════════════════
// 12. DARK MODE CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Every surface and text color must work in both light & dark.
 * Use semantic color pairs (light/dark) — never hardcoded colors.
 *
 * ✓ Text: text-zinc-900 dark:text-white (4.5:1 in both)
 * ✓ Secondary: text-zinc-600 dark:text-zinc-300 (3:1 in both)
 * ✓ Backgrounds: bg-white/95 dark:bg-zinc-900/70
 * ✓ Borders: border-zinc-200/80 dark:border-zinc-800
 *
 * Always test in both light & dark modes before shipping.
 */

export {
  COLORS,
  SPACING,
  SECTION_GAPS,
  TYPOGRAPHY,
  BORDERS,
  SHADOWS,
  CARDS,
  BUTTONS,
  BADGES,
  KPI_SHELLS,
  LAYOUTS,
  MOTION,
  A11Y,
  RESPONSIVE,
};
