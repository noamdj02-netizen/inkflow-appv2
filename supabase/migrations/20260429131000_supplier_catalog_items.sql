-- Catalogue complet par fournisseur (données propres à chaque studio) : prix, promos, lien fiche, liaison produit stock.
CREATE TABLE IF NOT EXISTS public.inkflow_supplier_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES public.inkflow_studios(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.inkflow_consumable_suppliers(id) ON DELETE CASCADE,
  linked_product_id UUID REFERENCES public.inkflow_consumable_products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  sku TEXT,
  ean TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  pack_size INTEGER NOT NULL DEFAULT 1 CHECK (pack_size >= 1),
  list_price_cents INTEGER CHECK (list_price_cents IS NULL OR list_price_cents >= 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  promo_price_cents INTEGER CHECK (promo_price_cents IS NULL OR promo_price_cents >= 0),
  promo_label TEXT,
  promo_starts_at DATE,
  promo_ends_at DATE,
  product_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_catalog_studio ON public.inkflow_supplier_catalog_items(studio_id);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_supplier ON public.inkflow_supplier_catalog_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_category ON public.inkflow_supplier_catalog_items(studio_id, category);
CREATE INDEX IF NOT EXISTS idx_supplier_catalog_linked ON public.inkflow_supplier_catalog_items(linked_product_id)
  WHERE linked_product_id IS NOT NULL;

COMMENT ON TABLE public.inkflow_supplier_catalog_items IS
  'Offres catalogue fournisseur (par studio) : prix TTC, promos, SKU ; liaison optionnelle vers produit stock.';

ALTER TABLE public.inkflow_supplier_catalog_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "supplier_catalog_select_own" ON public.inkflow_supplier_catalog_items;
CREATE POLICY "supplier_catalog_select_own" ON public.inkflow_supplier_catalog_items FOR SELECT USING (
  studio_id IN (SELECT id FROM public.inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

DROP POLICY IF EXISTS "supplier_catalog_insert_own" ON public.inkflow_supplier_catalog_items;
CREATE POLICY "supplier_catalog_insert_own" ON public.inkflow_supplier_catalog_items FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM public.inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

DROP POLICY IF EXISTS "supplier_catalog_update_own" ON public.inkflow_supplier_catalog_items;
CREATE POLICY "supplier_catalog_update_own" ON public.inkflow_supplier_catalog_items FOR UPDATE USING (
  studio_id IN (SELECT id FROM public.inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

DROP POLICY IF EXISTS "supplier_catalog_delete_own" ON public.inkflow_supplier_catalog_items;
CREATE POLICY "supplier_catalog_delete_own" ON public.inkflow_supplier_catalog_items FOR DELETE USING (
  studio_id IN (SELECT id FROM public.inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);

DROP POLICY IF EXISTS "supplier_catalog_svc" ON public.inkflow_supplier_catalog_items;
CREATE POLICY "supplier_catalog_svc" ON public.inkflow_supplier_catalog_items
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
