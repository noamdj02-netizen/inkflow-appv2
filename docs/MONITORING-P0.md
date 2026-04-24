# Monitoring minimum (P0.6)

Référence variables : [ENV-PRODUCTION.md](ENV-PRODUCTION.md).  
L’app **en production** est le bundle **Vite** ; l’init Sentry navigateur = [`instrumentation.ts`](../instrumentation.ts) via [`index.tsx`](../index.tsx).

---

## 1. Sentry — app web (obligatoire pour recevoir les erreurs)

| #   | Action                                                                                                                    | OK  | Date | Notes |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --- | ---- | ----- |
| 1.1 | `VITE_SENTRY_DSN` défini dans **Vercel** → Environment variables → **Production** (même valeur DSN que le projet Sentry). | [ ] |      |       |
| 1.2 | Redéploiement après ajout / changement de `VITE_` (rebuild nécessaire).                                                   | [ ] |      |       |
| 1.3 | Vérif locale du format : `node scripts/readiness.mjs sentry` (avec `.env.local`).                                         | [ ] |      |       |
| 1.4 | Test : une erreur volontaire en preview ou prod → **Issue** visible dans Sentry (1–2 min).                                | [ ] |      |       |

**Source maps (recommandé)** : au build CI ou local prod, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — voir [ENV-PRODUCTION.md](ENV-PRODUCTION.md) et `npm run qa:sentry-build`.

**Edge (optionnel)** : secret `SENTRY_DSN` sur Supabase pour les Edge Functions qui l’utilisent (ex. `stripe-webhook`) — indépendant du front.

**Next.js** : le dépôt contient des fichiers `sentry.*.config.ts` pour d’éventuels builds Next ; ils n’ont **pas** de DSN en dur. Sentry côté serveur Next n’init que si `SENTRY_DSN` est présent. La prod Vite n’en dépend pas.

---

## 2. Sentry — alertes e-mail (sinon personne ne regarde le dashboard)

À faire **dans l’UI Sentry** (liens d’aide : [sentry.io](https://sentry.io) → ton org → projet) :

1. Ouvrir le **projet** concerné.
2. **Alerts** (ou _Settings → Project Alerts_ selon l’UI) → **Create alert rule**.
3. Condition typique : _nouvelle issue_ ou _régime d’événements_ / first seen.
4. **Action** : **Send a notification via** → **Mail** → ton e-mail.
5. Enregistrer.

| #   | Vérification                                                                 | OK  | Date |
| --- | ---------------------------------------------------------------------------- | --- | ---- |
| 2.1 | Au moins **une** règle active qui m’envoie un e-mail (pas seulement in-app). | [ ] |      |

**Test** : provoquer une issue (même en staging) et confirmer la réception du mail (ou bannière d’essai Sentry).

---

## 3. Uptime monitoring (hors Vercel / hors app)

Objectif : savoir que le site est **down avant** les messages clients.

1. Choisir **un** outil (ex. [BetterStack](https://betterstack.com), [UptimeRobot](https://uptimerobot.com), [Checkly](https://www.checklyhq.com) — offres gratuites souvent possibles pour 1 URL).
2. Cible : URL canonique de l’app, ex. `https://app.ink-flow.me` (ou domaine de prod Vercel), `GET` ou `HEAD`, intervalle **1–5 min**.
3. Alerte : **e-mail** (ou Slack si l’équipe l’utilise).

| #   | Champ               | Valeur      |
| --- | ------------------- | ----------- |
| 3.1 | Outil retenu        | (à remplir) |
| 3.2 | URL surveillée      | (à remplir) |
| 3.3 | Actif depuis (date) | (à remplir) |

---

## 4. Logs Vercel (habitude, premiers mois)

- **Fréquence** : au moins **1×/semaine** les premiers mois après le go-live.
- **Où** : Vercel → le projet → **Logs** (Runtime / build selon l’onglet) — rechercher **5xx**, pics d’erreurs, déploiements en échec.
- Rien à commiter : discipline d’équipe ; cocher ici quand c’est tenu un mois.

| Mois (AAAA-MM) | Hebdo consulté (×/4) | Commentaire |
| -------------- | -------------------- | ----------- |
|                |                      |             |

---

## 5. Liens utiles

- Status fournisseurs (incidents) : [Supabase](https://status.supabase.com), [Vercel](https://www.vercel-status.com), [Stripe](https://status.stripe.com) — voir aussi [BACKUP-RECOVERY-DR.md](BACKUP-RECOVERY-DR.md) pour le runbook.
