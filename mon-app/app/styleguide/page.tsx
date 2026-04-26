import type { Metadata } from 'next';

/**
 * Inkflow — Brand Kit / Styleguide
 *
 * Source de vérité : CLAUDE.md (règle absolue : tokens ink.*).
 * Cette page est volontairement AUTONOME : toutes les couleurs sont écrites
 * en arbitrary values Tailwind (`bg-[#c9a96e]`) plutôt que via les tokens
 * du `tailwind.config.ts`, pour rester fidèle à la charte même si la config
 * Tailwind dérive.
 *
 * Usage dev : aller sur /styleguide en local pour vérifier la charte.
 * Typo display : Inter Black (900), chargée dans app/layout.tsx.
 */

export const metadata: Metadata = {
  title: 'Brand Kit — Inkflow',
  description: 'Charte graphique officielle Inkflow : palette, typographie, composants.',
};

// --- Tokens (copiés du CLAUDE.md, source de vérité) ---
const INK = {
  bg: '#0d0d0d',
  surface: '#161616',
  border: '#2a2a2a',
  text: '#e8e3dc',
  muted: '#6b6b6b',
  accent: '#c9a96e',
} as const;

export default function StyleguidePage() {
  return (
    <main
      className="min-h-screen font-sans antialiased"
      style={{
        backgroundColor: INK.bg,
        color: INK.text,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* ─────────────── HERO ─────────────── */}
      <section className="border-b" style={{ borderColor: INK.border }}>
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-widest"
            style={{ borderColor: INK.border, color: INK.muted }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: INK.accent }}
            />
            Brand Kit · v1.0 · MVP 29 mars 2026
          </div>

          <h1
            className="text-ink-display font-black text-balance"
            style={{ color: INK.text }}
          >
            INK<span style={{ color: INK.accent }}>FLOW</span>
          </h1>

          <p
            className="text-ink-lead mt-8 max-w-xl text-balance"
            style={{ color: INK.text }}
          >
            Charte graphique officielle. Dark only. Une seule couleur vive :
            l&apos;ocre cuivré. Typographie Inter, graisse Black pour les titres.
          </p>

          <div
            className="mt-10 grid grid-cols-2 gap-4 border-t pt-8 text-sm sm:grid-cols-4"
            style={{ borderColor: INK.border }}
          >
            <MetaCell label="Mode" value="Dark only" />
            <MetaCell label="Primaire" value="Inter" />
            <MetaCell label="Display" value="Inter Black" />
            <MetaCell label="Accent" value={INK.accent.toUpperCase()} />
          </div>
        </div>
      </section>

      {/* ─────────────── PALETTE ─────────────── */}
      <Section index="01" title="Palette">
        <p
          className="text-ink-body mb-10 max-w-2xl text-pretty"
          style={{ color: INK.muted }}
        >
          Six tokens. Rien d&apos;autre. Toute couleur hors palette est un bug
          design à escalader.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Swatch name="ink.bg" hex={INK.bg} usage="Fond principal — html, main" />
          <Swatch name="ink.surface" hex={INK.surface} usage="Cartes, drawers, inputs" />
          <Swatch name="ink.border" hex={INK.border} usage="Séparateurs, bordures" />
          <Swatch name="ink.text" hex={INK.text} usage="Texte principal (blanc cassé)" />
          <Swatch name="ink.muted" hex={INK.muted} usage="Texte secondaire, placeholders" />
          <Swatch name="ink.accent" hex={INK.accent} usage="CTA, focus, highlights — UNIQUE" />
        </div>

        <div
          className="mt-10 overflow-hidden rounded-xl border"
          style={{ borderColor: INK.border, backgroundColor: INK.surface }}
        >
          <div
            className="border-b px-5 py-3 text-xs uppercase tracking-widest"
            style={{ borderColor: INK.border, color: INK.muted }}
          >
            tailwind.config.ts → extend.colors
          </div>
          <pre
            className="overflow-x-auto px-5 py-5 text-sm leading-relaxed"
            style={{ color: INK.text }}
          >
            <code>{`ink: {
  bg:      '${INK.bg}',   // fond principal
  surface: '${INK.surface}',   // cartes, drawers
  border:  '${INK.border}',   // séparateurs
  text:    '${INK.text}',   // texte principal
  muted:   '${INK.muted}',   // texte secondaire
  accent:  '${INK.accent}',   // ocre cuivré — UNIQUE couleur vive
}`}</code>
          </pre>
        </div>
      </Section>

      {/* ─────────────── TYPOGRAPHIE ─────────────── */}
      <Section index="02" title="Typographie">
        <p
          className="text-ink-body mb-10 max-w-2xl text-pretty"
          style={{ color: INK.muted }}
        >
          Une seule famille : Inter. Les titres sont en Black (900) avec un
          tracking serré pour maximiser la présence. Le corps reste en Regular.
        </p>

        <div className="space-y-8">
          <TypeRow
            label="Display · 900 · text-ink-display"
            meta="clamp fluide (voir globals.css)"
            sample="Studio."
            sampleClassName="text-ink-display font-black"
            sampleStyle={{ color: INK.text }}
          />
          <TypeRow
            label="H1 · 900 · text-ink-h1"
            meta="clamp fluide"
            sample="Réserve ta session."
            sampleClassName="text-ink-h1 font-black"
            sampleStyle={{ color: INK.text }}
          />
          <TypeRow
            label="H2 · 800 · text-ink-h2"
            meta="clamp fluide"
            sample="Clients récurrents"
            sampleClassName="text-ink-h2 font-extrabold"
            sampleStyle={{ color: INK.text }}
          />
          <TypeRow
            label="H3 · 700 · text-ink-h3"
            meta="clamp fluide"
            sample="Prochain rendez-vous"
            sampleClassName="text-ink-h3 font-bold"
            sampleStyle={{ color: INK.text }}
          />
          <TypeRow
            label="Body · 400 · text-ink-body"
            meta="clamp fluide + text-pretty"
            sample="Premier passage sur l'avant-bras gauche. Prévoir 3h de session, pause snack à mi-parcours. Le client a confirmé le paiement de l'acompte le 18 avril."
            sampleClassName="text-ink-body text-pretty font-normal"
            sampleStyle={{ color: INK.text }}
          />
          <TypeRow
            label="Caption · 500 · uppercase · tracking-widest"
            meta="12px / 1.4"
            sample="22 AVR · 14:30 · STUDIO PARIS"
            sampleClassName="font-medium uppercase tracking-widest"
            sampleStyle={{ fontSize: 12, lineHeight: 1.4, color: INK.muted }}
          />
          <TypeRow
            label="Détail / légende · text-ink-detail"
            meta="Lisible sur mobile, pas plus large que le corps"
            sample="Détail : pense en étapes 1-2-3. Même légende sur le carrousel. Ton studio, factuel."
            sampleClassName="text-ink-detail text-pretty font-normal"
            sampleStyle={{ color: INK.muted }}
          />
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {['400', '500', '600', '700', '800', '900'].map((w) => (
            <div
              key={w}
              className="rounded-lg border p-4 text-center"
              style={{ borderColor: INK.border, backgroundColor: INK.surface }}
            >
              <div
                className="text-2xl"
                style={{ fontWeight: Number(w), color: INK.text }}
              >
                Ag
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-widest"
                style={{ color: INK.muted }}
              >
                {w}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─────────────── SPACING / TOUCH ─────────────── */}
      <Section index="03" title="Spacing & Touch">
        <p className="mb-10 max-w-2xl" style={{ color: INK.muted }}>
          Mobile-first absolu. Toute zone cliquable fait au minimum 44×44 px
          (Apple HIG). Les layouts racine intègrent le safe-area-inset.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div
            className="rounded-xl border p-6"
            style={{ borderColor: INK.border, backgroundColor: INK.surface }}
          >
            <div
              className="mb-4 text-xs uppercase tracking-widest"
              style={{ color: INK.muted }}
            >
              Touch target — 44×44 minimum
            </div>
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: INK.accent,
                    color: INK.bg,
                  }}
                >
                  <span className="font-bold">OK</span>
                </div>
                <span className="text-xs" style={{ color: INK.muted }}>
                  44px ✓
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-md"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: INK.border,
                    color: INK.muted,
                  }}
                >
                  <span className="text-xs">NO</span>
                </div>
                <span className="text-xs" style={{ color: INK.muted }}>
                  32px ✗
                </span>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border p-6"
            style={{ borderColor: INK.border, backgroundColor: INK.surface }}
          >
            <div
              className="mb-4 text-xs uppercase tracking-widest"
              style={{ color: INK.muted }}
            >
              Safe-area
            </div>
            <pre
              className="overflow-x-auto text-xs leading-relaxed"
              style={{ color: INK.text }}
            >
              <code>{`<main
  style={{
    paddingBottom:
      'env(safe-area-inset-bottom, 0px)',
    paddingTop:
      'env(safe-area-inset-top, 0px)',
  }}
>`}</code>
            </pre>
            <p className="mt-3 text-xs" style={{ color: INK.muted }}>
              Obligatoire sur tout layout racine. Jamais de{' '}
              <code style={{ color: INK.accent }}>overflow-x</code> sur body.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {[4, 8, 12, 16, 24, 32, 48, 64].map((px) => (
            <div
              key={px}
              className="flex flex-col items-center gap-2 rounded-lg border p-3"
              style={{ borderColor: INK.border, backgroundColor: INK.surface }}
            >
              <div
                style={{
                  width: px,
                  height: px,
                  backgroundColor: INK.accent,
                  borderRadius: 2,
                }}
              />
              <span className="text-[10px]" style={{ color: INK.muted }}>
                {px}px
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ─────────────── COMPOSANTS ─────────────── */}
      <Section index="04" title="Composants">
        <p className="mb-10 max-w-2xl" style={{ color: INK.muted }}>
          Primitives de référence. Toujours construites avec les tokens{' '}
          <code style={{ color: INK.accent }}>ink.*</code>.
        </p>

        {/* Boutons */}
        <SubTitle>Boutons</SubTitle>
        <div className="mb-12 flex flex-wrap gap-3">
          <button
            className="h-11 rounded-full px-6 text-sm font-bold transition active:scale-[0.98]"
            style={{ backgroundColor: INK.accent, color: INK.bg }}
          >
            Réserver
          </button>
          <button
            className="h-11 rounded-full border px-6 text-sm font-semibold transition hover:bg-white/5"
            style={{ borderColor: INK.border, color: INK.text }}
          >
            Voir détail
          </button>
          <button
            className="h-11 rounded-full px-6 text-sm font-medium transition hover:bg-white/5"
            style={{ color: INK.muted }}
          >
            Annuler
          </button>
          <button
            className="h-11 rounded-full px-6 text-sm font-bold opacity-50"
            style={{ backgroundColor: INK.accent, color: INK.bg }}
            disabled
          >
            Disabled
          </button>
        </div>

        {/* Cartes */}
        <SubTitle>Cartes</SubTitle>
        <div className="mb-12 grid gap-4 md:grid-cols-2">
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: INK.border, backgroundColor: INK.surface }}
          >
            <div
              className="mb-3 text-xs uppercase tracking-widest"
              style={{ color: INK.accent }}
            >
              Session
            </div>
            <h4
              className="text-xl font-bold tracking-tight"
              style={{ color: INK.text }}
            >
              Léa · avant-bras gauche
            </h4>
            <p className="mt-2 text-sm" style={{ color: INK.muted }}>
              22 avril 2026 — 14:30 · 3h estimées · acompte réglé
            </p>
            <div
              className="mt-5 flex items-center justify-between border-t pt-4 text-sm"
              style={{ borderColor: INK.border }}
            >
              <span style={{ color: INK.muted }}>Prochaine étape</span>
              <span className="font-semibold" style={{ color: INK.text }}>
                Confirmation J-1
              </span>
            </div>
          </div>

          <div
            className="flex flex-col justify-between rounded-2xl p-6"
            style={{ backgroundColor: INK.accent, color: INK.bg }}
          >
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-widest">
                CTA pleine couleur
              </div>
              <h4 className="text-2xl font-black leading-tight tracking-tight">
                Nouvelle réservation
              </h4>
              <p className="mt-2 text-sm opacity-80">
                Page publique /book/[slug] — accessible sans compte.
              </p>
            </div>
            <button
              className="mt-6 h-11 self-start rounded-full px-6 text-sm font-bold"
              style={{ backgroundColor: INK.bg, color: INK.text }}
            >
              Ouvrir →
            </button>
          </div>
        </div>

        {/* Inputs */}
        <SubTitle>Inputs</SubTitle>
        <div className="mb-12 grid max-w-xl gap-4">
          <label className="block">
            <span
              className="mb-2 block text-xs uppercase tracking-widest"
              style={{ color: INK.muted }}
            >
              Nom du client
            </span>
            <input
              type="text"
              placeholder="Léa Martin"
              className="h-11 w-full rounded-lg border px-4 text-sm outline-none transition focus:ring-2"
              style={{
                borderColor: INK.border,
                backgroundColor: INK.surface,
                color: INK.text,
              }}
            />
          </label>
          <label className="block">
            <span
              className="mb-2 block text-xs uppercase tracking-widest"
              style={{ color: INK.muted }}
            >
              Notes
            </span>
            <textarea
              rows={3}
              placeholder="Zone, style, références..."
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2"
              style={{
                borderColor: INK.border,
                backgroundColor: INK.surface,
                color: INK.text,
              }}
            />
          </label>
        </div>

        {/* Badges */}
        <SubTitle>Badges / Statuts</SubTitle>
        <div className="flex flex-wrap gap-3">
          <Badge color={INK.accent} label="Confirmé" filled />
          <Badge color={INK.accent} label="Acompte reçu" />
          <Badge color={INK.muted} label="En attente" />
          <Badge color="#c44a4a" label="Annulé" />
          <Badge color="#5a8a5a" label="Payé" />
        </div>
      </Section>

      {/* ─────────────── RÈGLES ─────────────── */}
      <Section index="05" title="Règles absolues">
        <div className="grid gap-6 md:grid-cols-2">
          <RuleCard
            tone="do"
            title="À faire"
            items={[
              'Utiliser exclusivement les tokens ink.* définis dans tailwind.config.ts',
              'Mobile-first : CSS mobile en premier, sm: pour les overrides desktop',
              '44×44 px minimum sur toute zone cliquable',
              'safe-area-inset sur chaque layout racine',
              'Tailwind uniquement — pas de CSS modules, pas de styled-components',
              "Imports via l'alias @/ pour src/",
            ]}
          />
          <RuleCard
            tone="dont"
            title="À éviter"
            items={[
              'bg-white ou background: white — 100% dark only',
              'Toute couleur en dur hors palette (pas de #hexXX inline sauf ink.*)',
              'any en TypeScript sauf cas extrême commenté',
              'overflow-x sur body ou html',
              'Dark/light toggle — scope MVP strictement dark',
              'Plus d’une couleur vive : seul ink.accent est autorisé',
            ]}
          />
        </div>
      </Section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer
        className="border-t"
        style={{ borderColor: INK.border, color: INK.muted }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            Inkflow — Brand Kit · Source :{' '}
            <code style={{ color: INK.accent }}>CLAUDE.md</code>
          </div>
          <div>Deadline MVP · 29 mars 2026</div>
        </div>
      </footer>
    </main>
  );
}

/* ─────────────── Sous-composants ─────────────── */

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-widest"
        style={{ color: INK.muted }}
      >
        {label}
      </div>
      <div className="mt-1 font-semibold" style={{ color: INK.text }}>
        {value}
      </div>
    </div>
  );
}

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b" style={{ borderColor: INK.border }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20">
        <div className="mb-10 flex items-baseline gap-4">
          <span
            className="font-black tracking-tight"
            style={{ color: INK.accent, fontSize: 14 }}
          >
            {index}
          </span>
          <h2 className="text-ink-h2 font-black text-balance">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-4 text-xs font-bold uppercase tracking-widest"
      style={{ color: INK.muted }}
    >
      {children}
    </h3>
  );
}

function Swatch({
  name,
  hex,
  usage,
}: {
  name: string;
  hex: string;
  usage: string;
}) {
  const isLight = name === 'ink.text' || name === 'ink.accent';
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: INK.border, backgroundColor: INK.surface }}
    >
      <div
        className="flex h-28 items-end p-4"
        style={{ backgroundColor: hex }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: isLight ? INK.bg : INK.text, opacity: 0.7 }}
        >
          {hex.toUpperCase()}
        </span>
      </div>
      <div className="px-4 py-3">
        <div
          className="font-mono text-sm font-semibold"
          style={{ color: INK.text }}
        >
          {name}
        </div>
        <div className="mt-1 text-xs" style={{ color: INK.muted }}>
          {usage}
        </div>
      </div>
    </div>
  );
}

function TypeRow({
  label,
  meta,
  sample,
  sampleClassName,
  sampleStyle,
}: {
  label: string;
  meta: string;
  sample: string;
  sampleClassName?: string;
  sampleStyle?: React.CSSProperties;
}) {
  return (
    <div
      className="border-t pt-6 sm:grid sm:grid-cols-[220px_1fr] sm:gap-8"
      style={{ borderColor: INK.border }}
    >
      <div className="mb-3 sm:mb-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: INK.muted }}
        >
          {label}
        </div>
        <div
          className="mt-1 font-mono text-xs"
          style={{ color: INK.muted, opacity: 0.7 }}
        >
          {meta}
        </div>
      </div>
      <div
        className={sampleClassName}
        style={{ ...sampleStyle, color: sampleStyle?.color ?? INK.text }}
      >
        {sample}
      </div>
    </div>
  );
}

function Badge({
  color,
  label,
  filled = false,
}: {
  color: string;
  label: string;
  filled?: boolean;
}) {
  if (filled) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
        style={{ backgroundColor: color, color: INK.bg }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: INK.bg }}
        />
        {label}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{ borderColor: color, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function RuleCard({
  tone,
  title,
  items,
}: {
  tone: 'do' | 'dont';
  title: string;
  items: string[];
}) {
  const isDo = tone === 'do';
  const mark = isDo ? '✓' : '✕';
  const markBg = isDo ? INK.accent : '#c44a4a';
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: INK.border, backgroundColor: INK.surface }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black"
          style={{ backgroundColor: markBg, color: INK.bg }}
        >
          {mark}
        </span>
        <h3 className="text-xl font-bold" style={{ color: INK.text }}>
          {title}
        </h3>
      </div>
      <ul className="space-y-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-3" style={{ color: INK.text }}>
            <span className="mt-[2px] select-none" style={{ color: markBg }}>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
