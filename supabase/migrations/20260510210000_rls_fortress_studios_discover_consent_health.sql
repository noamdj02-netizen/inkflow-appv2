-- InkFlow — Fortress pass : supprime les fuites RLS critiques et expose les données publiques
-- uniquement via RPC SECURITY DEFINER à colonnes bornées.

-- ── 1) Studios : suppression lecture anon « full row » (availability / toute la table) ──
DROP POLICY IF EXISTS "Public read availability_settings" ON public.inkflow_studios;

-- ── 2) get_studio_public_by_slug : ajoute availability_settings (tunnel /book, acompte global) ──
DROP FUNCTION IF EXISTS public.get_studio_public_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_studio_public_by_slug(p_slug text)
RETURNS TABLE(
  id text,
  name text,
  studio_name text,
  slug text,
  vitrine_theme text,
  siret text,
  avatar_url text,
  portfolio_cover_url text,
  payments_online boolean,
  availability_settings jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id,
    s.name,
    s.studio_name,
    s.slug,
    COALESCE(s.vitrine_theme, 'light'),
    s.siret,
    s.avatar_url,
    s.portfolio_cover_url,
    (s.stripe_connect_charges_enabled IS TRUE AND s.stripe_connect_account_id IS NOT NULL AND btrim(s.stripe_connect_account_id) <> ''),
    COALESCE(s.availability_settings, '{}'::jsonb)
  FROM inkflow_studios s
  WHERE lower(trim(s.slug)) = lower(trim(p_slug))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_studio_public_by_slug(text) TO authenticated;

COMMENT ON FUNCTION public.get_studio_public_by_slug(text) IS
  'Lecture publique studio par slug : vitrine + dispo JSON (sans email, tokens Google, clés Stripe brutes).';

-- Alias explicite demandé produit / audits
CREATE OR REPLACE FUNCTION public.get_public_studio_info(slug_input text)
RETURNS TABLE(
  id text,
  name text,
  studio_name text,
  slug text,
  avatar_url text,
  portfolio_cover_url text,
  vitrine_theme text,
  availability_settings jsonb,
  payments_online boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id,
    s.name,
    s.studio_name,
    s.slug,
    s.avatar_url,
    s.portfolio_cover_url,
    COALESCE(s.vitrine_theme, 'light'),
    COALESCE(s.availability_settings, '{}'::jsonb),
    (s.stripe_connect_charges_enabled IS TRUE AND s.stripe_connect_account_id IS NOT NULL AND btrim(s.stripe_connect_account_id) <> '')
  FROM inkflow_studios s
  WHERE lower(trim(s.slug)) = lower(trim(slug_input))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_studio_info(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_studio_info(text) TO authenticated;

COMMENT ON FUNCTION public.get_public_studio_info(text) IS
  'Sous-ensemble public (nom, visuels, dispo, paiements en ligne) — pas d''email ni secrets.';

-- ── 3) Discover : lecture anon sans accès direct à inkflow_studios ──
CREATE OR REPLACE FUNCTION public.search_public_discover_studios(
  p_city_slug text DEFAULT NULL,
  p_style text DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_price_max integer DEFAULT NULL,
  p_price_min integer DEFAULT NULL,
  p_sort text DEFAULT 'rank',
  p_page integer DEFAULT 1,
  p_per_page integer DEFAULT 12
)
RETURNS TABLE(
  id text,
  slug text,
  name text,
  studio_name text,
  city text,
  city_slug text,
  styles text[],
  bio text,
  instagram text,
  price_min integer,
  price_max integer,
  rating_avg numeric,
  rating_count integer,
  portfolio_cover_url text,
  portfolio_preview jsonb,
  lat numeric,
  lng numeric,
  last_active_at timestamptz,
  discover_rank integer,
  out_total bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  off integer := (GREATEST(COALESCE(p_page, 1), 1) - 1) * GREATEST(COALESCE(p_per_page, 12), 1);
  lim integer := GREATEST(COALESCE(p_per_page, 12), 1);
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT s.*
    FROM inkflow_studios s
    WHERE s.is_discoverable IS TRUE
      AND (p_city_slug IS NULL OR btrim(p_city_slug) = '' OR s.city_slug IS NOT DISTINCT FROM btrim(p_city_slug))
      AND (
        p_style IS NULL OR btrim(p_style) = ''
        OR (s.styles IS NOT NULL AND s.styles @> ARRAY[btrim(p_style)]::text[])
      )
      AND (p_price_max IS NULL OR s.price_min IS NULL OR s.price_min <= p_price_max)
      AND (p_price_min IS NULL OR s.price_max IS NULL OR s.price_max >= p_price_min)
      AND (
        p_q IS NULL OR btrim(p_q) = ''
        OR s.name ILIKE '%' || btrim(p_q) || '%'
        OR s.studio_name ILIKE '%' || btrim(p_q) || '%'
        OR (s.bio IS NOT NULL AND s.bio ILIKE '%' || btrim(p_q) || '%')
      )
  ),
  counted AS (
    SELECT count(*)::bigint AS c FROM base
  ),
  ordered AS (
    SELECT b.* FROM base b
    ORDER BY
      CASE lower(coalesce(nullif(btrim(p_sort), ''), 'rank'))
        WHEN 'rating' THEN coalesce(b.rating_avg, 0::numeric)
        WHEN 'recent' THEN extract(epoch FROM coalesce(b.last_active_at, '1970-01-01'::timestamptz))
        ELSE coalesce(b.discover_rank, 0)::numeric
      END DESC,
      b.id ASC
  )
  SELECT
    o.id,
    o.slug,
    o.name,
    o.studio_name,
    o.city,
    o.city_slug,
    o.styles,
    o.bio,
    o.instagram,
    o.price_min,
    o.price_max,
    o.rating_avg,
    o.rating_count,
    o.portfolio_cover_url,
    o.portfolio_preview,
    o.lat,
    o.lng,
    o.last_active_at,
    o.discover_rank,
    (SELECT c FROM counted)
  FROM ordered o
  LIMIT lim OFFSET off;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_public_discover_studios(
  text, text, text, integer, integer, text, integer, integer
) TO anon;
GRANT EXECUTE ON FUNCTION public.search_public_discover_studios(
  text, text, text, integer, integer, text, integer, integer
) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_trending_public_discover_studios(p_limit integer DEFAULT 8)
RETURNS TABLE(
  id text,
  slug text,
  name text,
  studio_name text,
  city text,
  city_slug text,
  styles text[],
  bio text,
  instagram text,
  price_min integer,
  price_max integer,
  rating_avg numeric,
  rating_count integer,
  portfolio_cover_url text,
  portfolio_preview jsonb,
  lat numeric,
  lng numeric,
  last_active_at timestamptz,
  discover_rank integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    s.id,
    s.slug,
    s.name,
    s.studio_name,
    s.city,
    s.city_slug,
    s.styles,
    s.bio,
    s.instagram,
    s.price_min,
    s.price_max,
    s.rating_avg,
    s.rating_count,
    s.portfolio_cover_url,
    s.portfolio_preview,
    s.lat,
    s.lng,
    s.last_active_at,
    s.discover_rank
  FROM inkflow_studios s
  WHERE s.is_discoverable IS TRUE
    AND coalesce(s.rating_count, 0) >= 1
  ORDER BY s.discover_rank DESC NULLS LAST, s.id ASC
  LIMIT greatest(coalesce(p_limit, 8), 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_public_discover_studios(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_trending_public_discover_studios(integer) TO authenticated;

-- ── 4) Consent : suppression lecture / update anonymes globaux ──
DROP POLICY IF EXISTS "consent_forms_public_read" ON public.inkflow_consent_forms;
DROP POLICY IF EXISTS "consent_forms_public_update" ON public.inkflow_consent_forms;

CREATE OR REPLACE FUNCTION public.get_consent_form_for_public_portal(p_id text)
RETURNS TABLE(
  id text,
  template text,
  client_name text,
  client_email text,
  appointment_id text,
  signed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.id,
    CASE WHEN c.signed_at IS NULL THEN c.template ELSE NULL END AS template,
    c.client_name,
    CASE WHEN c.signed_at IS NULL THEN c.client_email ELSE NULL END AS client_email,
    CASE WHEN c.signed_at IS NULL THEN c.appointment_id ELSE NULL END AS appointment_id,
    c.signed_at
  FROM inkflow_consent_forms c
  WHERE c.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_consent_form_for_public_portal(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_consent_form_for_public_portal(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_consent_form_signature(
  p_id text,
  p_signature_data text,
  p_filled_template_text text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inkflow_consent_forms
  SET
    signature_data = p_signature_data,
    signed_at = now(),
    filled_template_text = p_filled_template_text
  WHERE id = p_id
    AND signed_at IS NULL
    AND (signature_data IS NULL OR btrim(signature_data) = '');
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_consent_form_signature(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_consent_form_signature(text, text, text) TO authenticated;

COMMENT ON FUNCTION public.get_consent_form_for_public_portal(text) IS
  'Lecture guidée consentement : pas d''email / template une fois signé (lien cf_* connu du client).';
COMMENT ON FUNCTION public.submit_consent_form_signature(text, text, text) IS
  'Signature client : une seule fois (unsigned only).';

-- ── 5) Health forms : INSERT borné (lecture inchangée = studio JWT + bypass service_role) ──
DROP POLICY IF EXISTS "health_forms_insert_anon" ON public.inkflow_health_forms;

CREATE POLICY "health_forms_insert_public_booking" ON public.inkflow_health_forms
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    studio_id IN (SELECT s.id FROM inkflow_studios s)
    AND length(trim(client_email)) >= 3
    AND length(trim(client_name)) >= 1
    AND health_data IS NOT NULL
  );
