# Inkflow — Roadmap MVP au 29 Mars
**10 jours. Pixel Perfect. Prêt à vendre.**

---

## État des lieux (19 Mars)

| Module | État | Dette |
|---|---|---|
| Landing page (Framer) | ✅ En ligne | Overflow H, dark inconsistant, mobile nav cassée |
| App (app.ink-flow.me) | 🟡 Partiel | Architecture inconnue, à auditer |
| CRM client | 🟡 Listed Pricing | Formulaire 3-champs manquant |
| Agenda/Réservation | 🟡 Mentionné | UX Planity-like à éviter |
| Page Vitrine tatoueur | 🔴 Absent | À créer |
| Fidélité post-tatouage | 🔴 Absent | Séquence email/SMS auto |

---

## PHASE 1 — FONDATIONS MOBILE (19-21 Mars) · 3 jours

### Jeudi 19 Mars
**Objectif : Éradiquer les bugs qui trahissent le site web**

- [ ] **Fix overflow horizontal** — Injecter dans Framer Custom Code :
  ```css
  html, body { overflow-x: hidden; max-width: 100vw; }
  * { box-sizing: border-box; }
  ```
- [ ] **Unifier la palette** — Toutes les sections en dark (#0d0d0d), supprimer les fonds blancs
- [ ] **Remplacer les images stock** — La photo "Pro plan" avec fonds géométriques orange/vert/rouge est hors DA. Utiliser des photos monochromes tattoo authentiques (Unsplash : "tattoo studio dark")
- [ ] **Tester PWA Install** — Vérifier que `manifest.json` + service worker sont actifs sur `app.ink-flow.me`

**Livrable soir :** Landing page 100% sombre, zéro overflow, install PWA fonctionnelle

---

### Vendredi 20 Mars
**Objectif : Intégrer la Bottom Nav dans l'app**

- [ ] Intégrer `BottomNavBar` dans l'app (composant livré dans `inkflow-components.jsx`)
- [ ] Configurer les 5 routes : `/agenda`, `/clients`, `/vitrine`, `/settings` + drawer Add
- [ ] Ajouter `safe-area-inset-bottom` (indispensable iPhone notch)
- [ ] Supprimer ou réduire la top nav à un simple logo + avatar profil sur mobile
- [ ] Activer `overscroll-behavior: none` sur le body pour stopper le bounce iOS involontaire

**Livrable soir :** L'app se comporte comme une app native au premier scroll

---

### Samedi 21 Mars
**Objectif : CRM Zéro Friction opérationnel**

- [ ] Intégrer `QuickAddClient` + `BottomDrawer` dans le flux "+" de la nav
- [ ] Schéma BDD minimal :
  ```sql
  CREATE TABLE clients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tatoueur_id UUID NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    instagram   TEXT,
    project     TEXT,
    status      TEXT DEFAULT 'pending', -- pending | confirmed | completed | cancelled
    deposit     DECIMAL(10,2),
    body_zones  TEXT[],
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] API endpoint `POST /api/clients` + `GET /api/clients`
- [ ] Tester le flow complet : Bottom Nav → "+" → Drawer → 3 champs → Submit → Apparaît dans la liste

**Livrable soir :** Un tatoueur crée un client en 20 secondes

---

## PHASE 2 — AGENDA & RÉSERVATION (22-24 Mars) · 3 jours

### Dimanche 22 Mars
**Objectif : Architecture agenda — pas de Planity**

Anti-patterns Planity à éviter :
- ❌ Vue calendrier mensuel par défaut (trop dense sur mobile)
- ❌ Formulaires en modal centré (perd la navigation)
- ❌ Couleurs vives par catégorie (visuellement agressif)

Architecture Inkflow :
- ✅ **Vue du jour par défaut** — scroll vertical, créneaux de 30min
- ✅ **Swipe gauche/droite** pour changer de jour
- ✅ **Créneau vide = zone tapable** → ouvre `BottomDrawer` pour créer un RDV
- ✅ **Créneau occupé** = affiche client + statut acompte

- [ ] Intégrer `BookingSlot` dans la vue agenda (composant livré)
- [ ] Implémentation swipe horizontal (useSwipe hook ou Framer Motion drag)
- [ ] Schéma BDD :
  ```sql
  CREATE TABLE appointments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tatoueur_id UUID NOT NULL REFERENCES users(id),
    client_id   UUID REFERENCES clients(id),
    start_at    TIMESTAMPTZ NOT NULL,
    end_at      TIMESTAMPTZ NOT NULL,
    project     TEXT,
    deposit     DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    status      TEXT DEFAULT 'confirmed',
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
  ```

**Livrable soir :** Vue agenda du jour fonctionnelle, swipe entre les jours

---

### Lundi 23 Mars
**Objectif : Lien de réservation client (alternative Planity)**

- [ ] Générer un lien public unique par tatoueur : `ink-flow.me/book/[slug]`
- [ ] Page de réservation publique — affiche les créneaux disponibles
- [ ] Client sélectionne un créneau → formulaire nom + projet + email + paiement acompte (Stripe)
- [ ] Confirmation automatique par email (template sobre, dark)

**Livrable soir :** Un tatoueur envoie `ink-flow.me/book/marc-tattoo` à son client → réservation + acompte en 2 minutes

---

### Mardi 24 Mars
**Objectif : Rappels automatiques (contre le no-show)**

- [ ] Webhook Stripe → confirme paiement acompte → déclenche rappels
- [ ] Séquence rappels :
  - J-3 : Email "Ton RDV approche" + récapitulatif
  - J-1 : SMS "Rappel RDV demain à [heure] avec [tatoueur]"
  - J+1 : Email post-tatouage (fidélité — voir Phase 3)
- [ ] Dashboard tatoueur : toggle on/off pour chaque rappel

**Librable soir :** Zéro no-show grâce aux rappels

---

## PHASE 3 — PAGE VITRINE + FIDÉLITÉ (25-27 Mars) · 3 jours

### Mercredi 25 Mars
**Objectif : Générateur Page Vitrine — 3 thèmes**

Thème 1 — **Dark Gallery** (défaut Inkflow)
- Fond `#0d0d0d`, grille masonry noire, police serif
- Accent ocre sur les stats

Thème 2 — **Minimalist White**
- Fond `#fafaf8`, texte `#1a1a1a`, galerie épurée
- Convient aux tatoueurs fine line / aquarelle

Thème 3 — **Industrial**
- Fond `#141414`, texture grain, Grotesk bold
- Convient au noir & gris, old school

- [ ] Composant `VitrineEditor` — sélecteur de thème en 1 clic
- [ ] Upload photos galerie (max 12 pour MVP)
- [ ] Génération URL publique : `ink-flow.me/p/[slug]`
- [ ] SEO minimal : titre, description, og:image

**Livrable soir :** Un tatoueur a sa page pro en 5 minutes

---

### Jeudi 26 Mars
**Objectif : Suivi post-tatouage automatique (Rétention)**

- [ ] Email J+1 : "Comment se passe la cicatrisation ?" + lien pour noter l'expérience (1-5 étoiles)
- [ ] Email J+7 : "Ta cicatrisation avance bien ? Partage ta retouche"
- [ ] Email J+30 : "Prêt pour le prochain projet ? Réserve en avant-première"
- [ ] Dashboard : taux de retour client par tatoueur

Schéma :
```sql
CREATE TABLE followups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  type          TEXT, -- 'j1' | 'j7' | 'j30'
  sent_at       TIMESTAMPTZ,
  opened        BOOLEAN DEFAULT FALSE,
  rating        INTEGER -- 1-5
);
```

**Livrable soir :** Séquence fidélité active pour tous les nouveaux RDV

---

### Vendredi 27 Mars
**Objectif : Polish UX + tests sur vrais appareils**

- [ ] Test complet sur iPhone SE (écran 4.7") — le plus contraignant
- [ ] Test sur Android Chrome (Samsung Galaxy)
- [ ] Vérification `safe-area-inset` sur tous les devices
- [ ] Lighthouse PWA score > 90
- [ ] Fix tous les bugs tactiles (tap delay, zone de touch trop petite < 44px)
- [ ] Vérification accessibilité : contrastes texte/fond (WCAG AA minimum)

---

## PHASE 4 — LANCEMENT (28-29 Mars) · 2 jours

### Samedi 28 Mars — Répétition générale
- [ ] Test end-to-end avec 2-3 vrais tatoueurs (beta testers)
- [ ] Collecter les frictions → fix rapides uniquement
- [ ] Préparer le post de lancement Instagram (vidéo screen recording mobile)
- [ ] Vérifier les webhooks Stripe en production
- [ ] Mettre en place Sentry ou LogRocket (monitoring erreurs)
- [ ] Uptime monitoring (BetterUptime ou UptimeRobot)

### Dimanche 29 Mars — LANCEMENT 🚀
- [ ] Activer le plan Parrainage (referral)
- [ ] Post Instagram + stories
- [ ] DM manuel aux 20 premiers tatoueurs ciblés
- [ ] Monitoring actif toute la journée
- [ ] Répondre aux signalements dans les 30 minutes

---

## Métriques de Succès MVP

| KPI | Objectif J+7 |
|---|---|
| Tatoueurs inscrits | 30+ |
| RDV créés | 50+ |
| Acomptes Stripe encaissés | 10+ |
| Page Vitrine générées | 20+ |
| NPS (feedback DM) | > 7/10 |

---

## Stack Recommandée pour `app.ink-flow.me`

```
Frontend  : Next.js 14 (App Router) + Tailwind CSS
Backend   : Next.js API Routes ou Supabase Edge Functions
BDD       : Supabase (PostgreSQL) — schémas livrés ci-dessus
Auth      : Supabase Auth (magic link → pas de mot de passe)
Paiements : Stripe Checkout + Webhooks
Emails    : Resend (API simple, templates React)
SMS       : Twilio ou Vonage
Hosting   : Vercel (frontend) + Supabase (BDD)
PWA       : next-pwa (service worker + manifest)
```

---

## Décisions Critiques à Prendre Maintenant

1. **Framer vs Next.js pour la landing** — Framer est bien pour le marketing mais bloque les customisations PWA avancées. Au-delà du 29 mars, migrer vers Next.js.

2. **Magic Link auth** — Les tatoueurs n'ont pas envie de retenir un mot de passe. Magic link email = friction zéro.

3. **Acompte obligatoire** — Ne pas en faire une option. Rendre l'acompte Stripe **obligatoire** à la réservation. C'est le principal argument contre Planity.

4. **Ne pas lancer le Studio plan (99€) le 29 mars** — Focus Basic (29€) et Pro (49€). Le Studio crée de la complexité support inutile en MVP.
