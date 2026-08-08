# Sécurité & conformité — narration produit (rappel dev)

Ce fichier **ne remplace pas** une audit complète (voir skills `security` et `vibe-security`). Il fixe les **attendus** pour communiquer avec les studios et éviter les faux pas techniques.

## Principes

1. **Stripe** — Les secrets (`STRIPE_SECRET_KEY`, webhooks) vivent **uniquement** côté Supabase Edge / serveur, jamais dans le bundle Vite.
2. **Données studio** — Toute lecture/écriture métier passe par **RLS** Postgres (`studio_id`, JWT tatoueur). Pas de `service_role` dans le client SPA.
3. **Espace client** — Accès limité aux données du client concerné (email / session portal selon policies).
4. **RGPD / export** — Fonction export studio (`export-studio-gdpr`) et mentions sur les formulaires publics ; hors scope de ce doc : textes juridiques définitifs par ton conseil.

## Checklist rapide avant communiquer « bank-grade »

- [ ] Aucune clé API résend/stripe/twilio dans le repo ou `import.meta.env` côté client hors **anon** Supabase.
- [ ] Webhooks Stripe vérifiés avec **signature** (`stripe-webhook`).
- [ ] Cron / fonctions sensibles avec secret dédié ou JWT selon le cas.

Pour la **checklist produit / scale**, voir **`docs/INKFLOW-SCALE-PLAYBOOK.md`** et **`docs/PRODUCT-CORE-VS-PRO.md`**.
