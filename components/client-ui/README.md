# App client — composants découverte & réservation

Surfaces : `/client` (Explorer, Accueil), `/book/:slug`, vitrine publique.

## Règles UX (résumé)

- **Inter** : classes `font-client-app` sur cartes et corps (voir `index.css`, shell `.client-dashboard-shell`).
- **Flash** : image dédiée ; **pas de texte ni prix par-dessus** le visuel — prix + pastille « Flash » sous la photo (`FlashCardClient`).
- **Flash vs projet** : flux séparés dans l’app ; onglets vitrine Flash / Projet ne fusionnent pas les parcours.
- **Accessibilité** : zones cliquables ≥ 44px ; pas de `<form>` natif sur les parcours client (contrôle impératif / boutons).

## Composants

| Composant | Rôle |
|-----------|------|
| `FlashCardClient` | Grille explorer : image, favori, puis pastille Flash + prix + titre + CTA Réserver. |
| `ArtistCardClient` | Carrousel « Artistes proches » : avatar, nom, lieu, distance. |
| `BookingStepShell` | En-tête d’étape pour `/book` (barre de progression + titre + zone enfants). |

## États

- **Loading** : préférer skeletons existants dans les pages (`SkeletonPill`, grilles).
- **Empty** : message court + glyphe (`ClientEmptyGlyph` dans `ClientDashboard`).
- **Error** : toast + bouton réessayer au niveau page.

Palette rotative : `CLIENT_CARD_PALETTES` (`paletteRotation.ts`).
