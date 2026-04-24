# Délivrabilité Resend — `ink-flow.me` (P1.4)

Sans **SPF + DKIM + DMARC** corrects sur le domaine d’envoi, les confirmations de RDV passent en spam. La configuration se fait côté **DNS** (fournisseur de domaine) + **Resend** (domaine vérifié, enregistrements à copier).

## 1. Resend

1. [Dashboard Resend](https://resend.com) → **Domains** → Add `ink-flow.me`.
2. Resend affiche les enregistrements **SPF** (souvent fusionné en un seul enregistrement avec leur mail serveur) et **DKIM** (souvent 2 à 3 CNAME, ex. `resend._domainkey`).
3. Ajoute-les **exactement** comme indiqué (host / valeur / type).
4. Attends la propagation (quelques minutes à 48 h selon TTL).
5. Vérifie le domaine (bouton **Verify**). Tant que ce n’est pas **Verified**, n’utilise pas d’adresse d’envoi sur ce domaine en prod.

**Expéditeur recommandé** (déjà le défaut côté code) : `contact@ink-flow.me` / `InkFlow <contact@ink-flow.me>`.  
**Réponse** : secret Supabase `RESEND_REPLY_TO=contact@ink-flow.me` (réception dans la boîte du même nom si la boîte / alias existe).

## 2. DMARC (obligatoire pour une bonne note chez Google)

Ajoute un enregistrement **TXT** sur `ink-flow.me` (ou `_dmarc.ink-flow.me` selon l’hôte attendu par ton DNS) :

| Exemple d’hôte | Type | Valeur (exemple)                                 |
| -------------- | ---- | ------------------------------------------------ |
| `_dmarc`       | TXT  | `v=DMARC1; p=none; rua=mailto:dmarc@ink-flow.me` |

- Commencer par `p=none` pour **collecter** les rapports sans bloquer, puis resserrer (`quarantine` / `reject`) quand SPF+DKIM sont stables.
- `rua` = adresse qui reçoit les rapports XML agrégés (inbox à surveiller).

## 3. Test objectif 10/10 (Mail-Tester, Gmail)

1. Après vérification du domaine, envoyer un vrai mail depuis l’app ou :
   `node --env-file=.env.local scripts/send-resend-test.mjs noamdj02@gmail.com`
2. Ouvrir le [Mail-Tester](https://www.mail-tester.com), copier l’adresse jetable indiquée, envoyer le test vers cette adresse, puis noter.
3. Vérifier dans **Gmail** → menu du message → **Afficher l’original** : SPF/DKIM/DMARC doivent indiquer **pass** (ou équivalent).
4. [Google Postmaster Tools](https://postmaster.google.com) : ajouter le domaine `ink-flow.me` pour suivre la réputation auprès de Gmail sur la durée.

## 4. Préheader & texte brut

- **Préheader** : pour les e-mails générés par `wrapEmailLayout`, utiliser l’option `preheader` (texte 40–100 car. pour l’aperçu dans la liste de mails). Les templates **React Email** (`emails/`) utilisent le composant `<Preview>`.
- **Texte brut** : passer `text: ...` à `sendEmail` quand c’est généré ; sinon `htmlToPlainTextFallback` sur le HTML côté Edge (approximatif). Pour un rendu propre, générer le texte côté build avec `@react-email/render` (Node) si tu compiles le template.

## 5. Désinscription (non transactionnel) & bounces

- E-mails de **fidélisation** (J+1, J+7, J+30) et **parrainage** : en-têtes `List-Unsubscribe` + one-click (voir `marketingUnsubscribe.ts` + fonction `email-marketing-unsubscribe`). Secret : `EMAIL_UNSUBSCRIBE_SECRET` (génère un HMAC aléatoire 32+ octets en hex/base64).
- **Webhook** `resend-webhook` : `RESEND_WEBHOOK_SECRET` = signing secret Resend, événements `email.bounced` et `email.complained` → table `email_suppressions`.

Déploiement :

```bash
npx supabase secrets set RESEND_WEBHOOK_SECRET=whsec_xxx
npx supabase secrets set EMAIL_UNSUBSCRIBE_SECRET=long_random_value
npx supabase functions deploy resend-webhook --no-verify-jwt
npx supabase functions deploy email-marketing-unsubscribe --no-verify-jwt
```

Dans le dashboard Resend, créer le webhook : URL =  
`https://<PROJECT>.supabase.co/functions/v1/resend-webhook`, cocher bounces + complaints, coller le secret de signature.

## 6. Ce que le code ne peut pas faire

- Créer les enregistrements DNS à ta place (hébergeur du domaine).
- Garantir 10/10 sur Mail-Tester si le contenu ressemble à du spam, si l’IP de sortie est grillée, ou si le domaine vient d’être créé (faible “domain reputation”).

**Checklist** : [ ] Domaine **Verified** sur Resend · [ ] SPF/DKIM **pass** (Google “original message”) · [ ] DMARC enregistré · [ ] Test Mail-Tester ≥ 8/10 · [ ] Webhook bounce déployé + secret · [ ] `EMAIL_UNSUBSCRIBE_SECRET` défini
