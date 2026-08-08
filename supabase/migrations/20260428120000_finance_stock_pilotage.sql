-- Finance (HT/TTC, pilotage AE), stock consommables, traçabilité lots, contributions prix (opt-in)
-- RLS : isolation par studio (email JWT), + service_role pour Edge Functions.

-- ===== Préférences finance studio (1 ligne / studio) =====
CREATE TABLE IF NOT EXISTS inkflow_studio_finance_prefs (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE inkflow_studio_finance_prefs IS 'Préférences HT/TTC, TVA, pilotage auto-entrepreneur, opt-in comparateur prix (JSON settings).';

-- ===== Produits / fournisseurs / prix historisés =====
CREATE TABLE IF NOT EXISTS inkflow_consumable_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  unit TEXT NOT NULL DEFAULT 'unité',
  qty_on_hand INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_products_studio ON inkflow_consumable_products(studio_id);

CREATE TABLE IF NOT EXISTS inkflow_consumable_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_suppliers_studio ON inkflow_consumable_suppliers(studio_id);

CREATE TABLE IF NOT EXISTS inkflow_consumable_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inkflow_consumable_products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES inkflow_consumable_suppliers(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  pack_size INTEGER NOT NULL DEFAULT 1 CHECK (pack_size >= 1),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_prices_product ON inkflow_consumable_prices(product_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_consumable_prices_studio ON inkflow_consumable_prices(studio_id);

-- ===== Mouvements de stock (audit : manual | voice | adjustment | appointment) =====
CREATE TABLE IF NOT EXISTS inkflow_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inkflow_consumable_products(id) ON DELETE CASCADE,
  delta_qty INTEGER NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'adjustment', 'appointment')),
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_studio_created ON inkflow_stock_movements(studio_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.inkflow_apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inkflow_consumable_products
  SET
    qty_on_hand = GREATEST(0, COALESCE(qty_on_hand, 0) + NEW.delta_qty),
    updated_at = now()
  WHERE id = NEW.product_id AND studio_id = NEW.studio_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_inkflow_stock_movement_bump ON inkflow_stock_movements;
CREATE TRIGGER tr_inkflow_stock_movement_bump
  AFTER INSERT ON inkflow_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.inkflow_apply_stock_movement();

-- ===== Lots / traçabilité (QR, péremption) =====
CREATE TABLE IF NOT EXISTS inkflow_consumable_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  raw_barcode TEXT,
  lot_number TEXT NOT NULL,
  expiry_date DATE,
  product_label TEXT,
  supplier_name TEXT,
  client_id TEXT REFERENCES inkflow_clients(id) ON DELETE SET NULL,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_lots_studio_expiry ON inkflow_consumable_lots(studio_id, expiry_date);

-- ===== Charges directes séance (marge pédagogique) =====
CREATE TABLE IF NOT EXISTS inkflow_appointment_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Charge',
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_costs_studio ON inkflow_appointment_costs(studio_id);
CREATE INDEX IF NOT EXISTS idx_appointment_costs_apt ON inkflow_appointment_costs(appointment_id);

-- ===== Contributions anonymisées (opt-in studio) — agrégation ultérieure côté serveur =====
CREATE TABLE IF NOT EXISTS inkflow_price_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  supplier_label TEXT,
  label_normalized TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  pack_size INTEGER NOT NULL DEFAULT 1 CHECK (pack_size >= 1),
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_contrib_category ON inkflow_price_contributions(category_slug, contributed_at DESC);

-- ===== RLS =====
ALTER TABLE inkflow_studio_finance_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_consumable_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_consumable_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_consumable_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_consumable_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_appointment_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkflow_price_contributions ENABLE ROW LEVEL SECURITY;

-- finance_prefs
DROP POLICY IF EXISTS "finance_prefs_select_own" ON inkflow_studio_finance_prefs;
CREATE POLICY "finance_prefs_select_own" ON inkflow_studio_finance_prefs
  FOR SELECT USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
  );
DROP POLICY IF EXISTS "finance_prefs_insert_own" ON inkflow_studio_finance_prefs;
CREATE POLICY "finance_prefs_insert_own" ON inkflow_studio_finance_prefs
  FOR INSERT WITH CHECK (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
  );
DROP POLICY IF EXISTS "finance_prefs_update_own" ON inkflow_studio_finance_prefs;
CREATE POLICY "finance_prefs_update_own" ON inkflow_studio_finance_prefs
  FOR UPDATE USING (
    studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
  );
DROP POLICY IF EXISTS "finance_prefs_svc" ON inkflow_studio_finance_prefs;
CREATE POLICY "finance_prefs_svc" ON inkflow_studio_finance_prefs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Helper: policies for studio_id tables
-- consumable_products
DROP POLICY IF EXISTS "consumable_products_select_own" ON inkflow_consumable_products;
CREATE POLICY "consumable_products_select_own" ON inkflow_consumable_products FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_products_insert_own" ON inkflow_consumable_products;
CREATE POLICY "consumable_products_insert_own" ON inkflow_consumable_products FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_products_update_own" ON inkflow_consumable_products;
CREATE POLICY "consumable_products_update_own" ON inkflow_consumable_products FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_products_delete_own" ON inkflow_consumable_products;
CREATE POLICY "consumable_products_delete_own" ON inkflow_consumable_products FOR DELETE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_products_svc" ON inkflow_consumable_products;
CREATE POLICY "consumable_products_svc" ON inkflow_consumable_products
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- suppliers
DROP POLICY IF EXISTS "consumable_suppliers_select_own" ON inkflow_consumable_suppliers;
CREATE POLICY "consumable_suppliers_select_own" ON inkflow_consumable_suppliers FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_suppliers_insert_own" ON inkflow_consumable_suppliers;
CREATE POLICY "consumable_suppliers_insert_own" ON inkflow_consumable_suppliers FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_suppliers_update_own" ON inkflow_consumable_suppliers;
CREATE POLICY "consumable_suppliers_update_own" ON inkflow_consumable_suppliers FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_suppliers_delete_own" ON inkflow_consumable_suppliers;
CREATE POLICY "consumable_suppliers_delete_own" ON inkflow_consumable_suppliers FOR DELETE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_suppliers_svc" ON inkflow_consumable_suppliers;
CREATE POLICY "consumable_suppliers_svc" ON inkflow_consumable_suppliers
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- prices
DROP POLICY IF EXISTS "consumable_prices_select_own" ON inkflow_consumable_prices;
CREATE POLICY "consumable_prices_select_own" ON inkflow_consumable_prices FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_prices_insert_own" ON inkflow_consumable_prices;
CREATE POLICY "consumable_prices_insert_own" ON inkflow_consumable_prices FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_prices_update_own" ON inkflow_consumable_prices;
CREATE POLICY "consumable_prices_update_own" ON inkflow_consumable_prices FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_prices_delete_own" ON inkflow_consumable_prices;
CREATE POLICY "consumable_prices_delete_own" ON inkflow_consumable_prices FOR DELETE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_prices_svc" ON inkflow_consumable_prices;
CREATE POLICY "consumable_prices_svc" ON inkflow_consumable_prices
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- stock_movements
DROP POLICY IF EXISTS "stock_movements_select_own" ON inkflow_stock_movements;
CREATE POLICY "stock_movements_select_own" ON inkflow_stock_movements FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stock_movements_insert_own" ON inkflow_stock_movements;
CREATE POLICY "stock_movements_insert_own" ON inkflow_stock_movements FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "stock_movements_svc" ON inkflow_stock_movements;
CREATE POLICY "stock_movements_svc" ON inkflow_stock_movements
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- consumable_lots
DROP POLICY IF EXISTS "consumable_lots_select_own" ON inkflow_consumable_lots;
CREATE POLICY "consumable_lots_select_own" ON inkflow_consumable_lots FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_lots_insert_own" ON inkflow_consumable_lots;
CREATE POLICY "consumable_lots_insert_own" ON inkflow_consumable_lots FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_lots_update_own" ON inkflow_consumable_lots;
CREATE POLICY "consumable_lots_update_own" ON inkflow_consumable_lots FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_lots_delete_own" ON inkflow_consumable_lots;
CREATE POLICY "consumable_lots_delete_own" ON inkflow_consumable_lots FOR DELETE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "consumable_lots_svc" ON inkflow_consumable_lots;
CREATE POLICY "consumable_lots_svc" ON inkflow_consumable_lots
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- appointment_costs
DROP POLICY IF EXISTS "appointment_costs_select_own" ON inkflow_appointment_costs;
CREATE POLICY "appointment_costs_select_own" ON inkflow_appointment_costs FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "appointment_costs_insert_own" ON inkflow_appointment_costs;
CREATE POLICY "appointment_costs_insert_own" ON inkflow_appointment_costs FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "appointment_costs_update_own" ON inkflow_appointment_costs;
CREATE POLICY "appointment_costs_update_own" ON inkflow_appointment_costs FOR UPDATE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "appointment_costs_delete_own" ON inkflow_appointment_costs;
CREATE POLICY "appointment_costs_delete_own" ON inkflow_appointment_costs FOR DELETE USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "appointment_costs_svc" ON inkflow_appointment_costs;
CREATE POLICY "appointment_costs_svc" ON inkflow_appointment_costs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- price_contributions (studio ne voit que les siennes ; agrégation globale via service_role / vue matérialisée plus tard)
DROP POLICY IF EXISTS "price_contributions_select_own" ON inkflow_price_contributions;
CREATE POLICY "price_contributions_select_own" ON inkflow_price_contributions FOR SELECT USING (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "price_contributions_insert_own" ON inkflow_price_contributions;
CREATE POLICY "price_contributions_insert_own" ON inkflow_price_contributions FOR INSERT WITH CHECK (
  studio_id IN (SELECT id FROM inkflow_studios WHERE email = COALESCE(auth.jwt()->>'email', ''))
);
DROP POLICY IF EXISTS "price_contributions_svc" ON inkflow_price_contributions;
CREATE POLICY "price_contributions_svc" ON inkflow_price_contributions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
