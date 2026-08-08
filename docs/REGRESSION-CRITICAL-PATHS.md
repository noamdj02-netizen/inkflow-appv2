# Régression — parcours critiques

Liste **incrémentale** : à exécuter avant release majeure ou après changement sur paiements / RDV / webhooks.

## Manuel (obligatoire jusqu’à couverture auto)

1. **Inscription / session studio** — login, accès dashboard.
2. **Slug vitrine** — création / modification, lien `/studio/:slug` et `/book/:slug`.
3. **Demande vitrine** — envoi formulaire `/book`, apparition **Demandes**.
4. **Confirmation demande** — passage booking → RDV agenda + email (et SMS si opt-in + Twilio).
5. **Acompte Stripe** — création lien → paiement test → `deposit_paid` cohérent sur le RDV.
6. **Webhook Stripe** — paiement reçu reflété côté studio (logs Edge + état UI).
7. **Messagerie** — envoi message thread public `bk_*` ou `pr_*`.

## Automatisé (minimal)

- **Playwright** (`npm run test:e2e`) : smoke routes publiques — `/`, `/discover`, `/login`, `/demo`, `/signup` avec `PLAYWRIGHT_BASE_URL` pointant vers `npm run preview` ou l’URL de préprod.  
  Voir `playwright.config.ts` et `tests/e2e/smoke-public.spec.ts`.

## Support & ops (liens)

- Modèles de réponses : `docs/SUPPORT-FAQ-TEMPLATES.md`
- Santé avant scaling : `docs/INKFLOW-SCALE-PLAYBOOK.md`
- Secrets & Edge Functions : `docs/CONFIGURATION.md`

## À ajouter (priorité P1)

- Test API ou E2E auth sur **checkout session** + **simulate webhook** (Stripe CLI) en CI optionnel.
- Scénario **« premier RDV »** + **« premier acompte »** aligné `docs/NORTH-STAR-FUNNEL.md`.
