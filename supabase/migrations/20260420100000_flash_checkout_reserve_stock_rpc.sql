-- Réserve un flash après paiement : available/reserved + bump stock_current en une seule instruction (atomique).
-- Idempotent webhook : n'incrémente le stock qu'une fois tant que available était encore true.

ALTER TABLE public.inkflow_flash_designs
  ADD COLUMN IF NOT EXISTS stock_current integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.inkflow_apply_flash_checkout_reserve(p_flash_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_flash_id IS NULL OR trim(p_flash_id) = '' THEN
    RETURN;
  END IF;

  -- Une instruction : même atomicité que reserved / available. `stock_current + 1` s’applique aux valeurs
  -- AVANT mise à jour ; +0 si déjà vendu (webhook idempotent).
  UPDATE public.inkflow_flash_designs
  SET
    available = false,
    reserved = true,
    updated_at = now(),
    stock_current = COALESCE(stock_current, 0) + CASE WHEN available IS TRUE THEN 1 ELSE 0 END
  WHERE id = trim(p_flash_id);
END;
$$;

REVOKE ALL ON FUNCTION public.inkflow_apply_flash_checkout_reserve(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inkflow_apply_flash_checkout_reserve(text) TO service_role;

COMMENT ON FUNCTION public.inkflow_apply_flash_checkout_reserve(text) IS
  'Après checkout Stripe payé : passe le flash en réservé et incrémente stock_current (1× si encore disponible). Réservé au service_role (Edge).';
