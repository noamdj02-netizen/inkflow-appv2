# Inkflow Discover — "TripAdvisor du Tatouage"
> Prompt Claude Code — Feature complète backend + frontend
> Stack : Next.js 14 App Router · TypeScript · Supabase · Tailwind · Design system Inkflow

---

## 📌 Vision

Construire une couche publique de découverte par-dessus les vitrines existantes (`/p/[slug]`).
Objectif : n'importe qui sur Google tape "tatoueur réalisme Paris" → tombe sur Inkflow.
L'artiste n'a rien à faire : sa vitrine alimente automatiquement le directory.

**URL racine** : `/discover`

---

## 🗺️ Arborescence des pages à créer

```
/discover                          → Homepage discovery (hero + search + featured)
/discover/[city]                   → Ex: /discover/paris
/discover/[city]/[style]           → Ex: /discover/paris/realisme
/discover/map                      → Carte interactive (Leaflet)
/discover/styles                   → Index de tous les styles
/discover/trending                 → Artistes tendance

/p/[slug]                          → (existant) + ajout bloc rating + lien discover
/api/discover/search               → GET — recherche full-text + filtres
/api/discover/trending             → GET — top artistes
/api/reviews/[studioId]            → GET / POST
/api/reviews/[reviewId]/vote       → POST (utile/pas utile)
```

---

## 🗄️ PARTIE 1 — BASE DE DONNÉES (Supabase)

### 1.1 — Enrichissement de `inkflow_studios`

```sql
-- Migration : 20240401_discover_enrich_studios.sql
ALTER TABLE inkflow_studios
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS city_slug TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'FR',
  ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS styles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_min INTEGER,         -- en euros
  ADD COLUMN IF NOT EXISTS price_max INTEGER,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portfolio_cover_url TEXT,  -- 1ère photo du portfolio (dénormalisée)
  ADD COLUMN IF NOT EXISTS portfolio_preview JSONB DEFAULT '[]', -- 3 URLs pour les cards
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS discover_rank INTEGER DEFAULT 0; -- score composite pour tri

-- Index géospatial (approximatif, suffit pour MVP)
CREATE INDEX IF NOT EXISTS idx_studios_city_slug ON inkflow_studios(city_slug);
CREATE INDEX IF NOT EXISTS idx_studios_styles ON inkflow_studios USING GIN(styles);
CREATE INDEX IF NOT EXISTS idx_studios_discoverable ON inkflow_studios(is_discoverable) WHERE is_discoverable = TRUE;
CREATE INDEX IF NOT EXISTS idx_studios_rank ON inkflow_studios(discover_rank DESC) WHERE is_discoverable = TRUE;
CREATE INDEX IF NOT EXISTS idx_studios_geo ON inkflow_studios(lat, lng) WHERE lat IS NOT NULL;
```

### 1.2 — Table `inkflow_reviews`

```sql
-- Migration : 20240401_discover_reviews.sql
CREATE TABLE IF NOT EXISTS inkflow_reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,

  -- Auteur (client)
  client_name TEXT NOT NULL,                -- affiché publiquement (prénom + initiale)
  client_email TEXT NOT NULL,               -- haché pour unicité, jamais affiché
  client_email_hash TEXT NOT NULL,          -- SHA256 de l'email normalisé (lowercase + trim)

  -- Corps de l'avis
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,                                -- optionnel, max 1000 chars
  tattoo_style TEXT,                        -- style du tatouage reçu
  tattoo_photo_url TEXT,                    -- photo du résultat (optionnel)

  -- Vérification
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,        -- TRUE si lié à un vrai RDV Inkflow

  -- Modération
  status TEXT DEFAULT 'pending'             -- 'pending' | 'approved' | 'rejected'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_at TIMESTAMPTZ,
  moderation_reason TEXT,

  -- Réponse du tatoueur
  reply_body TEXT,
  reply_at TIMESTAMPTZ,

  -- Votes utilité
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_email_studio
  ON inkflow_reviews(client_email_hash, studio_id);  -- 1 avis par email par artiste

CREATE INDEX IF NOT EXISTS idx_reviews_studio_approved
  ON inkflow_reviews(studio_id, created_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_reviews_appointment
  ON inkflow_reviews(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- RLS
ALTER TABLE inkflow_reviews ENABLE ROW LEVEL SECURITY;

-- Public : lire les avis approuvés uniquement
CREATE POLICY "reviews_public_read" ON inkflow_reviews
  FOR SELECT USING (status = 'approved');

-- Public : poster un avis (pending par défaut)
CREATE POLICY "reviews_public_insert" ON inkflow_reviews
  FOR INSERT WITH CHECK (status = 'pending');

-- Tatoueur : lire TOUS ses avis + répondre
CREATE POLICY "reviews_owner_manage" ON inkflow_reviews
  FOR ALL USING (
    studio_id IN (
      SELECT id FROM inkflow_studios
      WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
    )
  );
```

### 1.3 — Table `inkflow_review_votes`

```sql
-- Migration : 20240401_discover_votes.sql
CREATE TABLE IF NOT EXISTS inkflow_review_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  review_id TEXT NOT NULL REFERENCES inkflow_reviews(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,          -- hash IP+UA, pas de compte requis
  vote TEXT NOT NULL CHECK (vote IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, voter_fingerprint)
);
```

### 1.4 — Table `inkflow_city_pages` (SEO)

```sql
-- Migration : 20240401_discover_cities.sql
CREATE TABLE IF NOT EXISTS inkflow_city_pages (
  slug TEXT PRIMARY KEY,                    -- ex: 'paris', 'lyon', 'marseille'
  name TEXT NOT NULL,                       -- ex: 'Paris'
  department TEXT,                          -- ex: '75'
  region TEXT,                             -- ex: 'Île-de-France'
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  artist_count INTEGER DEFAULT 0,          -- dénormalisé, mis à jour par trigger
  meta_description TEXT,                   -- override SEO
  hero_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : mise à jour automatique du discover_rank après un avis
CREATE OR REPLACE FUNCTION update_studio_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inkflow_studios
  SET
    rating_avg = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0)
      FROM inkflow_reviews
      WHERE studio_id = NEW.studio_id AND status = 'approved'
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM inkflow_reviews
      WHERE studio_id = NEW.studio_id AND status = 'approved'
    ),
    -- Score composite : avg * log(count+1) * recency_factor
    discover_rank = (
      SELECT (
        COALESCE(AVG(rating), 0) *
        LN(COUNT(*) + 1) *
        (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 2592000))
      )::INTEGER
      FROM inkflow_reviews
      WHERE studio_id = NEW.studio_id AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = NEW.studio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_studio_rating
AFTER INSERT OR UPDATE ON inkflow_reviews
FOR EACH ROW EXECUTE FUNCTION update_studio_rating();
```

### 1.5 — Mettre à jour `inkflow_vitrine_data` → sync automatique

```sql
-- Trigger : quand vitrine_data change, sync les colonnes discover de inkflow_studios
CREATE OR REPLACE FUNCTION sync_studio_discover_fields()
RETURNS TRIGGER AS $$
DECLARE
  vdata JSONB := NEW.data;
BEGIN
  UPDATE inkflow_studios SET
    bio                 = vdata->>'bio',
    instagram           = vdata->>'instagram',
    portfolio_cover_url = (vdata->'photos'->0->>'url'),
    portfolio_preview   = COALESCE(
                            (SELECT jsonb_agg(p->'url')
                             FROM jsonb_array_elements(vdata->'photos') AS p
                             LIMIT 3),
                            '[]'::jsonb
                          ),
    last_active_at      = NOW()
  WHERE id = NEW.studio_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_discover_fields
AFTER INSERT OR UPDATE ON inkflow_vitrine_data
FOR EACH ROW EXECUTE FUNCTION sync_studio_discover_fields();
```

---

## ⚙️ PARTIE 2 — API ROUTES

### 2.1 — `src/app/api/discover/search/route.ts`

```typescript
// GET /api/discover/search?city=paris&style=realisme&q=alice&price_max=200&page=1&per_page=12
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const city      = searchParams.get('city')?.toLowerCase()
  const style     = searchParams.get('style')?.toLowerCase()
  const q         = searchParams.get('q')?.trim()
  const priceMax  = searchParams.get('price_max') ? Number(searchParams.get('price_max')) : null
  const priceMin  = searchParams.get('price_min') ? Number(searchParams.get('price_min')) : null
  const sort      = searchParams.get('sort') ?? 'rank'   // 'rank' | 'rating' | 'recent'
  const page      = Math.max(1, Number(searchParams.get('page') ?? 1))
  const perPage   = Math.min(24, Number(searchParams.get('per_page') ?? 12))

  const supabase = createClient()
  let query = supabase
    .from('inkflow_studios')
    .select(`
      id, slug, name, studio_name, city, city_slug,
      styles, bio, instagram,
      price_min, price_max,
      rating_avg, rating_count,
      portfolio_cover_url, portfolio_preview,
      lat, lng, last_active_at, discover_rank
    `, { count: 'exact' })
    .eq('is_discoverable', true)

  if (city)     query = query.eq('city_slug', city)
  if (style)    query = query.contains('styles', [style])
  if (priceMax) query = query.lte('price_min', priceMax)
  if (priceMin) query = query.gte('price_max', priceMin)
  if (q)        query = query.or(`name.ilike.%${q}%,studio_name.ilike.%${q}%,bio.ilike.%${q}%`)

  const sortMap = {
    rank:   { column: 'discover_rank', ascending: false },
    rating: { column: 'rating_avg',    ascending: false },
    recent: { column: 'last_active_at', ascending: false },
  }
  const { column, ascending } = sortMap[sort as keyof typeof sortMap] ?? sortMap.rank
  query = query.order(column, { ascending }).order('id', { ascending: true })

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    artists: data,
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  })
}
```

### 2.2 — `src/app/api/reviews/[studioId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { z } from 'zod'

const PostSchema = z.object({
  client_name:   z.string().min(2).max(60),
  client_email:  z.string().email(),
  rating:        z.number().int().min(1).max(5),
  body:          z.string().max(1000).optional(),
  tattoo_style:  z.string().optional(),
  tattoo_photo_url: z.string().url().optional(),
  appointment_id: z.string().optional(),
})

// GET — liste des avis approuvés
export async function GET(req: NextRequest, { params }: { params: { studioId: string } }) {
  const supabase = createClient()
  const page = Number(req.nextUrl.searchParams.get('page') ?? 1)
  const from = (page - 1) * 10

  const { data, error, count } = await supabase
    .from('inkflow_reviews')
    .select('id, client_name, rating, body, tattoo_style, tattoo_photo_url, is_verified, reply_body, reply_at, helpful_count, created_at', { count: 'exact' })
    .eq('studio_id', params.studioId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, from + 9)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data, total: count ?? 0, page })
}

// POST — soumettre un avis
export async function POST(req: NextRequest, { params }: { params: { studioId: string } }) {
  const body = await req.json()
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { client_email, ...rest } = parsed.data
  const emailHash = createHash('sha256').update(client_email.toLowerCase().trim()).digest('hex')

  // Vérifier si le RDV appartient bien à ce studio (optionnel mais sécurisé)
  let isVerified = false
  if (rest.appointment_id) {
    const supabase = createClient()
    const { data: appt } = await supabase
      .from('inkflow_appointments')
      .select('id, studio_id, client_email')
      .eq('id', rest.appointment_id)
      .single()
    if (appt?.studio_id === params.studioId && appt.client_email === client_email) {
      isVerified = true
    }
  }

  const supabase = createClient()
  const { error } = await supabase.from('inkflow_reviews').insert({
    id: crypto.randomUUID(),
    studio_id: params.studioId,
    client_name: rest.client_name,
    client_email,
    client_email_hash: emailHash,
    rating: rest.rating,
    body: rest.body,
    tattoo_style: rest.tattoo_style,
    tattoo_photo_url: rest.tattoo_photo_url,
    appointment_id: rest.appointment_id,
    is_verified: isVerified,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour cet artiste.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: envoyer email de confirmation (Resend) + notifier le tatoueur (inkflow_notifications)

  return NextResponse.json({ success: true, message: 'Votre avis a été soumis et sera publié après modération.' }, { status: 201 })
}
```

### 2.3 — `src/app/api/reviews/[studioId]/reply/route.ts`

```typescript
// POST — réponse du tatoueur à un avis (auth requise)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ReplySchema = z.object({
  review_id: z.string(),
  reply_body: z.string().min(1).max(500),
})

export async function POST(req: NextRequest, { params }: { params: { studioId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifier propriété du studio
  const { data: studio } = await supabase
    .from('inkflow_studios')
    .select('id')
    .eq('id', params.studioId)
    .eq('email', user.email)
    .single()
  if (!studio) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const parsed = ReplySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { error } = await supabase
    .from('inkflow_reviews')
    .update({ reply_body: parsed.data.reply_body, reply_at: new Date().toISOString() })
    .eq('id', parsed.data.review_id)
    .eq('studio_id', params.studioId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

### 2.4 — `src/app/api/discover/trending/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // cache 1h

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inkflow_studios')
    .select('id, slug, name, studio_name, city, styles, rating_avg, rating_count, portfolio_cover_url, portfolio_preview')
    .eq('is_discoverable', true)
    .gte('rating_count', 3)      // au moins 3 avis
    .order('discover_rank', { ascending: false })
    .limit(8)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ artists: data })
}
```

---

## 🎨 PARTIE 3 — COMPOSANTS UI

### 3.1 — `src/components/discover/ArtistCard.tsx`

```typescript
// Card artiste réutilisée dans toutes les pages discover
// Respecte le design system Inkflow — jamais de fond blanc

import Image from 'next/image'
import Link from 'next/link'
import { StarRating } from '@/components/discover/StarRating'
import { StyleBadge } from '@/components/discover/StyleBadge'

interface ArtistCardProps {
  slug: string
  name: string
  studioName: string
  city?: string
  styles?: string[]
  ratingAvg?: number
  ratingCount?: number
  priceMin?: number
  portfolioCover?: string
  portfolioPreview?: string[]
  isVerified?: boolean
}

export function ArtistCard({
  slug, name, studioName, city, styles = [], ratingAvg = 0,
  ratingCount = 0, priceMin, portfolioCover, portfolioPreview = [], isVerified,
}: ArtistCardProps) {
  return (
    <Link
      href={`/p/${slug}`}
      className="group block rounded-xl overflow-hidden bg-ink-surface border border-ink-border hover:border-ink-accent/50 transition-all duration-200"
    >
      {/* Cover photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-bg">
        {portfolioCover ? (
          <Image
            src={portfolioCover}
            alt={`Tatouages par ${name}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-ink-muted text-sm">Aucune photo</span>
          </div>
        )}
        {isVerified && (
          <span className="absolute top-2 right-2 bg-ink-accent text-ink-bg text-xs font-semibold px-2 py-0.5 rounded-full">
            ✓ Vérifié
          </span>
        )}
      </div>

      {/* Preview strip — 3 petites photos */}
      {portfolioPreview.length >= 2 && (
        <div className="flex gap-0.5 h-14">
          {portfolioPreview.slice(0, 3).map((url, i) => (
            <div key={i} className="relative flex-1 overflow-hidden bg-ink-bg">
              <Image src={url} alt="" fill className="object-cover" sizes="80px" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Infos */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-ink-text font-semibold text-sm leading-tight">{name}</p>
          {studioName !== name && (
            <p className="text-ink-muted text-xs">{studioName}</p>
          )}
          {city && <p className="text-ink-muted text-xs mt-0.5">📍 {city}</p>}
        </div>

        {/* Styles */}
        {styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {styles.slice(0, 3).map(s => <StyleBadge key={s} style={s} />)}
            {styles.length > 3 && (
              <span className="text-xs text-ink-muted">+{styles.length - 3}</span>
            )}
          </div>
        )}

        {/* Rating + prix */}
        <div className="flex items-center justify-between">
          <StarRating avg={ratingAvg} count={ratingCount} />
          {priceMin != null && (
            <span className="text-ink-accent text-xs font-medium">à partir de {priceMin}€</span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

### 3.2 — `src/components/discover/StarRating.tsx`

```typescript
// Affichage rating — étoiles + count
export function StarRating({ avg, count, size = 'sm' }: { avg: number; count: number; size?: 'sm' | 'md' }) {
  const stars = Math.round(avg)
  const sizeCls = size === 'md' ? 'text-base' : 'text-xs'
  return (
    <div className={`flex items-center gap-1 ${sizeCls}`}>
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= stars ? 'text-ink-accent' : 'text-ink-border'}>★</span>
        ))}
      </div>
      <span className="text-ink-muted text-xs">
        {avg > 0 ? `${avg.toFixed(1)} (${count})` : 'Pas encore d'avis'}
      </span>
    </div>
  )
}
```

### 3.3 — `src/components/discover/StyleBadge.tsx`

```typescript
const STYLE_COLORS: Record<string, string> = {
  'réalisme':     'bg-blue-900/30 text-blue-300 border-blue-800/40',
  'old school':   'bg-red-900/30 text-red-300 border-red-800/40',
  'japonais':     'bg-purple-900/30 text-purple-300 border-purple-800/40',
  'fine line':    'bg-emerald-900/30 text-emerald-300 border-emerald-800/40',
  'blackwork':    'bg-zinc-800/50 text-zinc-300 border-zinc-700/40',
  'neo-trad':     'bg-orange-900/30 text-orange-300 border-orange-800/40',
  'géométrique':  'bg-cyan-900/30 text-cyan-300 border-cyan-800/40',
  'aquarelle':    'bg-pink-900/30 text-pink-300 border-pink-800/40',
  'tribal':       'bg-amber-900/30 text-amber-300 border-amber-800/40',
}

export function StyleBadge({ style }: { style: string }) {
  const cls = STYLE_COLORS[style.toLowerCase()] ?? 'bg-ink-border/30 text-ink-muted border-ink-border/40'
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {style}
    </span>
  )
}
```

### 3.4 — `src/components/discover/SearchBar.tsx`

```typescript
'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { STYLES_LIST } from '@/lib/constants/styles'

// Barre de recherche avec autocomplete ville + filtre style
// Utilisée sur /discover, /discover/[city], /discover/[city]/[style]

export function SearchBar({
  defaultCity = '',
  defaultStyle = '',
  defaultQ = '',
}: {
  defaultCity?: string
  defaultStyle?: string
  defaultQ?: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(defaultQ)
  const [city, setCity] = useState(defaultCity)
  const [style, setStyle] = useState(defaultStyle)
  const [, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const parts = ['discover']
    if (city) parts.push(encodeURIComponent(city.toLowerCase()))
    if (style) parts.push(encodeURIComponent(style.toLowerCase()))
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    startTransition(() => router.push(`/${parts.join('/')}${qs}`))
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl mx-auto">
      {/* Recherche texte libre */}
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Nom, pseudo..."
        className="flex-1 min-h-[44px] px-4 rounded-lg bg-ink-surface border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent text-sm"
      />

      {/* Ville */}
      <input
        type="text"
        value={city}
        onChange={e => setCity(e.target.value)}
        placeholder="Ville (Paris, Lyon...)"
        className="flex-1 min-h-[44px] px-4 rounded-lg bg-ink-surface border border-ink-border text-ink-text placeholder:text-ink-muted focus:outline-none focus:border-ink-accent text-sm"
      />

      {/* Style */}
      <select
        value={style}
        onChange={e => setStyle(e.target.value)}
        className="min-h-[44px] px-3 rounded-lg bg-ink-surface border border-ink-border text-ink-text focus:outline-none focus:border-ink-accent text-sm"
      >
        <option value="">Tous les styles</option>
        {STYLES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <button
        type="submit"
        className="min-h-[44px] px-6 rounded-lg bg-ink-accent text-ink-bg font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Chercher
      </button>
    </form>
  )
}
```

### 3.5 — `src/components/discover/ReviewCard.tsx`

```typescript
import { StarRating } from './StarRating'

interface ReviewCardProps {
  clientName: string
  rating: number
  body?: string
  tattooStyle?: string
  isVerified?: boolean
  replyBody?: string
  replyAt?: string
  createdAt: string
}

export function ReviewCard({ clientName, rating, body, tattooStyle, isVerified, replyBody, replyAt, createdAt }: ReviewCardProps) {
  return (
    <div className="bg-ink-surface border border-ink-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-ink-text font-medium text-sm">{clientName}</span>
            {isVerified && (
              <span className="text-xs bg-ink-accent/15 text-ink-accent border border-ink-accent/30 px-2 py-0.5 rounded-full">
                ✓ Avis vérifié
              </span>
            )}
          </div>
          {tattooStyle && <span className="text-ink-muted text-xs mt-0.5 block">{tattooStyle}</span>}
        </div>
        <div className="text-right">
          <StarRating avg={rating} count={0} />
          <span className="text-ink-muted text-xs">{new Date(createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {body && <p className="text-ink-text/80 text-sm leading-relaxed">{body}</p>}

      {/* Réponse du tatoueur */}
      {replyBody && (
        <div className="mt-3 pl-3 border-l-2 border-ink-accent/40">
          <p className="text-ink-muted text-xs mb-1">Réponse du tatoueur ·{' '}
            {replyAt && new Date(replyAt).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-ink-text/70 text-sm">{replyBody}</p>
        </div>
      )}
    </div>
  )
}
```

### 3.6 — `src/components/discover/WriteReviewDrawer.tsx`

```typescript
'use client'
// Drawer mobile pour poster un avis (accessible depuis /p/[slug])
// Toujours mobile-first, safe-area-inset

import { useState } from 'react'
import { z } from 'zod'

export function WriteReviewDrawer({ studioId, studioName, onClose }: {
  studioId: string
  studioName: string
  onClose: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [style, setStyle] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reviews/${studioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: name, client_email: email, rating, body, tattoo_style: style }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ... JSX complet du drawer avec fond ink-surface, étoiles cliquables, champs, bouton submit
  // Respecte les règles mobile-first + safe-area-inset-bottom
}
```

---

## 📄 PARTIE 4 — PAGES (App Router)

### 4.1 — `src/app/discover/page.tsx`

```typescript
// Page d'accueil discovery — SSR + revalidate 3600
import { Suspense } from 'react'
import { SearchBar } from '@/components/discover/SearchBar'
import { ArtistCard } from '@/components/discover/ArtistCard'
import { ArtistGrid } from '@/components/discover/ArtistGrid'
import { CityLinks } from '@/components/discover/CityLinks'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Trouver un tatoueur — Inkflow Directory',
  description: 'Découvrez les meilleurs tatoueurs près de chez vous. Filtrez par style, ville, budget. Réservez en ligne.',
  openGraph: { title: 'Inkflow — Le directory des tatoueurs', images: ['/og-discover.jpg'] },
}

export const revalidate = 3600

export default async function DiscoverPage() {
  const supabase = createClient()

  // Artistes tendance
  const { data: trending } = await supabase
    .from('inkflow_studios')
    .select('id, slug, name, studio_name, city, styles, rating_avg, rating_count, portfolio_cover_url, portfolio_preview, price_min')
    .eq('is_discoverable', true)
    .gte('rating_count', 3)
    .order('discover_rank', { ascending: false })
    .limit(8)

  // Villes actives
  const { data: cities } = await supabase
    .from('inkflow_city_pages')
    .select('slug, name, artist_count')
    .eq('is_active', true)
    .order('artist_count', { ascending: false })
    .limit(12)

  return (
    <main className="min-h-screen bg-ink-bg text-ink-text">
      {/* Hero */}
      <section className="px-4 pt-16 pb-10 text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl font-serif text-ink-text leading-tight">
          Trouve ton tatoueur <span className="text-ink-accent">idéal</span>
        </h1>
        <p className="text-ink-muted text-base sm:text-lg max-w-lg mx-auto">
          Parcours des centaines de portfolios. Filtre par style, ville et budget. Réserve directement.
        </p>
        <Suspense>
          <SearchBar />
        </Suspense>
      </section>

      {/* Artistes tendance */}
      {trending && trending.length > 0 && (
        <section className="px-4 pb-10">
          <h2 className="text-xl font-semibold text-ink-text mb-4">🔥 En ce moment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map(a => (
              <ArtistCard
                key={a.id}
                slug={a.slug}
                name={a.name}
                studioName={a.studio_name}
                city={a.city}
                styles={a.styles}
                ratingAvg={a.rating_avg}
                ratingCount={a.rating_count}
                portfolioCover={a.portfolio_cover_url}
                portfolioPreview={a.portfolio_preview}
                priceMin={a.price_min}
              />
            ))}
          </div>
        </section>
      )}

      {/* Parcourir par ville */}
      {cities && <CityLinks cities={cities} />}

      {/* Styles populaires — liens SEO */}
      <StylesIndex />
    </main>
  )
}
```

### 4.2 — `src/app/discover/[city]/page.tsx`

```typescript
// Page par ville — SSG avec ISR
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArtistCard } from '@/components/discover/ArtistCard'
import { SearchBar } from '@/components/discover/SearchBar'
import { Pagination } from '@/components/ui/Pagination'

export const revalidate = 1800

interface Props { params: { city: string }; searchParams: { style?: string; sort?: string; page?: string } }

export async function generateMetadata({ params }: Props) {
  const cityName = params.city.charAt(0).toUpperCase() + params.city.slice(1)
  return {
    title: `Tatoueurs à ${cityName} — Inkflow`,
    description: `Trouvez les meilleurs tatoueurs à ${cityName}. Portfolios, avis clients, réservation en ligne.`,
    alternates: { canonical: `/discover/${params.city}` },
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  const supabase = createClient()
  const page = Math.max(1, Number(searchParams.page ?? 1))
  const perPage = 12

  const { data: cityData } = await supabase
    .from('inkflow_city_pages')
    .select('name, meta_description, artist_count')
    .eq('slug', params.city)
    .single()

  if (!cityData) notFound()

  let query = supabase
    .from('inkflow_studios')
    .select('id, slug, name, studio_name, city, styles, rating_avg, rating_count, portfolio_cover_url, portfolio_preview, price_min', { count: 'exact' })
    .eq('is_discoverable', true)
    .eq('city_slug', params.city)

  if (searchParams.style) query = query.contains('styles', [searchParams.style])

  const sortMap: Record<string, string> = { rating: 'rating_avg', recent: 'last_active_at', rank: 'discover_rank' }
  query = query
    .order(sortMap[searchParams.sort ?? 'rank'] ?? 'discover_rank', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  const { data: artists, count } = await query

  return (
    <main className="min-h-screen bg-ink-bg text-ink-text px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-serif">Tatoueurs à <span className="text-ink-accent">{cityData.name}</span></h1>
        <p className="text-ink-muted text-sm mt-1">{count} artiste{count !== 1 ? 's' : ''} référencé{count !== 1 ? 's' : ''}</p>
      </div>

      <SearchBar defaultCity={params.city} defaultStyle={searchParams.style} />

      {/* Filtres style en chips horizontaux */}
      <StyleFilterChips city={params.city} activeStyle={searchParams.style} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {artists?.map(a => (
          <ArtistCard key={a.id} slug={a.slug} name={a.name} studioName={a.studio_name}
            city={a.city} styles={a.styles} ratingAvg={a.rating_avg} ratingCount={a.rating_count}
            portfolioCover={a.portfolio_cover_url} portfolioPreview={a.portfolio_preview} priceMin={a.price_min} />
        ))}
      </div>

      <Pagination page={page} totalPages={Math.ceil((count ?? 0) / perPage)} baseUrl={`/discover/${params.city}`} />
    </main>
  )
}
```

### 4.3 — `src/app/discover/[city]/[style]/page.tsx`

```typescript
// Page city+style — SEO cible principale
// Ex: /discover/paris/realisme → "Tatoueurs réalisme Paris"
// Schéma JSON-LD LocalBusiness à injecter ici

export async function generateMetadata({ params }: { params: { city: string; style: string } }) {
  const city  = params.city.charAt(0).toUpperCase() + params.city.slice(1)
  const style = params.style.charAt(0).toUpperCase() + params.style.slice(1)
  return {
    title: `Tatoueur ${style} à ${city} — Inkflow`,
    description: `Les meilleurs tatoueurs spécialisés ${style} à ${city}. Portfolios vérifiés, avis clients, réservation directe.`,
    openGraph: { title: `Tatoueur ${style} ${city}`, description: `Trouver un tatoueur ${style} à ${city} sur Inkflow` },
    alternates: { canonical: `/discover/${params.city}/${params.style}` },
  }
}

// Contenu similaire à CityPage mais avec filtre style appliqué + H1 SEO adapté
// Injecter le schema JSON-LD ItemList pour Google Rich Results
// <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
```

### 4.4 — Enrichissement de `/p/[slug]` (existant)

```typescript
// Dans src/app/p/[slug]/page.tsx — AJOUTER après le portfolio existant :

// 1. Bloc rating summary
<RatingSummary studioId={studio.id} />

// 2. Liste des avis
<ReviewsList studioId={studio.id} />

// 3. Bouton "Laisser un avis"
<WriteReviewButton studioId={studio.id} studioName={studio.name} />

// 4. Bloc schema JSON-LD pour Google
const ldSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  'name': studio.studio_name,
  'description': studio.bio,
  'image': studio.portfolio_cover_url,
  'address': { '@type': 'PostalAddress', 'addressLocality': studio.city, 'addressCountry': 'FR' },
  'aggregateRating': studio.rating_count > 0 ? {
    '@type': 'AggregateRating',
    'ratingValue': studio.rating_avg,
    'reviewCount': studio.rating_count,
    'bestRating': 5,
    'worstRating': 1,
  } : undefined,
  'url': `https://app.ink-flow.me/p/${studio.slug}`,
}
```

---

## 🔧 PARTIE 5 — DASHBOARD TATOUEUR (settings discover)

### 5.1 — `src/app/(app)/settings/discover/page.tsx`

```typescript
// Page paramètres discover dans le dashboard pro
// Permet au tatoueur de :
// - Activer/désactiver sa fiche discover (is_discoverable)
// - Renseigner ville + géoloc
// - Cocher ses styles
// - Définir fourchette de prix
// - Répondre aux avis

// Composant DiscoverSettings.tsx — champs :
// - Toggle "Apparaître dans la recherche"
// - Input ville avec geocoding (Google Places API ou Nominatim/OpenStreetMap free)
// - Checklist styles (STYLES_LIST)
// - Range prix min/max
// - Section "Mes avis" avec liste + bouton répondre
```

---

## 📦 PARTIE 6 — CONSTANTES ET UTILITAIRES

### 6.1 — `src/lib/constants/styles.ts`

```typescript
export const STYLES_LIST = [
  'réalisme', 'old school', 'japonais', 'fine line', 'blackwork',
  'neo-trad', 'géométrique', 'aquarelle', 'tribal', 'lettering',
  'dotwork', 'illustratif', 'surréalisme', 'minimaliste', 'biomécanique',
] as const

export type TattooStyle = typeof STYLES_LIST[number]

export const STYLE_SLUGS: Record<TattooStyle, string> = {
  'réalisme':     'realisme',
  'old school':   'old-school',
  'japonais':     'japonais',
  'fine line':    'fine-line',
  'blackwork':    'blackwork',
  'neo-trad':     'neo-trad',
  'géométrique':  'geometrique',
  'aquarelle':    'aquarelle',
  'tribal':       'tribal',
  'lettering':    'lettering',
  'dotwork':      'dotwork',
  'illustratif':  'illustratif',
  'surréalisme':  'surrealisme',
  'minimaliste':  'minimaliste',
  'biomécanique': 'biomecanique',
}
```

### 6.2 — `src/lib/geocoding.ts`

```typescript
// Geocoding via Nominatim (OpenStreetMap, gratuit, rate-limit 1 req/s)
export async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number; slug: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)},France&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'Inkflow/1.0 contact@ink-flow.me' } })
  const data = await res.json()
  if (!data.length) return null
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    slug: cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
  }
}
```

---

## 🗺️ PARTIE 7 — PAGE CARTE (`/discover/map`)

```typescript
// src/app/discover/map/page.tsx — Client component (Leaflet)
// Dépendance : npm install leaflet react-leaflet @types/leaflet

'use client'
import dynamic from 'next/dynamic'
const DiscoverMap = dynamic(() => import('@/components/discover/DiscoverMap'), { ssr: false })

// DiscoverMap.tsx :
// - Leaflet map centrée sur la France (lat: 46.5, lng: 2.5, zoom: 6)
// - Tiles dark : CartoDB Dark Matter (gratuit)
//   URL: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
// - Markers custom couleur ink-accent (#c9a96e)
// - Popup au clic : mini ArtistCard avec lien vers /p/[slug]
// - Données chargées via /api/discover/search?per_page=200 (sans pagination pour la map)
```

---

## 📋 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

```
Phase 1 — Fondations DB (1 session)
  1. Migrations SQL (parties 1.1 → 1.5)
  2. Constantes STYLES_LIST + geocoding util
  3. npm install zod (si pas présent)

Phase 2 — API (1 session)
  4. /api/discover/search
  5. /api/reviews/[studioId] GET + POST
  6. /api/reviews/[studioId]/reply
  7. /api/discover/trending

Phase 3 — Composants (1 session)
  8. ArtistCard + StarRating + StyleBadge
  9. SearchBar
  10. ReviewCard + WriteReviewDrawer

Phase 4 — Pages (1-2 sessions)
  11. /discover (homepage)
  12. /discover/[city]
  13. /discover/[city]/[style]
  14. Enrichissement /p/[slug] (rating block + avis)

Phase 5 — Dashboard + Map (1 session)
  15. Settings discover dans le dashboard pro
  16. /discover/map (Leaflet)

Phase 6 — SEO + Polish
  17. JSON-LD schemas (LocalBusiness + ItemList)
  18. sitemap.ts dynamique incluant toutes les pages /discover/[city]/[style]
  19. robots.txt allow /discover
  20. og:image dynamique via @vercel/og pour chaque artiste
```

---

## ⚠️ RÈGLES ABSOLUES À NE PAS VIOLER

1. **Jamais de `bg-white`** — toutes les pages discover héritent du dark theme Inkflow
2. **Zones cliquables ≥ 44px** — toutes les cards, boutons, chips
3. **Safe-area-inset** sur les layouts racine
4. **Mobile-first** — écrire les styles mobile puis `sm:` override
5. **Pas de `any` TypeScript** — typer tous les retours Supabase
6. **ISR/revalidate sur toutes les pages** — pas de `no-store` sur les pages discover
7. **RLS Supabase** — les avis `pending` ne sont JAMAIS visibles publiquement
8. **Un seul avis par email par artiste** — enforced par contrainte UNIQUE en DB
9. **Alias `@/`** — jamais de chemins relatifs `../../`
10. **Import Tailwind uniquement** — pas de CSS modules, pas de styles inline sauf `env()`

---

## 🔗 DÉPENDANCES À INSTALLER

```bash
npm install zod                    # validation schemas (peut déjà être là)
npm install leaflet react-leaflet @types/leaflet  # carte interactive
```

Pas d'autres dépendances — tout le reste est déjà dans le projet Inkflow.
