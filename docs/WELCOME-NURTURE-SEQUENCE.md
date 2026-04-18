# Séquence e-mail — Accueil studio InkFlow (tatoueurs, France)

**Type :** Welcome / onboarding (post-inscription, essai 14 jours)  
**Public :** Propriétaire de compte studio (tatoueur), interface en français  
**Objectif principal :** Activation (vitrine + créneaux + 1er RDV ou test Stripe) et conversion fin d’essai sans harceler.

---

## Synthèse

| Champ | Valeur |
|--------|--------|
| **Déclencheur** | Compte confirmé + studio créé, statut d’essai (`trialing`) ou équivalent |
| **Durée** | 7 e-mails sur **14 jours** (aligné sur la durée d’essai) |
| **Sortie de séquence** | Désinscription lien marketing ; compte **abonnement actif** (skip relances « choisir un plan ») ; compte **restreint** post-essai (stop ou bascule séquence « win-back » séparée) |
| **Coordination in-app** | La checklist et le bandeau essai dans le dashboard **complètent** les mails : pas de répétition mot pour mot — chaque mail = **un angle** (quick win, paiement, preuve, urgence légère). |

---

## Métriques à suivre

| Métrique | Cible indicative |
|----------|------------------|
| Taux d’ouverture (par envoi) | Baseline puis +10 % après A/B sujets |
| Clic « Tableau de bord » / CTA principal | > 3 % sur segment froid |
| Activation : vitrine publiée + ≥1 créneau ou 1 RDV (événement produit) | À corréler avec Resend + analytics |
| Conversion essai → payant | KPI business |

---

## E-mail 1 — Bienvenue (J0, immédiat)

**Rôle :** Confirmer la valeur, premier clic vers le dashboard.  
**Implémentation actuelle :** Edge Function `send-tattooer-welcome` (idempotent via `user_metadata.inkflow_welcome_email_sent`). Appel depuis le flux post-auth (`sendTattooerWelcomeEmailIfNeeded`).  
**À faire :** Aligner le **sujet** et le **corps** ci-dessous avec le HTML dans `supabase/functions/send-tattooer-welcome/index.ts`.

**Objet :** `Ton espace InkFlow est prêt`  
**Préheader :** Ouvre le tableau de bord — vitrine, agenda et demandes au même endroit.

**Corps (texte brut / référence HTML) :**

> {{prenom}}, bienvenue sur InkFlow.
>
> Ton compte studio est actif. En quelques minutes tu peux : publier ton **lien vitrine**, poser tes **créneaux** et recevoir des **demandes** sans tout gérer sur Insta.
>
> **CTA :** [Ouvrir le tableau de bord]({{APP_URL}}/dashboard)  
> **Secondaire :** [Aide rapide]({{LANDING_URL}}/aide) (si URL dispo)
>
> Une question ? `contact@ink-flow.me`
>
> — L’équipe InkFlow

---

## E-mail 2 — Premier « quick win » (J+1)

**Rôle :** Une action concrète, court délai.

**Objet :** `3 minutes pour ton lien vitrine`  
**Préheader :** C’est l’URL que tu partages aux clients — vérifie qu’elle te plaît.

**Corps :**

> Salut {{prenom}},
>
> Le plus rapide pour voir InkFlow utile : définir **l’URL de ta page vitrine** (celle que tu envoies en bio ou en MP). Tu la changes quand tu veux dans **Paramètres → Vitrine**.
>
> Ensuite, ajoute **un flash** ou un visuel : ça rend la page crédible du premier coup.
>
> **CTA :** [Paramètres vitrine]({{APP_URL}}/dashboard) *(adapter le deep link si vous avez un hash/query pour ouvrir l’onglet vitrine)*  
> **Micro-preuve :** Des studios passent moins de temps sur les relances une fois la vitrine à jour.

---

## E-mail 3 — Paiements / acomptes (J+3)

**Rôle :** Lever la peur « technique » Stripe, rester court.

**Objet :** `Acomptes en ligne sans prise de tête`  
**Préheader :** Stripe + euros — tu gardes le contrôle sur ce que tu encaisses.

**Corps :**

> {{prenom}},
>
> Si tu veux sécuriser les créneaux, les **acomptes** aident. InkFlow s’appuie sur **Stripe** : tes clients paient en ligne, tu vois l’état dans le dashboard.
>
> Tu n’es pas obligé de tout activer le premier jour : ouvre **Paramètres → Paiements** quand tu es prêt, on guide les étapes.
>
> **CTA :** [Configurer les paiements]({{APP_URL}}/dashboard)

---

## E-mail 4 — Preuve / communauté (J+5)

**Rôle :** Réassurance sans stats inventées — ajuster avec un vrai témoignage ou chiffre interne quand dispo.

**Objet :** `Moins de MP, plus de créneaux remplis`  
**Préheader :** Ce que des tatoueurs utilisent au quotidien sur InkFlow.

**Corps :**

> Salut {{prenom}},
>
> InkFlow sert surtout à **centraliser** : demandes, agenda, messages et fiches clients. Moins de dispersion entre les apps, plus de visibilité sur ce qui est confirmé ou en attente.
>
> *(Option : insérer ici une phrase **réelle** du type « Studio X à [ville] utilise la réservation en ligne depuis… » si vous avez l’accord.)*
>
> **CTA :** [Voir mon agenda]({{APP_URL}}/dashboard)

---

## E-mail 5 — Objection « pas le temps » (J+8)

**Rôle :** Réduire la friction perçue.

**Objet :** `Pas besoin de tout configurer d’un coup`  
**Préheader :** Commence par la vitrine ou l’agenda — le reste peut attendre.

**Corps :**

> {{prenom}},
>
> Petit rappel utile : tu peux **avancer par étapes**. Beaucoup commencent par la **vitrine + créneaux**, puis les acomptes quand le flux de demandes grossit.
>
> L’essai te laisse le temps d’explorer — si un point bloque, réponds à ce mail ou écris-nous à `contact@ink-flow.me`.
>
> **CTA :** [Continuer dans le dashboard]({{APP_URL}}/dashboard)

---

## E-mail 6 — Fin d’essai bientôt (J+12, si toujours `trialing`)

**Rôle :** Rappel sans panique, lien tarifs.

**Objet :** `Ton essai InkFlow se termine dans 2 jours`  
**Préheader :** Choisis un plan quand tu veux — tes données restent en place.

**Corps :**

> {{prenom}},
>
> Ton **essai gratuit** touche à sa fin dans **2 jours**. Pour continuer sans interruption : choisis la formule qui colle à ton activité (solo, équipe, etc.).
>
> **Voir les tarifs :** [ink-flow.me → Tarifs](https://ink-flow.me/#pricing)  
> **Facturation / plan depuis l’app :** [Paramètres → Facturation]({{APP_URL}}/dashboard)
>
> Merci d’avoir testé InkFlow — on est dispo si tu as une question.

---

## E-mail 7 — Dernier jour d’essai (J+14, si toujours `trialing`)

**Rôle :** Dernière ligne droite, ton clair, pas agressif.

**Objet :** `Dernier jour d’essai — on reste en contact`  
**Préheader :** Passe sur un plan aujourd’hui pour garder l’accès complet.

**Corps :**

> {{prenom}},
>
> C’est le **dernier jour** de ton essai gratuit. Pour garder l’accès à l’agenda, à la vitrine et aux paiements comme aujourd’hui, **souscris à une formule** depuis la facturation ou la page tarifs.
>
> **CTA principal :** [Choisir une formule](https://ink-flow.me/#pricing)  
> **CTA secondaire :** [Ouvrir la facturation]({{APP_URL}}/dashboard)
>
> À très vite,  
> L’équipe InkFlow

---

## Implémentation technique (prochaine étape)

| Étape | Action |
|-------|--------|
| 1 | Mettre à jour le **copy** de `send-tattooer-welcome` pour coller à l’**e-mail 1** (sujet + corps). |
| 2 | Créer une table `inkflow_marketing_email_log` (studio_id, template_key, sent_at) ou équivalent + **pg_cron** / Edge Function planifiée pour J+1, J+3… **ou** brancher un outil (Customer.io, Resend Broadcasts + segments) si vous préférez no-code. |
| 3 | **Segments :** n’envoyer mails 6–7 que si `subscription_status = trialing` et `trial_ends_at` dans la fenêtre. |
| 4 | Lien **désinscription** en footer (obligatoire pour mails marketing FR) — page simple `/preferences-email` ou liste Resend. |

---

## Rappel conformité

- E-mails **transactionnels** (confirmation de résa, reçu paiement) ≠ **marketing** (cette séquence). Pour le marketing, prévoir **consentement** (case à l’inscription ou paramètre compte) et **désinscription** claire.

---

*Document généré pour alignement produit / copy — à faire valider juridiquement et métier avant envoi massif.*
