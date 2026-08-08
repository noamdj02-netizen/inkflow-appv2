# Captures App Store — dimensions iPhone 6,5"

App Store Connect (**iPhone — écran 6,5 pouces**) n’accepte **que** ces tailles en pixels :

| Orientation | Dimensions                         |
| ----------- | ---------------------------------- |
| Portrait    | **1284 × 2778** ou **1242 × 2688** |
| Paysage     | **2778 × 1284** ou **2688 × 1242** |

Format : **PNG** ou JPEG. Pas de 1080×1350 (Instagram), pas de 1290×2796 sauf si tu exportes la bonne zone.

## Figma InkFlow

Fichier : [App Store Previews Screenshots](https://www.figma.com/design/s6PhAayRN64BJ6YjFFOV0c/App-Store-Previews-Screenshots--Community-?node-id=4017-30)

Frames prêtes à l’export (à droite du « Cover Image ») :

1. `ASC 6.5" — 01 Accueil`
2. `ASC 6.5" — 02 App + vitrine`
3. `ASC 6.5" — 03 Brief client`
4. `ASC 6.5" — 04 Flash galerie`
5. `ASC 6.5" — 05 Acompte rappels`

Chaque frame = **1284 × 2778 px** exact.

## Export depuis Figma

1. Sélectionner **un** frame `ASC 6.5" — …` (pas le groupe parent).
2. Panneau **Export** → **+** → **PNG**.
3. Scale **1x** (pas 2x — sinon Apple voit le double des pixels attendus).
4. Exporter les **5** frames.
5. Vérifier en local :  
   `sips -g pixelWidth -g pixelHeight capture.png`  
   → doit afficher **1284** et **2778**.

## Upload App Store Connect

1. **App iOS** → version **1.0** → **iPhone** → **Écran 6,5 pouces**.
2. Supprimer les anciennes captures (mauvaises dimensions).
3. Glisser les **5** PNG **1284×2778**.
4. **Enregistrer** → l’erreur rouge sur les dimensions doit disparaître.
5. **Ajouter pour vérification** quand tout est vert.

## Si tu refais les visuels

Ne pas exporter les petits calques `First` / `Second` (~325×576) : trop petits pour Apple.
