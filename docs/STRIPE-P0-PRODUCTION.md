# P0.2 — Stripe production (go-live + TVA)

Document opérationnel aligné sur le code actuel : webhook `stripe-webhook` (idempotence fail-closed, `Stripe.webhooks.constructEvent`), portail facturation, checkout Connect.

**Référence variables :** [ENV-PRODUCTION.md](./ENV-PRODUCTION.md). Checklist transverse (calendrier, réservations, déploiements Edge) : [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md).

---

## 1. Secrets et mode LIVE (obligatoire)

1. **Dashboard Stripe** : basculer en **mode Live** (pas Test) pour valider compte, IBAN, exigences Stripe.
2. **Clés** :
   - `STRIPE_SECRET_KEY` = `sk_live_…` (Edge Functions Supabase, pas le frontend).
   - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_…` sur Vercel si utilisé côté client.
3. **Webhook production** : [Webhooks](https://dashboard.stripe.com/webhooks) → endpoint dont l’URL est  
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Copier le **Signing secret** `whsec_…` → secret Supabase `STRIPE_WEBHOOK_SECRET` (même endpoint que le mode test ; en pratique un secret **par** endpoint ; utiliser celui de l’endpoint **live**).
4. **Déploiement** : `npx supabase functions deploy stripe-webhook --no-verify-jwt` après tout changement de code ou de secrets.
5. **`SITE_URL` / `APP_URL`** : URL publique du site (pas `localhost`) pour les redirections checkout et le portail.

---

## 2. Customer Portal (factures, moyen de paiement, annulation)

1. [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)
2. Activer selon le modèle métier : téléchargement des **factures PDF**, mise à jour du moyen de paiement, **annulation d’abonnement** (si proposé).
3. Côté app : `create-portal-session` + `BillingSettings` — le portail Stripe applique la config du Dashboard. Optionnel : `STRIPE_PORTAL_CONFIGURATION_ID` (voir [CONFIGURATION.md](./CONFIGURATION.md)).

---

## 3. Vérifications manuelles avant « prod propre »

1. **Paiement LIVE** (petit montant) : le webhook reçoit l’événement ; une **seule** ligne `inkflow_stripe_processed_events` pour cet `event.id` (sauf duplicates intentionnels, ignorés en 200).
2. **Rejeu** : Stripe CLI `stripe events resend <event_id>` ou **Resend** dans le détail d’un événement — le traitement métier ne doit **pas** doubler l’effet (crédit, validation de RDV, etc.) grâce à l’idempotence.
3. **Deux comptes studio** : chacun ouvre le portail facturation et ne voit **que** son client Stripe.
4. **`invoice.payment_failed`** (ou scénario d’échec de paiement) : vérifier le comportement attendu côté app / emails (selon l’implémentation du `case` dans le webhook).

---

## 4. TVA / conformité fiscale (hors code court terme)

- **Mandat** : le statut fiscal (micro, société, assujettissement, seuils) et les obligations en France/UE relèvent du **conseil comptable** — ne pas s’y substituer avec ce document.
- **Produit (optionnel)** : [Stripe Tax](https://stripe.com/tax) peut calculer et collecter la TVA sur des Checkout Sessions / abonnements **si** le compte, les produits et les pays cibles sont configurés dans Stripe.  
  Côté code, les sessions créées par `create-checkout-session` (API `v1/checkout/sessions`, `application/x-www-form-urlencoded`) pourraient inclure `automatic_tax[enabled]=true` et des champs requis par Stripe **après** activation et configuration dans le Dashboard.  
  Ne pas activer en production sans validation métier + comptable + tests sur les montants affichés.

---

## 5. Synthèse

| Sujet                           | Où c’est géré                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Signature + anti-replay         | `Stripe.webhooks.constructEvent` dans `supabase/functions/stripe-webhook/index.ts`    |
| Idempotence                     | Table `inkflow_stripe_processed_events` ; échec non-duplicate → **503** (fail-closed) |
| Acomptes / Connect              | `create-checkout-session` + `payment_intent_data[transfer_data][destination]`         |
| Abonnement plateforme + portail | Webhook `checkout.session.completed` / abonnement + `create-portal-session`           |
