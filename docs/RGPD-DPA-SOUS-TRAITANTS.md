# DPA / sous-traitance RGPD (checklist)

Responsable du traitement côté client final : le **professionnel** (studio). InkFlow, **hébergeur et éditeur** du logiciel, traite en qualité de **sous-traitant** certaines opérations sur instruction du professionnel, et de **responsable** limité en ce qui concerne l’ouverture d’un compte, la facturation de l’abonnement, le support, la sécurité de la plateforme.

Aucun secret, token ou identifiant de production ne doit figurer dans ce document.

## À faire dans chaque console (preuve d’exécution)

| Fournisseur                                         | Rôle usuel (InkFlow)                                     | Lien / action                                                                                                      | Date notée (YYYY-MM-DD) |
| --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| **Supabase** (DB, Auth, Storage, Realtime)          | Hébergement des données d’exploitation, authentification | Dashboard projet → _Settings_ / _Legal_ / _DPA_ (selon offre) — accepter le DPA / région EU (Frankfurt en général) |                         |
| **Stripe** (abonnement plateforme + Stripe Connect) | Paiement, acomptes, factures                             | [Stripe DPA & SCC](https://stripe.com/legal/dpa) — compte _plateforme_ et conditions Connect                       |                         |
| **Resend** (or équivalent)                          | Envoi d’e-mails transactionnels                          | [Resend legal / DPA](https://resend.com/legal)                                                                     |                         |
| **Twilio** (si routage SMS / WhatsApp)              | Messages sortants côté intégrations                      | [Twilio Data Protection / DPA](https://www.twilio.com/en-us/legal)                                                 |                         |
| **Vercel** (hébergement front / Edge)               | Fichiers statiques, @vercel/analytics si activé          | [Vercel DPA / Privacy](https://vercel.com/legal)                                                                   |                         |
| **Google** (optionnel : Calendrier, Avis)           | Synchronisation agenda / fiches                          | Google Cloud / API — conditions et SCC selon compte                                                                |                         |
| **Sentry** (optionnel)                              | Journalisation d’erreurs côté Edge                       | [Sentry DPA](https://sentry.io/legal/)                                                                             |                         |

## Bonnes pratiques

- Conserver en interne (Notion, registre) la **date d’acceptation** des mises à jour DPA.
- Lister les **transferts hors UE** (Stripe USA, Vercel USA, etc.) et le mécanisme (SCC, _adequacy_).
- En cas d’**audit** ou d’**incident** : identifier le traitement, le sous-traitant, la durée, les catégories de données — voir [CNIL](https://www.cnil.fr).

## Révision

Revues au moins **annuelles** ou lors d’un **nouvel outil** (Zapier, n8n, notaire numérique, etc.) en production.
