# Support InkFlow — modèles de réponse (micro-entreprise)

À copier-coller et adapter. Ton : clair, sans jargon inutile. Réponse cible : **sous 48 h**.

---

## Facturation / Stripe

**Je ne trouve pas ma facture**

> Les factures d’abonnement InkFlow passent par Stripe. Tu peux les retrouver depuis le dashboard InkFlow → Paramètres → Abonnement → « Gérer la facturation » (portail Stripe), ou depuis l’e-mail de confirmation Stripe.

**Mon paiement a échoué**

> Vérifie que ta carte n’a pas expiré et que la banque n’a pas bloqué le prélèvement. Tu peux mettre à jour le moyen de paiement depuis le portail Stripe (lien depuis Paramètres → Abonnement). Si ça bloque encore, envoie-nous la date approximative de la tentative et le dernier message d’erreur affiché.

**Rembourser un acompte client**

> Les acomptes clients sont encaissés sur **ton** compte Stripe Connect (pas sur InkFlow). Traite le remboursement depuis le Dashboard Stripe → Paiements, ou contacte ton banquier selon ta politique studio.

---

## Lien de réservation / vitrine

**Où est mon lien `/book` ?**

> Paramètres → Vitrine / slug public : le lien est `https://app.ink-flow.me/book/ton-slug` (remplace par ton slug). Partage-le en bio Instagram ou par message.

**Le client ne voit pas les créneaux**

> Vérifie que les **disponibilités** sont renseignées (Paramètres → Disponibilités) et que le jour visé n’est pas fermé. Rafraîchis la page book en navigation privée pour exclure le cache.

---

## Agenda / synchronisation

**Google Calendar ne se met pas à jour**

> Vérifie que la connexion Google est toujours active (Paramètres → calendrier). Réassocie si besoin. Les secrets et le déploiement des fonctions `google-calendar-*` sont décrits dans `docs/CONFIGURATION.md`.

---

## Données / RGPD

**Export ou suppression des données studio**

> Voir `docs/SECURITY-NARRATIVE-STRIPE-RGPD.md` et la fonction Edge `export-studio-gdpr` / procédure interne. Ne jamais envoyer de mots de passe ou clés API par e-mail.

---

## Messages / notifications

**Le client ne reçoit pas l’e-mail**

> Checklist : spam, domaine Resend vérifié, secrets `RESEND_*` côté Supabase (pas seulement en local). Détail : section Resend dans `docs/CONFIGURATION.md`.

---

## Escalade technique

Si le bug touche **paiement**, **perte de données** ou **sécurité** : documenter l’heure (UTC), l’utilisateur concerné (e-mail studio), le navigateur, et une capture — puis suivre `docs/REGRESSION-CRITICAL-PATHS.md` pour reproduire avant correction.
