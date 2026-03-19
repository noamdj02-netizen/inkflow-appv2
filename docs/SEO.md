# SEO — InkFlow (SPA Vite)

## Principes

- **Métadonnées** : le composant `components/SEO.tsx` met à jour `title`, `description`, Open Graph, Twitter Card, `canonical` et JSON-LD après navigation (React).
- **Premier rendu** : `index.html` contient des balises de base pour les crawlers et le partage avant exécution du JS.
- **Données structurées** : pas d’`AggregateRating` fictif (risque de pénalité Google). Offres tarifaires alignées sur les plans réels.

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `index.html` | Meta par défaut, JSON-LD `@graph`, noscript |
| `components/SEO.tsx` | Mise à jour dynamique + `softwareApplicationSchema`, `createBreadcrumbSchema` |
| `lib/seoUtils.ts` | URLs absolues pour `og:image` |
| `public/robots.txt` | Allow + `Disallow` dashboard / zones privées |
| `public/sitemap.xml` | Généré au **prebuild** par `scripts/generate-sitemap.mjs` (pages statiques + slugs Supabase) |

## Rich Results Test : « Aucun élément détecté »

- **Normal** pour `SoftwareApplication`, `Organization`, `WebSite` : Google les utilise pour comprendre la page, mais **ne les affiche pas** comme encarts FAQ / produits dans l’outil de test.
- Les **FAQ** (`FAQPage` + `Question` / `Answer`) sont un type **éligible** : injectées sur la **home** via React (`faqPageSchemaFr`) quand la section FAQ est affichée — utilisez le test d’URL **après rendu** (pas « code source » seul). `Organization` / `SoftwareApplication` restent dans `index.html` pour le premier chargement.
- Si vous testez l’URL **Framer** (`ink-flow.me` hébergé sur Framer), ce n’est **pas** le même HTML que l’app Vite : collez le code JSON-LD ou testez l’URL **exacte** où est déployée l’app (ex. `app.ink-flow.me`).

## Après déploiement

1. Vérifier `APP_URL` / `LANDING_URL` dans `lib/urls.ts`.
2. **Search Console** : sitemap `https://votre-domaine/sitemap.xml`.
3. Tester un partage LinkedIn / Facebook (OG) et [Rich Results Test](https://search.google.com/test/rich-results) sur `/` et une vitrine `/studio/...`.

## Pages `noindex`

Démo interactive, parrainage (connecté), 404, consentement, messagerie publique, dashboard : éviter le duplicate / contenu privé.
