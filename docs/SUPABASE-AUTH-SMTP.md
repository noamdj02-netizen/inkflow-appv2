# Supabase Auth — emails (confirmation, reset) et Resend

## FAQ — « Je ne vois pas les confirmations dans le dashboard Resend »

- **C’est normal** si vous n’avez configuré que **`RESEND_API_KEY` dans les secrets des Edge Functions** : cette clé sert aux mails **métier** (RDV, messagerie, etc.), **pas** aux mails **Auth** (confirmation d’inscription, reset mot de passe).
- Les confirmations **Auth** sont envoyées par **le service mail intégré à Supabase** *ou* par **SMTP personnalisé** configuré dans le **Dashboard Supabase** (pas dans le code du repo).
- Pour que **Resend** envoie aussi ces mails **et** qu’ils apparaissent dans **Resend → Emails / Logs** (selon le type d’intégration), il faut **Authentication → Custom SMTP** avec les identifiants **SMTP Resend** (voir checklist ci‑dessous). Sans ça, vous ne « verrez » pas ces envois côté Resend comme pour l’API.

## FAQ — « Je ne reçois aucun mail de confirmation »

1. **Authentication → Providers → Email** : **Confirm email** doit être activé si vous attendez un mail.
2. **Authentication → URL Configuration** : **Redirect URLs** doit inclure `https://app.ink-flow.me/**` (et previews Vercel si besoin) — sinon l’inscription ou le lien peut échouer (voir erreurs dans l’UI après correctifs).
3. **Spam / Promotions** : vérifier aussi l’onglet courriers indésirables.
4. **Quota / transport par défaut** : sans SMTP dédié, le service intégré Supabase peut être plus lent ou filtré ; le **SMTP Resend** améliore la délivrabilité.

## Deux canaux distincts

| Canal | Rôle | Configuration |
|--------|------|----------------|
| **Supabase Auth** | Emails système : **confirmation d’inscription**, **réinitialisation de mot de passe**, changement d’email | Dashboard Supabase → **Authentication** → **Providers** → **Email** (SMTP ou défaut Supabase) |
| **Edge Functions + API Resend** | Mails **métier** (RDV, messagerie, rappels, parrainage, etc.) | Secrets `RESEND_API_KEY`, `RESEND_FROM_EMAIL` sur les fonctions ; voir [RESEND-EMAILS-DEBUG.md](./RESEND-EMAILS-DEBUG.md) |

Le signup dans l’app (`supabase.auth.signUp` avec `emailRedirectTo`) **ne passe pas** par `_shared/resend.ts`. Tant que le projet n’utilise pas un **SMTP personnalisé** (ou que la livraison par défaut Supabase n’est pas adaptée), les mails Auth peuvent être retardés, filtrés ou non délivrés selon les quotas / réputation.

**Contournement côté InkFlow (prod)** : l’app envoie aussi un **lien d’activation** via l’Edge Function **`send-studio-auth-link`** (magic link généré par l’API Admin + envoi **Resend**), comme pour l’espace client (`send-client-magic-link`). Déployer : `npx supabase functions deploy send-studio-auth-link --no-verify-jwt`. Les secrets `RESEND_API_KEY` / `RESEND_FROM_EMAIL` doivent être définis (identiques aux autres fonctions mail).

**Ne pas désactiver la confirmation d’email en production.**

---

## Checklist — Resend en SMTP pour Auth (recommandé)

1. **Resend** : domaine vérifié + clé API ; pour SMTP Resend utilise typiquement ([doc officielle](https://resend.com/docs/send-with-smtp)) :
   - **Host** : `smtp.resend.com`
   - **Port** : `465` (SMTPS) ou `587` (STARTTLS)
   - **Username** : `resend`
   - **Password** : votre **API key** Resend (`re_…`)
2. **Supabase Dashboard** → **Authentication** → **Providers** → **Email** :
   - Activer **Custom SMTP** et renseigner les champs ci‑dessus ;
   - **Sender email** : une adresse sur un domaine **vérifié** chez Resend (ex. `contact@ink-flow.me`), pas seulement `onboarding@resend.dev` en prod multi‑destinataires.
3. Après configuration, les envois Auth peuvent apparaître dans **Resend → Emails** (comme pour l’API).
4. **Authentication** → **URL configuration** :
   - **Site URL** : URL canonique de l’app (ex. `https://app.ink-flow.me`).
   - **Redirect URLs** : inclure au minimum :
     - `http://localhost:3000/**` ou `http://localhost:5173/**` (selon votre port Vite)
     - `https://app.ink-flow.me/**` (inclut le reset mot de passe : après clic e-mail l’utilisateur arrive sur `https://app.ink-flow.me/reset-password`, puis redirection vers `/auth/update-password` pour choisir le nouveau mot de passe — ne pas utiliser `https://ink-flow.me` comme **Site URL** pour l’auth)
     - Toute URL de **preview Vercel** utilisée pour tester les liens de confirmation.

Sans Redirect URLs correctes, le lien dans l’email de confirmation peut être refusé ou rediriger vers une origine non autorisée.

---

## Alignement avec les mails API (Edge)

- Domaine **vérifié** sur Resend et expéditeur du type `InkFlow <contact@ink-flow.me>` pour les Edge Functions (secret `RESEND_FROM_EMAIL`).
- Les secrets **Edge** (`RESEND_API_KEY`, etc.) ne remplacent **pas** le transport Auth : le SMTP Auth se configure **uniquement** dans le dashboard Supabase (ou équivalent), pas via le code applicatif.

---

## Tests en local

- S’inscrire depuis `http://localhost:3000` : le lien dans l’email pointe vers cette origine si c’est celle utilisée au moment du signup — les Redirect URLs Supabase doivent l’autoriser.
- Pour un comportement « comme la prod », tester l’inscription depuis l’URL déployée (`https://app.ink-flow.me`) afin que le lien de confirmation cible directement l’app en ligne.

### Forcer l’origine des liens en local (avancé)

Si tu dois tester les emails de confirmation avec une URL de prod alors que la SPA tourne en `localhost`, il faudrait adapter `getCanonicalAppOrigin()` dans `lib/urls.ts` (par ex. variable d’environnement dédiée). À n’utiliser que sciemment.

---

## Mail de bienvenue tatoueur (Resend, après validation)

Après confirmation du compte et création du studio (flux tatoueur, pas `/client`), l’app peut appeler l’Edge Function **`send-tattooer-welcome`** pour un email de bienvenue via Resend. L’envoi est **idempotent** (métadonnée utilisateur `inkflow_welcome_email_sent`). Voir le déploiement dans le dossier `supabase/functions/send-tattooer-welcome/`.

---

## Où lire les logs

- **Supabase** → **Edge Functions** → fonction concernée → **Logs** (invocations, erreurs Resend).
- **Resend** → **Emails** (statut de livraison, bounces).

Pour le détail des erreurs API Resend côté Edge, les helpers dans `supabase/functions/_shared/resend.ts` journalisent le **statut HTTP** et un **extrait du corps** de réponse (sans secrets).
