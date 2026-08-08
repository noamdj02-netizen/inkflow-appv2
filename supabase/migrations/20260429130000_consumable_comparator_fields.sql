-- Comparateur consommables : frais de port fournisseur + marque / SKU produit
ALTER TABLE public.inkflow_consumable_suppliers
  ADD COLUMN IF NOT EXISTS default_shipping_fee_cents INTEGER NOT NULL DEFAULT 0
    CHECK (default_shipping_fee_cents >= 0),
  ADD COLUMN IF NOT EXISTS free_shipping_threshold_cents INTEGER
    CHECK (free_shipping_threshold_cents IS NULL OR free_shipping_threshold_cents >= 0);

COMMENT ON COLUMN public.inkflow_consumable_suppliers.default_shipping_fee_cents IS
  'Frais de port estimés TTC (centimes) si le sous-total commande < seuil.';
COMMENT ON COLUMN public.inkflow_consumable_suppliers.free_shipping_threshold_cents IS
  'Sous-total TTC (centimes) pour port gratuit ; NULL = non renseigné (port appliqué par défaut).';

ALTER TABLE public.inkflow_consumable_products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS sku TEXT;

COMMENT ON COLUMN public.inkflow_consumable_products.brand IS 'Marque fabricant / distributeur.';
COMMENT ON COLUMN public.inkflow_consumable_products.sku IS 'Référence / SKU catalogue.';
