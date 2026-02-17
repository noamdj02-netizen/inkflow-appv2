# Intégration des fichiers « files (11).zip » – SEO & thème

Ce document décrit ce qui a été intégré depuis l’archive et comment l’utiliser dans le projet **Vite + React** (Ink Flow).

---

## Déjà intégré dans le projet

### 1. **Composant SEO (Vite/React)**

- **Fichier** : `components/SEO.tsx`
- **Origine** : adapté depuis `SEO-Component-InkFlow.tsx` (prévu pour Next.js).
- **Usage** : met à jour le `<title>`, les meta (description, robots, og:*, twitter:*), le canonical et le JSON-LD via le DOM (aucune dépendance type `react-helmet`).

**Exemple par page :**

```tsx
import { SEO, organizationSchema, createTattooStudioSchema } from '../components/SEO';

// Page d’accueil
<SEO
  title="InkFlow - Logiciel de gestion pour tatoueurs"
  description="Gérez vos rendez-vous, clients et portfolio..."
  canonical="/"
  schema={organizationSchema}
/>

// Page vitrine studio (publique)
<SEO
  title={`${studio.name} - Tatoueur`}
  description={studio.tagline}
  canonical={`/studio/${slug}`}
  ogImage={studio.coverImage}
  ogType="profile"
  schema={createTattooStudioSchema({ name, description, address, city, postalCode, image, slug })}
/>

// Dashboard (privé)
<SEO title="Tableau de bord" noindex />
```

**Exports utiles** : `SEO`, `organizationSchema`, `websiteSchema`, `createTattooStudioSchema`, `createTattooServiceSchema`.

### 2. **Thème jour/nuit**

- Le thème (variables CSS `data-theme="light"` / `data-theme="dark"`) et le bouton de bascule sont déjà en place dans le projet (`index.css`, `components/ThemeToggle.tsx`).
- Les fichiers du zip (`inkflow-theme-variables.css`, `inkflow-theme-toggle.jsx`, etc.) servent de **référence** ; pas d’import supplémentaire nécessaire.

---

## Fichiers du zip non utilisés tels quels

| Fichier | Raison |
|--------|--------|
| `SEO-Component-InkFlow.tsx` | Remplacé par `components/SEO.tsx` (version Vite, sans `next/head`). |
| `NextJS-Config-InkFlow.ts` | Projet en Vite, pas Next.js. Sitemap/robots à gérer côté build ou serveur (voir ci‑dessous). |
| `Security-Middleware-InkFlow.ts` | Middleware Next.js. En Vite, les en-têtes de sécurité se configurent sur l’hébergeur (Vercel, Netlify, nginx) ou un petit serveur. |
| `inkflow-theme-*.css/jsx` | Thème déjà présent ; contenu du zip disponible en référence dans `_zip_extract/`. |

---

## À faire de votre côté (recommandations)

### SEO

1. **Utiliser `<SEO />` sur chaque route** (landing, studio, book, dashboard avec `noindex`).
2. **Sitemap / robots**  
   - En Vite : générer `sitemap.xml` et `robots.txt` au build (script ou plugin), ou les servir par le host (Vercel/Netlify).
3. **Images**  
   - Balises appropriées, `alt` descriptifs, prévoir une image OG par type de page (ex. 1200×630).

### Sécurité

1. **Headers**  
   - Configurer les security headers sur la plateforme (ex. Vercel `headers` dans `vercel.json`, Netlify `_headers`, ou nginx).
2. **Auth / API**  
   - Rate limiting, validation (ex. Zod), sanitization des entrées ; le middleware du zip peut inspirer la logique à reproduire côté API ou proxy.

---

## Référence des fichiers extraits

Les fichiers de l’archive sont dans `_zip_extract/` à la racine du projet :

- `GUIDE-INTEGRATION.md` – thème
- `GUIDE-RAPIDE-SEO-SECURITY.md` – guide rapide SEO/sécurité (orienté Next.js)
- `CURSOR-PROMPT-SEO-SECURITY.md` – prompt Cursor pour audit SEO/sécurité
- `inkflow-theme-variables.css`, `inkflow-theme-toggle.jsx`, etc. – thème (référence)
- `Security-Middleware-InkFlow.ts`, `NextJS-Config-InkFlow.ts` – exemples Next.js (à adapter si vous passez sur Next.js plus tard)

Vous pouvez supprimer le dossier `_zip_extract` après lecture si vous n’en avez plus besoin.
