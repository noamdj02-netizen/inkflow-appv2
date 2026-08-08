# Ink-Report — Audit complet 2026-08-08

**Repo:** inkflow-appv2 · **Branche:** `cleanup/remove-satellite-dirs`  
**Build:** ✅ `npm run build` OK (après fix PWA `stats.html`)  
**TypeScript:** ⚠️ ~175 erreurs pré-existantes (landing motion, `LandingMotionItemProps`) — non bloquant Vite prod

---

## P0 — Bloquants prod (traités cette session)

| ID       | Problème                                                   | Action                                             |
| -------- | ---------------------------------------------------------- | -------------------------------------------------- |
| P0-BUILD | PWA precache `stats.html` 3.58 MB → build Vercel KO        | `globIgnores: **/stats.html` dans `vite.config.ts` |
| P0-TYPES | `types/database.ts` vide (0 bytes)                         | Restauré depuis `origin/main` (298 lignes)         |
| P0-CAL   | `PlanningCalendarPicker` — mauvais import `DayButtonProps` | Import type depuis `react-day-picker`              |

---

## P0 — Sécurité backend (à traiter fondateur / hardening)

| ID     | Fichier                                         | Risque                                    |
| ------ | ----------------------------------------------- | ----------------------------------------- |
| SEC-01 | `supabase/functions/post-appointment-closeout/` | `verify_jwt=false`, pas de gate cron      |
| SEC-02 | `supabase/functions/send-loyalty-emails/`       | Idem — emails bulk sans auth              |
| SEC-03 | `supabase/functions/google-places/`             | JWT décodé sans vérif signature           |
| SEC-04 | `supabase/functions/notification-webhook/`      | Pas d’auth → chaîne push                  |
| SEC-05 | `supabase/functions/_shared/cronGate.ts`        | Si `EDGE_CRON_SECRET` absent → tout passe |

**OK vérifié :** `stripe-webhook` (`constructEvent`), pas de `sk_live` / `service_role` dans `lib/`.

---

## P1 — Qualité / perf frontend

| ID    | Item                                  | Recommandation                                   |
| ----- | ------------------------------------- | ------------------------------------------------ |
| FE-01 | Bundle `vendor-others` ~1.3 MB        | Lazy routes + revoir `manualChunks`              |
| FE-02 | PWA precache 686 entries / 39 MB      | Revoir `globPatterns` (woff2 only utile)         |
| FE-03 | `npm audit` 11 high (ws, svix/resend) | `npm audit fix` ciblé post-MVP                   |
| FE-04 | TS strict landing                     | Typer `LandingMotionItemProps` avec `children`   |
| FE-05 | Demandes + Clients UI                 | Alignés pilotage (`dashboardPilotagePage.ts`) ✅ |

---

## P2 — Produit / UX (déjà en cours)

- Mobile dashboard : bottom nav `lg:hidden`, CapsuleTabs antd-mobile
- Pricing TEST Stripe 14/37/99€ — smoke checkout fondateur
- Hero dupliqué masqué mobile (overview, demandes, clients)

---

## Déploiement

- **GitHub:** push branche `cleanup/remove-satellite-dirs`
- **Vercel:** build `npm run build` → `dist/` (auto-deploy sur push)
- **Post-deploy:** Notion deploy report + vérifier secrets Supabase Edge (`EDGE_CRON_SECRET`)

---

## Fixes appliqués (commit deploy)

1. `vite.config.ts` — exclude `stats.html` du precache PWA
2. `types/database.ts` — restore Supabase types
3. `PlanningCalendarPicker.tsx` — fix type DayButton
4. `supabase/functions/_shared/cronGate.ts` — fail-closed si secret cron absent
5. UI Demandes/Clients — tokens `dashboardPilotagePage.ts`
