# Emails non reçus — débogage Resend

**Fonctions qui envoient des emails** (utilisent `APP_URL` pour les liens CTA, `RESEND_FROM_EMAIL` si défini) :
- **send-tattooer-welcome** : email de bienvenue tatoueur après confirmation (appel depuis `AuthCallbackPage`, JWT utilisateur)
- **send-client-conversation-link** : lien conversation quand le studio accepte une demande de projet
- **send-booking-confirmation** : confirmation RDV vitrine quand le tatoueur clique « Confirmer »
- **send-booking-refusal** : refus de demande (RDV, RDV vitrine, projet) quand le tatoueur clique « Refuser »
- **send-message-notification** : notification nouveau message (client ou studio)
- **send-project-notification** : notification nouvelle demande de projet → artiste (lien dashboard)
- **send-appointment-reminders** : rappels RDV (2h avant, 24h avant)
- **send-aftercare-email** : soins post-tattoo après un RDV
- **send-referral-notification** : félicitations au parrain quand un studio s'inscrit via son lien

Les liens Stripe (acompte, abo) et Google Calendar utilisent **APP_URL** ou **SITE_URL** (create-checkout-session, create-subscription, google-calendar-auth).

**ERR_CONNECTION_FAILED sur les liens d'email** : Si le bouton « Confirmer mon rendez-vous » ou les liens de conversation plantent (resend-clicks-a.com inaccessible), définis **APP_URL** dans Supabase Secrets avec l'URL absolue de ton app en prod :
```bash
npx supabase secrets set APP_URL=https://app.ink-flow.me
```
Puis redéploie : `send-booking-confirmation`, `send-client-conversation-link`, `send-message-notification`, `create-portal-session`.

**Emails Supabase Auth** (confirmation d’inscription, reset mot de passe) : ils **ne passent pas** par ces Edge Functions. Ils sont envoyés par **Auth** (SMTP dashboard ou transport par défaut). Checklist SMTP, Redirect URLs et distinction Auth / Resend API : **[SUPABASE-AUTH-SMTP.md](./SUPABASE-AUTH-SMTP.md)**.

---

**Erreur 403 « You can only send testing emails to your own email address »**  
En mode test, Resend n’envoie qu’à l’email de ton compte. Pour envoyer aux clients → il faut **vérifier un domaine** sur [resend.com/domains](https://resend.com/domains) et utiliser une adresse `@ton-domaine` pour l’envoi. Voir section 2 ci-dessous.

---

## 1. Vérifier le statut dans Supabase

**Supabase** → **Edge Functions** → **send-client-conversation-link** → **Overview** (ou **Invocations**).

Quand tu fais « Accepter & Discuter » sur une demande de projet :

- **200** : la fonction a réussi et Resend a accepté l’envoi. Si le mail n’arrive pas → voir étapes 2 et 3.
- **502** : Resend a refusé (clé invalide ou domaine). Voir les **Logs** pour le message exact.

---

## 2. Erreur 403 : « You can only send testing emails to your own email address »

Avec l’adresse de test Resend (`onboarding@resend.dev`), **tu ne peux envoyer qu’à l’adresse de ton compte Resend** (ex. noamdj02@gmail.com). Resend refuse d’envoyer à d’autres destinataires (clients) tant qu’aucun domaine n’est vérifié.

**Pour envoyer aux clients**, il faut obligatoirement **vérifier un domaine** :

1. Va sur **[resend.com/domains](https://resend.com/domains)**.
2. **Add Domain** → saisis ton domaine (ex. `ink-flow.me` ou un sous-domaine que tu contrôles).
3. Ajoute les enregistrements DNS (SPF, DKIM, etc.) indiqués par Resend chez ton hébergeur DNS (OVH, Cloudflare, etc.).
4. Attends que le statut soit **Verified**.
5. Définis l’adresse d’envoi avec ce domaine, par exemple :
   ```bash
   npx supabase secrets set RESEND_FROM_EMAIL="InkFlow <contact@ink-flow.me>"
   ```
   (en utilisant une adresse **@ton-domaine-vérifié**).
6. Redéploie la fonction :
   ```bash
   npx supabase functions deploy send-client-conversation-link --no-verify-jwt
   npx supabase functions deploy send-booking-confirmation --no-verify-jwt
   npx supabase functions deploy send-booking-refusal --no-verify-jwt
   npx supabase functions deploy send-message-notification --no-verify-jwt
   npx supabase functions deploy send-project-notification --no-verify-jwt
   npx supabase functions deploy send-appointment-reminders --no-verify-jwt
   npx supabase functions deploy send-aftercare-email --no-verify-jwt
   ```

Après ça, les mails pourront partir vers n’importe quelle adresse (clients).

**Test rapide sans domaine** : pour vérifier que tout fonctionne, tu peux mettre **ton** adresse Resend (noamdj02@gmail.com) comme email « client » dans une demande de projet : en mode test, Resend acceptera cet envoi.

---

## 3. Vérifier côté Resend

1. Va sur **[resend.com](https://resend.com)** → **Emails** (ou **Logs**).
2. Refais un envoi depuis le dashboard (Accepter & Discuter).
3. Regarde si une ligne apparaît : **Delivered**, **Bounced**, **Complained**, etc.

- Si **Delivered** mais rien dans la boîte → vérifier **spam** et **règles de boîte**.
- Si **Bounced** ou erreur → adresse destinataire ou domaine expéditeur (voir étape 2).
- Si rien n’apparaît → la requête n’atteint pas Resend (vérifier Supabase → Logs pour erreur 502 et le message Resend).

---

## 4. En production : domaine vérifié

Pour envoyer depuis `contact@ink-flow.me` et que les mails arrivent bien :

1. **Resend** → **Domains** → **Add Domain** → `ink-flow.me`.
2. Ajoute les enregistrements DNS (SPF, DKIM, etc.) indiqués par Resend chez ton hébergeur DNS.
3. Attends que le statut soit **Verified**.
4. Tu peux alors enlever le secret `RESEND_FROM_EMAIL` (ou le remettre à `InkFlow <contact@ink-flow.me>`) et redéployer.

---

## 5. Logo comme photo de profil à côté de « InkFlow » (Gmail, etc.)

L’icône à côté du nom d’expéditeur (InkFlow) dans Gmail et d’autres clients vient de **Gravatar** : l’image est liée à l’**adresse d’envoi** (celle utilisée dans `RESEND_FROM_EMAIL`, ou par défaut `contact@ink-flow.me`).

**Pour afficher ton logo « IF. » à la place de la silhouette grise :**

1. Va sur **[gravatar.com](https://gravatar.com)** et crée un compte (ou connecte-toi) avec **exactement** l’adresse utilisée pour envoyer les mails :
   - En production : **contact@ink-flow.me** (ou l’email que tu mets dans `RESEND_FROM_EMAIL`).
   - En test avec `onboarding@resend.dev`, Gravatar ne s’applique pas (c’est l’adresse Resend).
2. Dans Gravatar : **My Gravatars** → **Add a new image** → uploade ton logo **IF.** (carré ou recadré, idéalement 200×200 px ou plus).
3. Associe cette image à l’adresse **contact@ink-flow.me** (ou ton adresse d’envoi).
4. Gmail et les autres clients qui utilisent Gravatar mettront à jour l’avatar après un court délai (parfois quelques minutes, parfois un peu plus).

**Conseil :** Utilise une version carrée de ton logo (fond noir + « IF. ») pour un rendu propre dans le petit cercle.

**Si la photo ne s’affiche toujours pas :**

1. **Vérifier que Gravatar est bien configuré**  
   Ouvre ce lien dans ton navigateur (c’est l’URL que Gmail utilise pour `contact@ink-flow.me`) :  
   **https://www.gravatar.com/avatar/a2367034eedfb5b2bd9b2f016156e0d0**  
   - Si tu vois **ton logo** → Gravatar est OK, c’est le **cache Gmail** : ça peut prendre quelques heures (parfois 24 h). Ouvre un mail InkFlow en navigation privée ou sur un autre appareil pour tester.
   - Si tu vois une **icône par défaut** (silhouette ou « G ») → l’image n’est pas associée à cette adresse. Sur [gravatar.com](https://gravatar.com), vérifie que tu as bien ajouté **contact@ink-flow.me** (sans faute, en minuscules) et que ton logo est bien attaché à cette adresse dans « My Gravatars ».

2. **Compte Gravatar**  
   Le compte Gravatar doit contenir **cette adresse** : soit tu crées le compte avec `contact@ink-flow.me`, soit tu l’ajoutes dans « Manage my emails » et tu assignes l’image à cette adresse.

---

## Récap

| Problème | Action |
|---------|--------|
| Invocations **502** | Voir Logs → message Resend. Clé API ou domaine. |
| Invocations **200** mais aucun mail | Resend → Emails ; spam ; ou utiliser `onboarding@resend.dev` + redéploiement. |
| Domaine pas vérifié | Soit `RESEND_FROM_EMAIL=InkFlow <onboarding@resend.dev>`, soit vérifier le domaine dans Resend. |
