# Phase 2 — Architecture dashboard (7 août 2026)

Ordre strict demandé dans l’audit. Build Vite OK ; échec PWA préexistant (`stats.html` > 2 Mo, hors scope).

---

## Étape 1 — Fusion Overview + synthèse agenda

**Statut : fait**

### Changements

- `OverviewAgendaSummarySection.tsx` : section repliable `#overview-agenda-synthesis` dans Vue d’ensemble (lazy `AgendaSummaryTab`, persistance localStorage, `expandSignal` pour deep links).
- `DashboardOverviewTab.tsx` : liens internes via `onOpenAgendaSummary` au lieu de `?tab=agenda`.
- `DashboardPro.tsx` : panneau L1 `agenda` supprimé ; redirect legacy + scroll automatique ; création RDV → Planning semaine.
- `lib/dashboardNavUrl.ts` : `?tab=agenda` → `tab=overview` + ouverture section synthèse ; `?tab=account|etablissement` → `settings` + `settingsTab`.
- `DashboardProSidebar.tsx` : sous-menu Planning = **Vue semaine**, **Vue mois**, **Disponibilités** uniquement (plus de « Synthèse » séparée).
- `lib/dashboardQuickAccess.ts` : pin « Synthèse agenda » ouvre la section dans Overview.
- Liens résiduels `setActiveTab('agenda')` remplacés (mobile bottom nav, hero, drawer preview, setup navigate).

### Vérif

- `npm run build` : bundle OK (PWA precache inchangé).
- Deep link `?tab=agenda` → Vue d’ensemble + section synthèse ouverte.
- Deep link `inkflowpro://agenda` inchangé côté mobile (URL `tab=agenda` toujours normalisée).

---

## Étape 2 — Gating Statistiques par plan

**Statut : fait**

### Flag existant

- `stats_avancees` documenté dans `docs/PLANS-PERMISSIONS.md` et implémenté via `canAccessFeature('stats_avancees')` dans `lib/subscriptionPlans.ts` (absent Solo, présent Pro+).

### Changements

- `DashboardProSidebar.tsx` : entrée **Statistiques** masquée si `!canViewAdvancedStats`.
- `DashboardPro.tsx` : onglet analytics affiche upsell « Disponible à partir du plan Pro » + CTA billing si accès refusé (URL `?tab=analytics` incluse).

### Vérif

- Build OK.
- Plan Solo : pas de lien sidebar ; accès URL direct → upsell.
- Plan Pro+ : lien visible + `AnalyticsDashboard` chargé.

---

## Étape 3 — Bottom nav mobile

**Statut : fait** (variante **5 items** retenue)

### Implémenté

- `DashboardMobileBottomNav.tsx` : **Accueil · Agenda · Demandes · Clients · Réglages** (5 icônes + FAB central après Agenda).
- Badge demandes déplacé de Accueil (index 0) → **Demandes** (index 2).
- `DashboardPro.tsx` : handlers `onSelectRequests`, Agenda → `appointments` vue semaine.

### Comparaison 5 vs 4 items (arbitrage visuel)

| Variante                   | Composition                        | Lisibilité                                                           | Verdict                                                                         |
| -------------------------- | ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **5 items + FAB** (retenu) | 5×40px + FAB ~48px ≈ 280px utiles  | Icônes seules (pas de labels) ; tient sur 320px avec `max-w-[22rem]` | **Recommandé** — accès direct Demandes + Clients sans sacrifier un onglet       |
| 4 items + FAB              | ex. remplacer Clients par Demandes | Moins dense (~232px)                                                 | Clients moins accessible (sidebar/FAB seulement) — moins bon pour le CRM mobile |

**Recommandation : garder 5 items.** La densité reste acceptable car le dock n’affiche que des icônes 40px ; le goulot serait plutôt un 6e item qu’un 5e.

---

## Étape 4 — Renommages et clarifications

**Statut : fait**

### Changements

- **Suivi client → Messagerie** : sidebar, quick access, FAB mobile, meta tabs recherche.
- **Portfolio / Galerie Flash** : micro-descriptions sidebar (« Réalisations passées » / « Flash à vendre »), labels inchangés.
- **Mon compte + Établissement** : sous-sections de **Paramètres** (`settingsTab=account|etablissement`), plus de tabs L1 séparés ; grille d’accueil Paramètres groupe « Compte & Studio » ; sidebar Paramètres pointe vers `settings` + `settingsTab` ; legacy `?tab=account|etablissement` redirigé.

### Vérif

- Build OK.
- Navigation sidebar Paramètres → Mon compte / Établissement reste dans le shell Paramètres (breadcrumb + onglets secondaires).

---

## Fichiers touchés (résumé)

| Fichier                                                          | Étape                      |
| ---------------------------------------------------------------- | -------------------------- |
| `components/dashboard/overview/OverviewAgendaSummarySection.tsx` | 1                          |
| `components/dashboard/DashboardOverviewTab.tsx`                  | 1                          |
| `components/dashboard/DashboardPro.tsx`                          | 1–4                        |
| `components/dashboard/DashboardProSidebar.tsx`                   | 1–2, 4                     |
| `components/dashboard/DashboardMobileBottomNav.tsx`              | 3                          |
| `lib/dashboardNavUrl.ts`                                         | 1, 4                       |
| `lib/dashboardQuickAccess.ts`                                    | 1, 4                       |
| `components/dashboard/dashboardProNavShared.ts`                  | 1, 4 (types `settingsTab`) |

---

## Tests manuels suggérés

1. `/dashboard?tab=agenda` → synthèse dans Overview, scroll `#overview-agenda-synthesis`.
2. Planning sidebar → semaine/mois uniquement.
3. Compte Solo → pas de Statistiques sidebar ; `/dashboard?tab=analytics` → upsell.
4. Mobile dock → badge sur Demandes ; tap Demandes → inbox.
5. Paramètres → Mon compte / Établissement dans le même shell.
