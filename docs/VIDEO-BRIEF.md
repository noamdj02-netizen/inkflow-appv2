# Brief Production Vidéo — InkFlow

**Produit :** InkFlow — SaaS premium de gestion pour artistes tatoueurs  
**Durée cible :** 30 secondes  
**Format :** 16:9 (1920×1080 recommandé)

---

## Contexte général

**Style visuel :** Moderne, épuré, très fluide (présentation Apple / Stripe). Interface UI/UX mise en valeur avec effets **Glassmorphism** et ombres douces.

**Rythme (Pacing) :** Rapide et captivant. Chaque scène ≈ **4,5 secondes** (aligné sur la boucle du simulateur web).

**Musique & Sound Design :**
- Beat lofi/électro moderne et rythmé
- Bruitages UI : clics souris subtils, "whoosh" transitions, son tiroir-caisse / notification douce (scène paiements)

---

## ⏱️ Timecode & Déroulé des scènes

### [00:00 - 0:04] SCÈNE 0 : Le Hook (Hero Section)

| Élément | Description |
|--------|-------------|
| **Visuel** | Écran noir → logo InkFlow animé + barre de chargement. Caméra zoom à l'intérieur de l'écran MacBook/iPad. |
| **Texte** | "Découvrez InkFlow en action" puis badge "✨ Démo interactive" |
| **Action** | Curseur clique sur "Voir la démo" dans la navbar. Transition rapide (zoom in). |

---

### [00:04 - 0:08] SCÈNE 1 : La Vue d'ensemble (Dashboard)

| Élément | Description |
|--------|-------------|
| **Visuel** | Dashboard en pleine gloire. Léger panoramique gauche → droite. |
| **Action** | Glow sur carte "Projets en cours" et agenda. Barre de progression se remplit. |
| **Voix off** | *"Votre studio, piloté depuis un seul écran."* |

---

### [00:08 - 0:13] SCÈNE 2 : L'Argent (Revenus)

| Élément | Description |
|--------|-------------|
| **Visuel** | Transition latérale. Onglet Revenus. |
| **Action** | Compteur animé 0 → somme du mois. Graphiques en courbes se dessinent (Revenus mois, Aujourd'hui, Semaine). |
| **Voix off** | *"Suivez vos revenus en temps réel."* |

---

### [00:13 - 0:17] SCÈNE 3 : Les Clients (CRM)

| Élément | Description |
|--------|-------------|
| **Visuel** | Transition glissement vers le bas. Liste clients. |
| **Action** | Focus badges statuts ("En attente", "Acompte payé", "Tatoué"). Curseur survole et modifie un statut → animation validation (coche verte). |
| **Voix off** | *"Ne perdez plus jamais le fil d'un projet."* |

---

### [00:17 - 0:22] SCÈNE 4 : La Sécurité (Paiements Stripe)

| Élément | Description |
|--------|-------------|
| **Visuel** | Transition balayage. Historique acomptes Stripe. |
| **Action** | Pop-up / notification : "Nouveau paiement d'acompte reçu : 50€". Bruitage notification satisfaisant. |
| **Voix off** | *"Sécurisez vos rendez-vous avec les acomptes Stripe."* |

---

### [00:22 - 0:27] SCÈNE 5 : L'Art (Galerie Flash)

| Élément | Description |
|--------|-------------|
| **Visuel** | Interface galerie. |
| **Action** | Cartes flashs (Iris, Léopard, Carpe Koï) avec effet 3D/parallax au survol. Clic simulé sur "Léopard" → agrandissement centre, statut "Disponible". |
| **Voix off** | *"Mettez vos flashs en valeur."* |

---

### [00:27 - 0:30] SCÈNE 6 : Outro & CTA

| Élément | Description |
|--------|-------------|
| **Visuel** | Interface s'éloigne → fond sombre élégant. |
| **Texte** | **"Gagnez 5 heures par semaine."** (gros, gras, centré) |
| **Action** | Bouton "Commencer gratuitement" pulse. Flèche animée pointe dessus. URL : **ink-flow.me** |
| **Voix off** | *"Testez la démo interactive sur ink-flow.me"* |

---

## Assets à capturer

- **Écran de chargement** : Logo + barre de progression (voir `/` ou splash)
- **Page démo** : `/demo` — simulateur avec 5 scènes
- **Dashboard réel** : si disponible, captures authentiques
- **Galerie Flash** : images `/gallery/*.png` (Iris, Léopard, Carpe Koï)

---

## Checklist export

- [ ] 1920×1080, 30 fps
- [ ] Sous-titres intégrés ou burn-in
- [ ] Musique licenciée / libre de droits
- [ ] Sound design UI cohérent
- [ ] Logo InkFlow en fin de vidéo (optionnel)

---

## Prompt IA / Génération vidéo (Runway, Sora, Pika, etc.)

*Copier-coller ce prompt pour générer une vidéo 3D motion graphics premium :*

```
A high-end, cinematic 3D motion graphics promotional video for a premium SaaS platform designed for tattoo artists called 'InkFlow'. The visual style is ultra-modern, featuring a sleek, dark-mode glassmorphism user interface floating in a clean, softly lit, minimalist studio environment. The camera dynamically pans and zooms through various glowing dashboard modules: a dynamic revenue tracking chart with amber glowing lines, a CRM client list with elegant avatars, and a visual 3D gallery of tattoo flash designs including a detailed Koi carp and a minimalist leopard. Smooth, Apple-style product reveal transitions. Soft volumetric lighting, subtle drop shadows, depth of field, 4k resolution, photorealistic UI/UX design, highly fluid animations.
```
