-- Compteurs de vues : vitrine web (/studio) et fiches studio dans l’app client (decouverte).
-- Écriture : RPC incrément (anon) sur pages publiques. Lecture : RPC dashboard (JWT membre du studio).

CREATE TABLE IF NOT EXISTS public.inkflow_studio_public_metrics (
  studio_id TEXT PRIMARY KEY REFERENCES public.inkflow_studios(id) ON DELETE CASCADE,
  vitrine_views INTEGER NOT NULL DEFAULT 0,
  discover_profile_views INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_public_metrics_updated
  ON public.inkflow_studio_public_metrics (updated_at DESC);

ALTER TABLE public.inkflow_studio_public_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "studio_public_metrics_deny_direct"
  ON public.inkflow_studio_public_metrics
  FOR ALL
  TO PUBLIC
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.increment_studio_channel_view(p_studio_id TEXT, p_channel TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_channel IS NULL OR p_channel NOT IN ('vitrine', 'discover') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inkflow_studios s WHERE s.id = p_studio_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.inkflow_studio_public_metrics (studio_id, vitrine_views, discover_profile_views, updated_at)
  VALUES (
    p_studio_id,
    CASE WHEN p_channel = 'vitrine' THEN 1 ELSE 0 END,
    CASE WHEN p_channel = 'discover' THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (studio_id) DO UPDATE SET
    vitrine_views = public.inkflow_studio_public_metrics.vitrine_views
      + CASE WHEN p_channel = 'vitrine' THEN 1 ELSE 0 END,
    discover_profile_views = public.inkflow_studio_public_metrics.discover_profile_views
      + CASE WHEN p_channel = 'discover' THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_studio_channel_view(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_studio_channel_view(TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_studio_public_metrics_for_dashboard(p_studio_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m_vitrine INTEGER;
  m_discover INTEGER;
  d_is_discoverable BOOLEAN;
  d_instagram TEXT;
  d_rating_count INTEGER;
  d_rating_avg NUMERIC;
BEGIN
  IF p_studio_id IS NULL OR trim(p_studio_id) = '' THEN
    RAISE EXCEPTION 'invalid studio' USING ERRCODE = '22023';
  END IF;

  IF NOT (p_studio_id IN (SELECT public.inkflow_studio_ids_for_jwt())) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  m_vitrine := 0;
  m_discover := 0;
  SELECT mm.vitrine_views, mm.discover_profile_views
  INTO m_vitrine, m_discover
  FROM public.inkflow_studio_public_metrics mm
  WHERE mm.studio_id = p_studio_id;

  IF NOT FOUND THEN
    m_vitrine := 0;
    m_discover := 0;
  END IF;

  SELECT
    is_discoverable,
    instagram,
    rating_count,
    rating_avg
  INTO d_is_discoverable, d_instagram, d_rating_count, d_rating_avg
  FROM public.inkflow_studios
  WHERE id = p_studio_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'studio not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'vitrine_views', COALESCE(m_vitrine, 0),
    'discover_profile_views', COALESCE(m_discover, 0),
    'is_discoverable', COALESCE(d_is_discoverable, false),
    'instagram', d_instagram,
    'rating_count', COALESCE(d_rating_count, 0),
    'rating_avg', d_rating_avg
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_studio_public_metrics_for_dashboard(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_studio_public_metrics_for_dashboard(TEXT) TO authenticated;

COMMENT ON TABLE public.inkflow_studio_public_metrics IS
  'Agrégats vues vitrine + app client — pas de PII, accès via RPC seulement.';
