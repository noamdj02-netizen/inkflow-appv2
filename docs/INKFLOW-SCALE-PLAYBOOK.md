# Playbook — Scaler InkFlow & la micro-entreprise

Guide unique pour faire grandir **l’app** et **l’entreprise** avec peu de ressources. Les compétences détaillées sont dans les **skills Cursor** listés en fin de document ; ce fichier oriente les priorités et la stack InkFlow.

---

## 1. Objectif

Scaler ici signifie : **plus de studios payants**, **moins de friction support**, **coûts variables sous contrôle**, **zéro incident critique** sur l’argent et les données — sans forcément agrandir l’équipe.

---

## 2. Quatre piliers (à équilibrer)

### A. Produit & fiabilité

| Action            | Détail InkFlow                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Déploiements sûrs | Build avant merge ; Vercel + `supabase functions deploy` pour les fonctions touchées                                |
| Observabilité     | Logs Edge Functions (Supabase) ; erreurs client (console / feedback utilisateurs) ; Stripe Dashboard pour paiements |
| Données & accès   | RLS Postgres ; pas de données studio sans `studioId` ; revue des policies quand tu ajoutes des tables ou du public  |
| Paiements         | Webhooks Stripe alignés avec l’état réservation/abonnement ; idempotency côté functions si besoin                   |
| Perf              | Requêtes indexées ; limiter les `select('*')` lourds sur grosses tables ; éviter les N+1 côté dashboard             |

### B. Acquisition

| Action            | Détail                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Un canal dominant | Au début : contenu SEO, bouche-à-oreille studios, partenariats, ou pubs très ciblées — pas tout en même temps |
| Landing & book    | Tunnel `/book`, vitrine studio, pricing : même promesse ; tests incrémentaux (voir skill page-cro)            |
| Preuve sociale    | Études de cas studios, témoignages, chiffres anonymisés                                                       |

### C. Rétention & support

| Action           | Détail                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Time-to-value    | Onboarding jusqu’au premier RDV ou premier paiement enregistré                                |
| Réponses rapides | `[SUPPORT-FAQ-TEMPLATES.md](./SUPPORT-FAQ-TEMPLATES.md)` ; skill customer-support pour le ton |
| Churn            | Comprendre cause d’arrêt ; offre save / clarification usage (skill churn-prevention)          |

### D. Finance & ops (micro-entreprise)

| Action                | Détail                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit economics        | MRR − coûts variables (Stripe, Supabase egress, Resend, Twilio SMS,…) ; grille `[UNIT-ECONOMICS-SNAPSHOT.md](./UNIT-ECONOMICS-SNAPSHOT.md)` ; objectif de marge clair |
| Trésorerie            | Décaler si besoin paiements tools vs encaissement clients ; anticiper TVA / charges selon ta structure                                                                |
| Documentation interne | `[CONFIGURATION.md](./CONFIGURATION.md)` (dont inventaire Edge Functions), secrets Edge, qui appelle quoi (évite les tunnels « dans la tête » d’une seule personne)   |

---

## 3. Stack InkFlow — où regarder quand ça scale

| Zone           | Éléments typiques                                                              |
| -------------- | ------------------------------------------------------------------------------ |
| Frontend SPA   | Racine projet, `vite build`, dashboards `components/dashboard/`                |
| Auth & données | `lib/supabase.ts`, `lib/supabaseDashboard.ts`, RLS dans `supabase/migrations/` |
| Paiements      | `lib/stripeClient.ts`, `supabase/functions/stripe-webhook/`, Checkout sessions |
| Emails         | Edge `send-*`, secrets `RESEND_*` (`docs/CONFIGURATION.md`)                    |
| SMS optionnel  | `send-booking-confirmation`, secrets `TWILIO_*`                                |

---

## 4. Phases (indicatif)

**Phase 0 — Artisan (0→~30 studios payants)**  
Fiabilité des parcours réservation + abonnement, support réactif, une métrique nord (ex. MRR ou studios actifs semaine).

**Phase 1 — Système (~30→100+)**  
Analytics structurées (voir skill analytics-tracking), optimisation coûts (cost-reducer), durcissement sécurité (security), documentation ops à jour.

**Phase 2 — Levier**  
Canal acquisition scalable (content + outbound ou ads maîtrisés), première embauche ou prestataire ciblé (support ou dev) selon goulot réel — pas avant clarté sur CAC/LTV grossière.

Ajuster les seuils selon ton pricing et ta marge réelle.

---

## 5. Skills Cursor à utiliser (chemins repo)

Charger le fichier `SKILL.md` correspondant dans Cursor quand tu travailles sur le sujet.

| Sujet                             | Skill                                                                       |
| --------------------------------- | --------------------------------------------------------------------------- |
| Charge, archi API/DB              | `.cursor/skills/scalability/SKILL.md`                                       |
| Réduire les coûts cloud / tooling | `.cursor/skills/cost-reducer/SKILL.md`                                      |
| Sécurité, audits                  | `.cursor/skills/security/SKILL.md`, `.agents/skills/vibe-security/SKILL.md` |
| GA4 / events / attributions       | `.cursor/skills/analytics-tracking/SKILL.md`                                |
| Prix, plans, packaging            | `.cursor/skills/pricing-strategy/SKILL.md`                                  |
| Pages marketing & CRO             | `.cursor/skills/page-cro/SKILL.md`                                          |
| Paywalls dashboard                | `.cursor/skills/paywall-upgrade-cro/SKILL.md`                               |
| Brainstorm tactiques growth       | `.cursor/skills/marketing-ideas/SKILL.md`                                   |
| Publicité payante                 | `.cursor/skills/paid-ads/SKILL.md`                                          |
| Leads → sales / lifecycle         | `.cursor/skills/revops/SKILL.md`                                            |
| Support client                    | `.cursor/skills/customer-support/SKILL.md`                                  |
| Rétention & annulations           | `.cursor/skills/churn-prevention/SKILL.md`                                  |
| **Routeur (ce playbook)**         | `.cursor/skills/inkflow-scale-micro-entreprise/SKILL.md`                    |

---

## 6. Docs associés (interne — scale & clarté produit)

| Document                                                                   | Rôle                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `[PRODUCT-CORE-VS-PRO.md](./PRODUCT-CORE-VS-PRO.md)`                       | Cœur vs Pro, continuité bookings/appointments, message tatoueur.          |
| `[NORTH-STAR-FUNNEL.md](./NORTH-STAR-FUNNEL.md)`                           | Funnel « lien public → RDV → acompte » (PostHog).                         |
| `[REGRESSION-CRITICAL-PATHS.md](./REGRESSION-CRITICAL-PATHS.md)`           | Parcours critiques + smoke Playwright.                                    |
| `[SECURITY-NARRATIVE-STRIPE-RGPD.md](./SECURITY-NARRATIVE-STRIPE-RGPD.md)` | Rappels secrets, RLS, communication conformité.                           |
| `[SUPPORT-FAQ-TEMPLATES.md](./SUPPORT-FAQ-TEMPLATES.md)`                   | Modèles de réponses support (objectif sous 48 h : Stripe, book, e-mails). |
| `[UNIT-ECONOMICS-SNAPSHOT.md](./UNIT-ECONOMICS-SNAPSHOT.md)`               | Grille mensuelle MRR vs coûts variables (fondateur).                      |
| `[CONFIGURATION.md](./CONFIGURATION.md)` (sections 8 à 10)                 | Checklist scale, inventaire Edge Functions, index docs ops.               |

---

## 7. Checklist rapide « santé avant de scaler la com »

- Parcours **signup → paiement Stripe** testé sur preview + prod
- **Webhooks** Stripe reçoivent les évènements critiques
- Backup / accès projet **Supabase** documenté (sans partager secrets en clair)
- **Politique RGPD / données** à jour pour la vitrine et les messages clients
- Une personne peut **répondre support** sous **48 h**
- Tu connais le **coût moyen** par studio actif et par transaction (hors frais Stripe)

---

## 8. Synthèse

Les skills existent déjà dans le repo : ce playbook donne **l’ordre des priorités** pour une **micro-entreprise** avec **InkFlow**. Point d’entrée agent : `**inkflow-scale-micro-entreprise`\*\*.
