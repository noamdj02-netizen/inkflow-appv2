# FIXES-STOCK — Simplification traçabilité légale

**Date :** 2026-08-07  
**Agent :** AGENT 1 — Stock / traçabilité  
**Statut :** **fait** (UI + migration commentaires ; tables legacy conservées)

---

## 1. Audit — état avant intervention

### Architecture produit (complexe)

| Zone                          | Fichiers / tables                                                                           | Rôle                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Onglet dashboard `tab=stock`  | `StockAndTraceabilityPanel.tsx`                                                             | 3 sous-onglets : traçabilité, comparateur, catalogue                |
| Comparateur prix              | `ConsumablesComparatorPanel.tsx`, `lib/consumableComparator.ts`, `lib/stockPriceCompare.ts` | Matrice prix fournisseurs, meilleur €/unité, IA Gemini              |
| Catalogue fournisseur         | `SupplierCatalogPanel.tsx`, `lib/supabaseSupplierCatalog.ts`                                | Import catalogue, promos, push vers stock                           |
| Stock quantitatif             | produits, mouvements, vocal                                                                 | `qty_on_hand`, trigger SQL, commandes vocales                       |
| Fournisseurs & presets        | `lib/tattooSupplierPresets.ts`                                                              | Liste Europe/France, import bulk                                    |
| Traçabilité lots (cœur légal) | `inkflow_consumable_lots`                                                                   | lot, référence, péremption, client/RDV, scan QR                     |
| Edge / clôture séance         | `SessionCloseoutSheet`, `TodaySessionCockpit`                                               | Lien « Tracer le matériel » → `?tab=stock&appointmentId=&clientId=` |

### Migrations Supabase existantes

- `20260428120000_finance_stock_pilotage.sql` — produits, fournisseurs, prix, mouvements, lots, contributions
- `20260429130000_consumable_comparator_fields.sql` — champs comparateur
- `20260429131000_supplier_catalog_items.sql` — catalogue fournisseur complet
- `20260420100000_flash_checkout_reserve_stock_rpc.sql` — réservation stock flash (hors scope traçabilité légale)

### Libs touchées

- `lib/supabaseFinanceInventory.ts` — CRUD complet stock + lots
- `lib/supabaseSupplierCatalog.ts`, `lib/stockPriceCompare.ts`, `lib/consumableComparator.ts`, `lib/tattooSupplierPresets.ts`
- `lib/inventoryScanToken.ts`, `lib/barcodeScan.ts` — scan / étiquettes (conservés)
- `lib/geminiAI.ts` — `analyzeStockSupplierPrices` (plus appelé depuis l’UI)

---

## 2. Architecture cible (registre légal minimal)

Cadre : **art. R.513-10-15 CSP** — traçabilité des consommables (encres, pigments, etc.).

```
Dashboard Pro (/dashboard?tab=stock)
└── Registre de traçabilité (StockAndTraceabilityPanel)
    ├── Nouvelle entrée
    │   ├── Référence produit (product_label) *
    │   ├── N° de lot (lot_number) *
    │   ├── Date de péremption (expiry_date)
    │   └── Lien client / RDV (auto si clôture séance)
    ├── Scan code-barres / QR → inkflow_consumable_lots
    ├── Étiquette imprimable (InventoryPrintLabelModal)
    └── Registre listé + export CSV

Entité Supabase (conservée, seule table active UI)
└── inkflow_consumable_lots
    ├── lot_number
    ├── product_label      ← référence produit
    ├── expiry_date
    ├── client_id          ← optionnel
    ├── appointment_id     ← optionnel
    ├── raw_barcode        ← scan
    └── created_at         ← horodatage registre

Tables DEPRECATED (données conservées, UI retirée)
├── inkflow_consumable_products
├── inkflow_consumable_suppliers
├── inkflow_consumable_prices
├── inkflow_stock_movements
├── inkflow_price_contributions
└── inkflow_supplier_catalog_items
```

---

## 3. Fichiers modifiés

| Fichier                                                                 | Action                                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `components/dashboard/StockAndTraceabilityPanel.tsx`                    | **Réécrit** — registre légal + gate `traceabilite_simple` + export CSV |
| `components/dashboard/InventoryPrintLabelModal.tsx`                     | Retrait `supplier_name` du draft étiquette                             |
| `components/dashboard/DashboardPro.tsx`                                 | Libellé nav « Traçabilité »                                            |
| `components/dashboard/DashboardProSidebar.tsx`                          | Idem                                                                   |
| `supabase/migrations/20260807120000_traceability_register_simplify.sql` | **Ajout** — COMMENT deprecated + index `created_at`                    |
| `components/dashboard/TodaySessionCockpit.tsx`                          | Bouton « Traçabilité » + gating `traceabilite_simple` dans le panel    |
| `lib/supabaseFinanceInventory.ts`                                       | Commentaires sections traçabilité vs stock commercial deprecated       |

### Fichiers conservés mais plus montés dans l’UI

- `components/dashboard/ConsumablesComparatorPanel.tsx`
- `components/dashboard/SupplierCatalogPanel.tsx`
- `lib/supabaseSupplierCatalog.ts`, `lib/consumableComparator.ts`, `lib/stockPriceCompare.ts`, `lib/tattooSupplierPresets.ts`

_(Suppression physique possible en Phase 2 après validation fondateur — diff minimal volontaire.)_

---

## 4. Changements schéma (migration)

**Fichier :** `supabase/migrations/20260807120000_traceability_register_simplify.sql`

- `COMMENT ON TABLE/COLUMN` sur `inkflow_consumable_lots` (registre légal)
- `COMMENT ON TABLE … DEPRECATED UI` sur tables stock commercial
- Index `idx_consumable_lots_studio_created` pour export / tri registre
- **Aucun DROP** — compatibilité données studios existants

**À appliquer :** `supabase db push` (fondateur / CI)

---

## 5. RETIRÉ vs CONSERVÉ (justification légale)

| Fonctionnalité                        | Décision      | Justification                                                       |
| ------------------------------------- | ------------- | ------------------------------------------------------------------- |
| N° lot, référence produit, péremption | **CONSERVÉ**  | Champs explicites R.513-10-15 CSP                                   |
| Lien client / RDV                     | **CONSERVÉ**  | Traçabilité « qui / quelle séance »                                 |
| Scan QR / code-barres                 | **CONSERVÉ**  | Accélère saisie sans remplacer l’obligation registre                |
| Export CSV registre                   | **AJOUTÉ**    | Preuve / contrôle DDASSPP                                           |
| Étiquettes imprimables                | **CONSERVÉ**  | Support terrain (pas obligation légale stricte, utile opérationnel) |
| Catalogue fournisseur                 | **RETIRÉ UI** | Achat / sourcing — hors obligation traçabilité                      |
| Comparateur prix + IA Gemini          | **RETIRÉ UI** | Optimisation coûts — hors obligation légale                         |
| Fournisseurs & presets                | **RETIRÉ UI** | Non requis registre                                                 |
| Produits + qty_on_hand                | **RETIRÉ UI** | Gestion stock commerciale ≠ registre légal                          |
| Mouvements stock + vocal              | **RETIRÉ UI** | Inventaire quantitatif — hors CSP                                   |
| Contributions prix communautaires     | **RETIRÉ UI** | Feature growth, non légale                                          |

---

## 6. Checklist tests manuels

- [ ] `/dashboard` → onglet **Traçabilité** s’ouvre sans erreur
- [ ] Saisie manuelle : référence + n° lot + péremption → toast succès, ligne dans le registre
- [ ] Validation : bouton désactivé si référence ou lot vide
- [ ] Clôture séance → « Tracer le matériel » → bandeau contexte RDV/client + entrée liée
- [ ] Scan caméra (HTTPS) : code inconnu → nouvelle entrée ; code existant → info doublon
- [ ] Export CSV : fichier `registre-tracabilite-YYYY-MM-DD.csv` avec colonnes légales
- [ ] Suppression entrée → toast + liste rafraîchie
- [ ] Étiquette imprimable : création lot depuis modal OK
- [ ] Dark mode : lisibilité zinc OK
- [ ] Plan sans `traceabilite_simple` → message upgrade Essentiel (pas de registre)
- [ ] Studios avec anciennes données comparateur : pas de régression (tables intactes)

---

## 7. Risques / validation fondateur

| Risque                                                      | Niveau             | Mitigation                                                                                                     |
| ----------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Studios utilisant comparateur/catalogue en prod             | Moyen              | Tables + libs intactes ; réactivation possible derrière flag                                                   |
| `stock_complet` plan Pro vs `traceabilite_simple` Essentiel | **Aligné Agent 2** | `traceabilite_simple` gate dans `StockAndTraceabilityPanel` ; `stock_complet` orphelin (UI commercial retirée) |
| Export CSV sans nom client lisible (IDs tronqués)           | Faible             | Phase 2 : join `inkflow_clients` / `inkflow_appointments`                                                      |
| Build PWA échoue sur `stats.html` > 2 Mo                    | Préexistant        | Vite bundle OK ; échec `vite-plugin-pwa` unrelated                                                             |
| Suppression entrées registre                                | Moyen              | Pas d’audit trail immuable — valider si soft-delete requis légalement                                          |

---

## 8. Feature flags (Agent 2 — référence uniquement)

**Flags déjà présents** dans `lib/subscriptionPlans.ts` / `types/index.ts` (non modifiés par Agent 1) :

| Flag                  | Plan              | Usage post-simplification                                                                                       |
| --------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `traceabilite_simple` | Essentiel (solo)+ | Registre lots + export CSV + scan — **gated** dans `StockAndTraceabilityPanel` via `useSubscriptionPermissions` |
| `stock_complet`       | Pro+              | Stock commercial (comparateur, catalogue, qty) — **UI retirée** ; flag réservé Phase 2+ ou réactivation Pro     |

Flags additionnels documentés (non créés) :

- `traceabilite_export_pdf` — export PDF signé horodaté (Pro+)
- `traceabilite_scan_etiquette` — étiquettes custom avancées

**Route :** conserver `tab=stock` (deep link clôture séance).

---

## 9. Résultat build

```bash
npm run build
```

- **Vite production bundle :** ✓ OK (~13s, re-run 2026-08-07)
- **Chunk `StockAndTraceabilityPanel` :** ~24 kB gzip ~8.7 kB (allégé vs. 3 sous-modules + Gemini)
- **PWA injectManifest :** ✗ Échec — `stats.html` 3.52 MB > limite 2 MB (problème préexistant, hors scope stock)

---

## 10. Prochaines étapes (hors scope Agent 1)

1. Fondateur : `supabase db push` migration commentaires
2. Phase 2 : join noms client/RDV dans liste ; PDF registre ; soft-delete audit
3. Nettoyage code mort : supprimer fichiers comparateur/catalogue si validation business
4. Agent 2 : masquer onglet nav si pas `traceabilite_simple` (optionnel — panel gate déjà en place)
