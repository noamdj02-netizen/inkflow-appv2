# FIXES-LANDING — IMPORTANT — 2026-08-07

> Passe **copy / liens uniquement** — corrections IMPORTANT de l’audit landing.  
> Référence : `AUDIT-LANDING-2026-08-07.md` §6.

---

## 1. Lien mailto footer (preventDefault)

|             |                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------- |
| **Fichier** | `components/landing/EnhanceAIFooter.tsx`                                                          |
| **Avant**   | `<form onSubmit={(e) => e.preventDefault()}>` — aucune action mail ; pas de lien mailto           |
| **Après**   | `<div>` (plus de `preventDefault`) + lien explicite `mailto:contact@ink-flow.me` sous le bloc CTA |

**Comportement :**

- Lien **Contact : contact@ink-flow.me** ouvre le client mail par défaut.
- Si l’utilisateur a saisi un email dans le champ, le corps du message est pré-rempli (`Mon email : …`).
- Objet : `Demande accès InkFlow`.
- CTA **Créer mon espace Inkflow** → `/signup` inchangé.

---

## 2. Ancre nav `#avis`

|             |                                                                      |
| ----------- | -------------------------------------------------------------------- |
| **Fichier** | `components/landing/EnhanceAINavbar.tsx`                             |
| **Avant**   | `https://ink-flow.me/#avis` (domaine Framer, ancre absente côté app) |
| **Après**   | `/#avis`                                                             |

|             |                                                                           |
| ----------- | ------------------------------------------------------------------------- |
| **Fichier** | `components/landing/TestimonialsSection.tsx`                              |
| **Constat** | `id="avis"` déjà présent (embed Testimonial.to) — **aucune modification** |

---

## 3. Lien nav « Tarifs »

|             |                                                        |
| ----------- | ------------------------------------------------------ |
| **Fichier** | `components/landing/EnhanceAINavbar.tsx`               |
| **Avant**   | `LANDING_PRICING_URL` → `https://ink-flow.me/#pricing` |
| **Après**   | `/#pricing`                                            |

|             |                                                            |
| ----------- | ---------------------------------------------------------- |
| **Fichier** | `components/landing/EnhanceAIFooter.tsx` (colonne Product) |
| **Avant**   | `https://ink-flow.me/#pricing`                             |
| **Après**   | `/#pricing`                                                |

**Note :** `LANDING_PRICING_URL` dans `lib/urls.ts` reste pointé vers Framer pour les autres surfaces (dashboard, etc.) — seule la landing SPA app est corrigée.

---

## 4. Tutoiement uniforme (FR)

| Zone                                      | Avant (extrait)                                 | Après (extrait)                              |
| ----------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| **CRM features §2**                       | « Centralisez… Suivez… fidélisez vos clients »  | « Centralise… Suis… fidélise tes clients »   |
| **Paiements §3**                          | « Envoyez… encaissez… réduisez »                | « Envoie… encaisse… réduis »                 |
| **Vitrine §4**                            | « vendre vos designs… Publiez votre portfolio » | « vendre tes designs… Publie ton portfolio » |
| **Process §1–4**                          | « Créez votre compte… Vous êtes notifié »       | « Crée ton compte… Tu es notifié »           |
| **FAQ a2**                                | « Vos clients… votre compte Stripe »            | « Tes clients… ton compte Stripe »           |
| **FAQ a3**                                | « Pro élève vos plafonds »                      | « Pro élève tes plafonds »                   |
| **FAQ a4**                                | « Vous contrôlez… votre dashboard »             | « Tu contrôles… ton dashboard »              |
| **FAQ a5**                                | « Publiez vos flashs »                          | « Publie tes flashs »                        |
| **Schema SEO FAQ** (`components/SEO.tsx`) | Même registre « vous »                          | Aligné sur le tutoiement FAQ                 |

**Fichiers modifiés :** `contexts/LanguageContext.tsx`, `components/SEO.tsx`

---

## Fichiers touchés (récap)

- `components/landing/EnhanceAIFooter.tsx`
- `components/landing/EnhanceAINavbar.tsx`
- `contexts/LanguageContext.tsx`
- `components/SEO.tsx`

## Non traité (passe MINEUR)

- Clés i18n mortes (`hero.social`, `testimonials.badge`)
- Charte visuelle footer blue-900 / emerald vs ocre
- Logo navbar → `ink-flow.me` (Framer) en `target="_blank"`

---

_Généré le 2026-08-07._
