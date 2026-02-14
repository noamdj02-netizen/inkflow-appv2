# Déploiement InkFlow - GitHub & Vercel

## 1. Créer le dépôt GitHub

1. Va sur [github.com/new](https://github.com/new)
2. Nom du dépôt : **ink-flow**
3. Description : `Plateforme SaaS pour tatoueurs - réservations, galerie Flash, CRM`
4. **Ne coche pas** "Add a README" (le projet en a déjà un)
5. Clique sur **Create repository**

## 2. Pousser le code sur GitHub

Remplace `TON_USERNAME` par ton nom d'utilisateur GitHub :

```bash
cd "c:\Users\lanie\OneDrive\.limpc\Bureau\inkdlow"

# Ajouter le remote (remplace TON_USERNAME)
git remote add origin https://github.com/TON_USERNAME/ink-flow.git

# Renommer la branche en main (optionnel, GitHub utilise main par défaut)
git branch -M main

# Pousser
git push -u origin main
```

## 3. Déployer sur Vercel

### Option A : Via le site Vercel (recommandé)

1. Va sur [vercel.com](https://vercel.com) et connecte-toi
2. Clique sur **Add New** → **Project**
3. Importe le dépôt **ink-flow** depuis GitHub
4. Vercel détecte automatiquement Vite
5. Clique sur **Deploy**

### Option B : Via la CLI (déploiement direct)

```bash
cd "c:\Users\lanie\OneDrive\.limpc\Bureau\inkdlow"
vercel
```

Suis les instructions (login si nécessaire, confirme le projet).

### Option C : Lier à GitHub pour déploiements automatiques

Une fois le projet importé depuis GitHub sur Vercel, chaque `git push` déclenchera un nouveau déploiement automatiquement.

## Variables d'environnement (si besoin plus tard)

Si tu ajoutes Supabase, Stripe, etc. :

1. Vercel Dashboard → Ton projet → **Settings** → **Environment Variables**
2. Ajoute `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.
