-- Simplification produit : registre légal de traçabilité uniquement (art. R.513-10-15 CSP).
-- Les tables stock commercial restent en base pour compatibilité données existantes ;
-- l'UI dashboard n'y accède plus (voir FIXES-STOCK-2026-08-07.md).

COMMENT ON TABLE inkflow_consumable_lots IS
  'Registre légal traçabilité consommables tatouage : n° lot, référence produit (product_label), péremption, lien client/RDV.';

COMMENT ON COLUMN inkflow_consumable_lots.product_label IS
  'Référence produit (dénomination commerciale ou libellé interne) — obligation R.513-10-15 CSP.';

COMMENT ON COLUMN inkflow_consumable_lots.lot_number IS
  'Numéro de lot fabricant ou identifiant traçabilité.';

COMMENT ON COLUMN inkflow_consumable_lots.expiry_date IS
  'Date de péremption du lot consommable.';

COMMENT ON TABLE inkflow_consumable_products IS
  'DEPRECATED UI — gestion stock quantitatif ; conservé pour données historiques et trigger mouvements.';

COMMENT ON TABLE inkflow_consumable_suppliers IS
  'DEPRECATED UI — catalogue fournisseurs ; non requis pour traçabilité légale MVP.';

COMMENT ON TABLE inkflow_consumable_prices IS
  'DEPRECATED UI — historique prix fournisseurs / comparateur.';

COMMENT ON TABLE inkflow_stock_movements IS
  'DEPRECATED UI — mouvements stock quantitatif ; non requis registre légal.';

COMMENT ON TABLE inkflow_price_contributions IS
  'DEPRECATED UI — contributions anonymisées comparateur prix communautaire.';

COMMENT ON TABLE inkflow_supplier_catalog_items IS
  'DEPRECATED UI — catalogue complet fournisseur (import Gemini).';

CREATE INDEX IF NOT EXISTS idx_consumable_lots_studio_created
  ON inkflow_consumable_lots(studio_id, created_at DESC);
