# Déploiement InkFlow - GitHub & Vercel

## Résumé rapide

| Étape | Action |
|-------|--------|
| **GitHub** | Le code est poussé sur `origin/main` → [github.com/noamdj02-netizen/inkflow-appv2](https://github.com/noamdj02-netizen/inkflow-appv2) |
| **Vercel** | Si le projet est déjà importé depuis ce dépôt, chaque `git push` déclenche un déploiement auto. Sinon : Vercel → Add New → Project → importer le repo GitHub. |
| **Env** | Vercel → Settings → Environment Variables : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, puis Redeploy. |

---

## URL de production

**App :** https://app.ink-flow.me

---

## 1. Créer le dépôt GitHub (déjà fait)

1. Va sur [github.com/new](https://github.com/new)
2. Nom du dépôt : **inkflow** ou **ink-flow**
3. Description : `Plateforme SaaS pour tatoueurs - réservations, galerie Flash, CRM`
4. **Ne coche pas** "Add a README" (le projet en a déjà un)
5. Clique sur **Create repository**

---

## 2. Pousser le code sur GitHub

Remplace `TON_USERNAME` par ton nom d'utilisateur GitHub et `REPO_NAME` par le nom du dépôt :

```powershell
cd "c:\Users\lanie\OneDrive\.limpc\Bureau\inkdlow"

# Ajouter tous les fichiers
git add .
git commit -m "feat: InkFlow - vitrine, dashboard, responsive mobile"

# Ajouter le remote (remplace TON_USERNAME et REPO_NAME)
git remote add origin https://github.com/TON_USERNAME/REPO_NAME.git

# Renommer la branche en main
git branch -M main

# Pousser
git push -u origin main
```

---

## 3. Déployer sur Vercel

### Option A : Importer depuis GitHub (recommandé)

1. Va sur [vercel.com](https://vercel.com) et connecte-toi
2. Clique sur **Add New** → **Project**
3. Importe le dépôt depuis GitHub
4. Vercel détecte automatiquement **Vite**
5. Clique sur **Deploy**

Chaque `git push` sur `main` déclenchera un déploiement automatique.

### Option B : Via la CLI

```powershell
cd "c:\Users\lanie\OneDrive\.limpc\Bureau\inkdlow"
npx vercel
```

Suis les instructions (login si nécessaire). Pour déployer en production :

```powershell
npx vercel --prod
```

---

## 4. Domains (Vercel)

### Domaine par défaut

Ton projet a déjà un domaine Vercel :
- `app.ink-flow.me`

### Ajouter un domaine personnalisé

1. Vercel Dashboard → Ton projet → **Settings** → **Domains**
2. Clique sur **Add**
3. Saisis ton domaine (ex: `inkflow.fr`, `app.inkflow.com`)
4. Suis les instructions DNS (enregistrement A ou CNAME)

### Sous-domaines

- `www.inkflow.fr` → redirige vers `inkflow.fr`
- `app.inkflow.fr` → sous-domaine pour l'app

---

## 5. Variables d'environnement (obligatoire pour Supabase/Stripe)

Sans ces variables, l’app en prod ne pourra pas se connecter à Supabase ni générer de liens Stripe.

1. Vercel Dashboard → Ton projet → **Settings** → **Environment Variables**
2. Ajoute pour **Production** (et Preview si tu veux) :
   - `VITE_SUPABASE_URL` = l’URL de ton projet Supabase (ex. `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = la clé anon du projet (Supabase → Settings → API)
3. **Redeploy** : après avoir sauvegardé, va dans **Deployments** → ⋮ sur le dernier déploiement → **Redeploy**

---

## Configuration technique

- **Framework :** Vite (détecté automatiquement)
- **Build command :** `npm run build`
- **Output directory :** `dist`
- **SPA routing :** `vercel.json` configure les rewrites pour le routing client-side
