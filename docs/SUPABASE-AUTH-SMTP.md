# Supabase Auth — emails (confirmation, reset) et Resend

## Deux canaux distincts

| Canal | Rôle | Configuration |
|--------|------|----------------|
| **Supabase Auth** | Emails système : **confirmation d’inscription**, **réinitialisation de mot de passe**, changement d’email | Dashboard Supabase → **Authentication** → **Providers** → **Email** (SMTP ou défaut Supabase) |
| **Edge Functions + API Resend** | Mails **métier** (RDV, messagerie, rappels, parrainage, etc.) | Secrets `RESEND_API_KEY`, `RESEND_FROM_EMAIL` sur les fonctions ; voir [RESEND-EMAILS-DEBUG.md](./RESEND-EMAILS-DEBUG.md) |

Le signup dans l’app (`supabase.auth.signUp` avec `emailRedirectTo`) **ne passe pas** par `_shared/resend.ts`. Tant que le projet n’utilise pas un **SMTP personnalisé** (ou que la livraison par défaut Supabase n’est pas adaptée), les mails Auth peuvent être retardés, filtrés ou non délivrés selon les quotas / réputation.

**Ne pas désactiver la confirmation d’email en production.**

---

## Checklist — Resend en SMTP pour Auth (recommandé)

1. **Resend** : créer les identifiants **SMTP** (hôte, port, utilisateur, mot de passe) pour intégrations tierces ([documentation Resend SMTP](https://resend.com/docs/send-with-smtp)).
2. **Supabase Dashboard** → **Authentication** → **Providers** → **Email** :
   - Activer **Custom SMTP** ;
   - Coller hôte, port, user, password Resend (souvent port **465** TLS ou **587** STARTTLS selon la doc Resend).
3. **Authentication** → **URL configuration** :
   - **Site URL** : URL canonique de l’app (ex. `https://app.ink-flow.me`).
   - **Redirect URLs** : inclure au minimum :
     - `http://localhost:3000/**`
     - `https://app.ink-flow.me/**`
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
