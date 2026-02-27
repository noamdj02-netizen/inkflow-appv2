# Déploiement InkFlow sur GitHub et Vercel

## 1. Pousser le code sur GitHub

Le dépôt est déjà configuré : `https://github.com/noamdj02-netizen/inkflow-appv2`

```powershell
# Ajouter tous les fichiers
git add .

# Commit
git commit -m "feat: landing, emails, déploiement Vercel"

# Pousser sur GitHub
git push origin main
```

## 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous (GitHub)
2. **Add New** → **Project**
3. Importez le dépôt `noamdj02-netizen/inkflow-appv2`
4. Vercel détecte automatiquement **Vite** (via `vercel.json`)

## 3. Variables d'environnement

Dans **Vercel** → **Settings** → **Environment Variables**, ajoutez :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | Production, Preview |
| `VITE_GEMINI_API_KEY` | (optionnel) Clé API Gemini pour l'assistant IA | Production, Preview |

> Ces valeurs se trouvent dans **Supabase Dashboard** → **Settings** → **API**.

## 4. Déploiement

- Chaque push sur `main` déclenche un déploiement automatique
- L’URL sera du type : `https://inkflow-appv2.vercel.app` ou votre domaine personnalisé

## 5. Domaine personnalisé (ink-flow.me)

1. **Vercel** → **Settings** → **Domains**
2. Ajoutez `ink-flow.me` et `www.ink-flow.me`
3. Configurez les enregistrements DNS chez votre registrar :
   - **A** : `76.76.21.21` (Vercel)
   - **CNAME** (www) : `cname.vercel-dns.com`

## 6. Vérification

Après le déploiement, testez :

- [ ] Page d’accueil
- [ ] Inscription / Connexion
- [ ] Dashboard (avec compte Supabase)
- [ ] PWA (installation sur mobile)
