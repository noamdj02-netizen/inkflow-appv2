# Plan d’amélioration — statut d’exécution

Document mis à jour lors du passage « lancement plan » (mai 2026).  
Références : `PRODUCTION-READINESS-CHECKLIST.md`, **`MVP-FINI-ACTIONS-FOUNDATEUR.md`** (checklist fondateur MVP), synthèse audits, InkCheck.

## Exécuté dans le dépôt (automatisable localement)

| Action                           | Statut | Détail                                                                                                                                                               |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm audit fix`                  | Fait   | Vulnérabilités réduites (reste notamment `xlsx` high, chaîne `@react-email` / postcss moderate — pas de correctif npm simple).                                       |
| Build sans warning CSS Lightning | Fait   | Exclusion Tailwind : `claude-skills/` + `docs/` du scan (`index.css` `@source not`). Remplacement utilitaires fragiles par `.scrollbar-hide` et `.touch-scroll-ios`. |
| `npm run typecheck`              | OK     | `tsc --noEmit` vert après changements.                                                                                                                               |
| `npm run db:types:linked`        | Fait   | `types/database.ts` régénéré depuis le projet Supabase **lié** (CLI) ; filtre les lignes parasites stdout du CLI.                                                    |
| `npm run build`                  | OK     | Chunk alert >800 KB inchangé (hors scope immédiat).                                                                                                                  |

## À faire côté équipe / infra (non automatisables depuis le repo)

Repérer §6–§8 de `PRODUCTION-READINESS-CHECKLIST.md` :

- [ ] Redirect URLs Supabase + OAuth Google (port 3000 dev = prod paths)
- [ ] Stripe Live + webhook + secret `whsec_` aligné + test idempotence
- [ ] Connect + `create-checkout-session` pour 2 studios test
- [ ] Resend domaine + secrets
- [ ] Déploiement Edge (bloc §7)
- [ ] Sentry prod + alerte mail + uptime (`MONITORING-P0.md`)
- [ ] `npm run db:types` avec `SUPABASE_PROJECT_ID` **ou** `npm run db:types:linked` si `supabase link` est déjà fait (voir `package.json`).

## Suivi risques résiduels

- **xlsx** : import CSV côté tatoueur — limiter taille, formats, envisager parsing serveur ou lib alternative.
- **CORS Edge** : large sur previews Vercel — documenter ou restreindre par env si besoin (`supabase/functions/_shared/cors.ts`).

## Fichiers touchés (session exécution)

- `index.css` — `@source not` + classe `.touch-scroll-ios`
- `components/dashboard/AgendaSummaryTab.tsx` — `scrollbar-hide`
- `pages/public/ClientDashboard.tsx` — `scrollbar-hide`
- `pages/LoginPage.tsx`, `pages/SignupPage.tsx`, `components/onboarding/*.tsx` — `touch-scroll-ios`
- `package-lock.json` — suites `npm audit fix`
