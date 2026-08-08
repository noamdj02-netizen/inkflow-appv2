# Vidéo démo Inkflow (Remotion)

Projet [Remotion](https://github.com/remotion-dev/remotion) séparé du bundle Vite : tu prévisualises dans un studio, puis tu exportes un **MP4** à uploader sur **Framer** (ou héberger sur un CDN).

## Prérequis

- Node.js 18+
- [FFmpeg](https://ffmpeg.org/) installé et dans le `PATH` (requis pour `remotion render`)

## Installation

```bash
cd video/inkflow-demo
npm install
```

## Prévisualiser (Studio Remotion)

```bash
npm start
```

Ouvre l’URL indiquée, composition **InkflowDemo** (1920×1080, **~38 s** @ 30 fps — 4 séquences : intro, mockups animés, parcours réservation, outro).

Le projet contient aussi la composition **LogoReveal** (1080×1920, **~4,4 s** @ 30 fps) pour une intro/outro courte en format Instagram Story / Reel.

## Exporter la vidéo pour Framer

```bash
npm run render
```

Fichier généré : `out/inkflow-demo.mp4`.

Ensuite : Framer → média → importer la vidéo, ou héberger le fichier et utiliser une URL dans un composant vidéo.

### Exporter l’animation logo

```bash
npm run render:logo
```

Fichier généré : `out/inkflow-logo-reveal.mp4`.

### Image fixe (poster)

```bash
npm run render:still
```

→ `out/poster.png` (frame 90).

Pour l’animation logo :

```bash
npm run render:logo:still
```

→ `out/logo-reveal-poster.png` (frame 72).

## Personnaliser

- Animation logo : `src/LogoReveal.tsx`
- Texte, durée, couleurs : `src/InkflowDemo.tsx`
- ID / durée / résolution : `src/Root.tsx` (`durationInFrames`, `width`, `height`)

## Licence Remotion

Remotion a une licence spécifique (usage commercial / entreprise selon cas). Voir [remotion.dev/license](https://www.remotion.dev/license) et [remotion.pro/license](https://www.remotion.pro/license).
