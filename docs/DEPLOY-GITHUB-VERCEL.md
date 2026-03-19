# Déploiement InkFlow sur GitHub et Vercel

Le projet est une **SPA Vite + React**. Le fichier racine **`vercel.json`** configure déjà :
- **Build** : `npm run build` → dossier **`dist`**
- **Rewrites** : toutes les routes → `index.html` (routing client-side)
- **Headers** cache pour `/assets` et `/images`

---

## 1. Pousser le code sur GitHub

**Dépôt configuré** : `https://github.com/noamdj02-netizen/inkflow-appv2`

```powershell
cd "chemin\vers\inkdlow"

# Voir la branche courante
git branch

# Ajouter les fichiers (évitez d’ajouter du bruit local : .claude, brouillons)
git add -A
git status

# Commit
git commit -m "feat: mises à jour app (SEO, UI, etc.)"

# Pousser — remplacez par votre branche si ce n’est pas main
git push -u origin main
# ou, si vous travaillez sur une feature :
git push -u origin feat/mobile-ui-redesign-theme-fix
```

Ensuite sur GitHub : ouvrez une **Pull Request** vers `main` si vous utilisez une branche feature, puis **Merge**.

> **Authentification GitHub** : PAT (Personal Access Token) ou GitHub CLI `gh auth login`, ou SSH (`git@github.com:...`).

---

## 2. Connecter le dépôt à Vercel

1. Allez sur [vercel.com](https://vercel.com) → connexion avec **GitHub**.
2. **Add New…** → **Project** → **Import** `noamdj02-netizen/inkflow-appv2`.
3. Paramètres détectés automatiquement grâce à **`vercel.json`** :
   - **Framework Preset** : Vite  
   - **Build Command** : `npm run build`  
   - **Output Directory** : `dist`
4. Cliquez **Deploy**.

Les prochains **push** sur la branche de production (souvent `main`) redéploient tout seuls.

---

## 3. Variables d’environnement (Vercel)

**Project** → **Settings** → **Environment Variables** → cochez **Production** et **Preview**.

Minimum pour que l’app fonctionne :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anon (publique) |

Souvent utiles :

| Variable | Description |
|----------|-------------|
| `VITE_GEMINI_API_KEY` | Assistant IA (optionnel) |
| `VITE_SENTRY_DSN` | Erreurs front (optionnel) |

Liste détaillée + secrets côté Supabase : **`docs/ENV-PRODUCTION.md`**.

> Le **prebuild** (`generate-sitemap.mjs`) utilise Supabase si les variables sont présentes sur la machine de build ; sur Vercel, ajoutez bien `VITE_SUPABASE_*` pour générer le sitemap avec les studios.

---

## 4. Domaine personnalisé (ex. app.ink-flow.me)

1. Vercel → **Settings** → **Domains** → ajoutez le domaine.
2. Suivez les enregistrements DNS indiqués par Vercel (souvent **CNAME** vers `cname.vercel-dns.com`).

Mettez à jour **`lib/urls.ts`** (`APP_URL`) et la **Search Console** / **fichier de vérification Google** pour la même URL publique.

---

## 5. Vérifications après déploiement

- [ ] `/` — landing  
- [ ] `/login`, `/signup`  
- [ ] `/dashboard` (compte test)  
- [ ] `/studio/<slug>` vitrine publique  
- [ ] Fichier Google : `/google0f1046d02ef1bfa1.html`  
- [ ] `sitemap.xml`, `robots.txt`

---

## Dépannage

| Problème | Piste |
|----------|--------|
| 404 sur les routes (`/dashboard`, etc.) | Vérifier que **`vercel.json`** est bien en prod (rewrites). |
| Build Vercel échoue | Regarder les **logs** ; vérifier `npm run build` en local. |
| Supabase ne répond pas | Variables `VITE_*` manquantes ou mauvais projet. |
