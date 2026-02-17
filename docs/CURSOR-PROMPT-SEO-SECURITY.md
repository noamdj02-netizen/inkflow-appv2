# 🚀 PROMPT CURSOR - SEO & SÉCURITÉ pour InkFlow (ink-flow.me)

Copiez-collez ce prompt dans Cursor pour obtenir un audit complet et des recommandations :

---

## PROMPT POUR CURSOR :

```
Tu es un expert en SEO et en sécurité web. Analyse le code de https://ink-flow.me/ (SaaS pour tatoueurs) et fournis un rapport détaillé avec des recommandations concrètes.

# CONTEXTE
- Site : ink-flow.me
- Type : SaaS pour tatoueurs (gestion rendez-vous, portfolio, clients)
- Tech stack : [Préciser : Next.js, React, Node.js, etc.]
- Public cible : Tatoueurs professionnels et leurs clients

# MISSION 1 : AUDIT SEO

## 1. META TAGS & STRUCTURE
Vérifie et améliore :
- [ ] Title tags (50-60 caractères)
- [ ] Meta descriptions (150-160 caractères)
- [ ] Meta keywords pertinents
- [ ] Canonical URLs
- [ ] Lang attributes (fr-FR, en-US, etc.)
- [ ] Viewport meta tag
- [ ] Favicon et app icons (toutes tailles)

Fournis des exemples concrets pour :
- Page d'accueil
- Page de connexion/inscription
- Page de vitrine publique du tatoueur
- Page de prise de rendez-vous

## 2. OPEN GRAPH & SOCIAL
Génère les tags Open Graph pour :
- [ ] Facebook (og:title, og:description, og:image, og:url)
- [ ] Twitter Cards (twitter:card, twitter:title, twitter:description)
- [ ] LinkedIn
- [ ] Instagram (si applicable)

Image recommandée : 1200x630px
Fournis un composant React/Next.js réutilisable.

## 3. SCHEMA.ORG (JSON-LD)
Crée les schemas pour :
- [ ] Organization (InkFlow)
- [ ] LocalBusiness (pour les tatoueurs)
- [ ] Service (services de tatouage)
- [ ] Review/Rating (avis clients)
- [ ] Person (profil tatoueur)
- [ ] WebSite avec SearchAction

Exemple pour un profil de tatoueur avec son studio.

## 4. PERFORMANCE & CORE WEB VITALS
Analyse et optimise :
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to First Byte (TTFB)
- [ ] Images : next/image avec lazy loading
- [ ] Fonts : preload, font-display: swap
- [ ] CSS : critical CSS inline, defer non-critical
- [ ] JS : code splitting, dynamic imports

Fournis un checklist d'optimisation prioritaire.

## 5. SITEMAP & ROBOTS.TXT
Génère :
- [ ] sitemap.xml (pages principales + vitrines tatoueurs)
- [ ] robots.txt avec rules appropriées
- [ ] robots meta tags pour pages privées (dashboard)

Exemple de structure pour Next.js app router.

## 6. ACCESSIBILITÉ (a11y)
Vérifie :
- [ ] Attributs alt sur images
- [ ] ARIA labels
- [ ] Contraste des couleurs (WCAG AA minimum)
- [ ] Navigation au clavier
- [ ] Screen reader compatibility
- [ ] Focus indicators
- [ ] Semantic HTML (h1, h2, nav, main, etc.)

## 7. URLS & STRUCTURE
Recommande :
- [ ] URLs SEO-friendly
- [ ] Structure hiérarchique logique
- [ ] Breadcrumbs
- [ ] Pagination SEO
- [ ] 404 pages optimisées

Exemples d'URLs :
- /studio/[nom-studio] (vitrine publique)
- /prendre-rdv/[nom-studio]
- /galerie/[nom-studio]
- /portfolio/[nom-artiste]

## 8. CONTENU & MOTS-CLÉS
Suggère :
- [ ] Stratégie de mots-clés (tatoueur, rendez-vous tatouage, etc.)
- [ ] Blog posts SEO (ex: "Comment choisir son tatoueur")
- [ ] FAQ structurée avec Schema
- [ ] Textes alternatifs pour galeries
- [ ] Descriptions longues pour portfolios

---

# MISSION 2 : AUDIT SÉCURITÉ

## 1. HEADERS DE SÉCURITÉ HTTP
Implémente ces headers :

```javascript
// Next.js middleware ou next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
]
```

Fournis une CSP complète adaptée à InkFlow.

## 2. AUTHENTICATION & AUTHORIZATION
Vérifie :
- [ ] JWT tokens : expiration, refresh tokens
- [ ] Sessions : HttpOnly cookies, Secure flag
- [ ] Password hashing : bcrypt ou Argon2
- [ ] 2FA/MFA implémentation
- [ ] Rate limiting sur login (5 tentatives max)
- [ ] Account lockout après échecs
- [ ] Password reset sécurisé
- [ ] Email verification
- [ ] OAuth providers (Google, Facebook) sécurisés

Fournis un middleware d'authentification robuste.

## 3. PROTECTION XSS (Cross-Site Scripting)
Implémente :
- [ ] Sanitization des inputs utilisateurs
- [ ] DOMPurify pour HTML user-generated
- [ ] Escape des données avant render
- [ ] CSP strict
- [ ] Validation côté serveur ET client

Exemple avec bibliothèque DOMPurify :
```javascript
import DOMPurify from 'isomorphic-dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
```

## 4. PROTECTION CSRF (Cross-Site Request Forgery)
- [ ] CSRF tokens sur formulaires
- [ ] SameSite cookies
- [ ] Double submit cookie pattern
- [ ] Validation des origins

Fournis un middleware CSRF pour Next.js.

## 5. SQL INJECTION & NoSQL INJECTION
- [ ] Prepared statements / Parameterized queries
- [ ] ORM avec validation (Prisma, TypeORM)
- [ ] Input validation avec Zod ou Yup
- [ ] Sanitization des requêtes
- [ ] Principle of least privilege (DB users)

Exemple avec Prisma :
```typescript
// ✅ BON
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// ❌ MAUVAIS
const user = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${userId}`;
```

## 6. RATE LIMITING & DDoS
Implémente :
- [ ] Rate limiting sur API routes
- [ ] Throttling sur actions sensibles
- [ ] IP-based limiting
- [ ] User-based limiting
- [ ] CAPTCHA sur formulaires publics

Exemple avec next-rate-limit :
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite de requêtes
});
```

## 7. FILE UPLOAD SÉCURISÉ
Pour les uploads d'images (portfolios tatouages) :
- [ ] Validation du type MIME
- [ ] Limitation de taille (max 5-10MB)
- [ ] Scan antivirus (ClamAV)
- [ ] Stockage hors webroot
- [ ] Génération de noms uniques
- [ ] Validation des dimensions
- [ ] Compression automatique

Exemple de validation :
```javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Type de fichier non autorisé');
}
```

## 8. DONNÉES SENSIBLES
- [ ] Encryption des données au repos (AES-256)
- [ ] Encryption en transit (TLS 1.3)
- [ ] Variables d'environnement sécurisées (.env)
- [ ] Secrets rotation
- [ ] PII protection (RGPD)
- [ ] Logging sécurisé (pas de passwords en logs)
- [ ] Backup encryption

## 9. API SECURITY
- [ ] API keys rotation
- [ ] OAuth 2.0 flow
- [ ] Scope-based permissions
- [ ] Input validation sur tous les endpoints
- [ ] Output sanitization
- [ ] Versioning API
- [ ] CORS configuration stricte

Exemple CORS :
```javascript
const corsOptions = {
  origin: ['https://ink-flow.me', 'https://www.ink-flow.me'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 10. MONITORING & LOGGING
Implémente :
- [ ] Security event logging
- [ ] Failed login attempts tracking
- [ ] Suspicious activity alerts
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring

## 11. RGPD / GDPR COMPLIANCE
- [ ] Cookie consent banner
- [ ] Privacy policy page
- [ ] Terms of service
- [ ] Data export functionality
- [ ] Right to be forgotten (delete account)
- [ ] Data retention policies
- [ ] Cookie policy

## 12. DEPENDENCIES & SUPPLY CHAIN
- [ ] npm audit régulier
- [ ] Dependabot alerts
- [ ] Lock files (package-lock.json)
- [ ] Minimal dependencies
- [ ] License compliance

Commande à exécuter :
```bash
npm audit fix
npm outdated
```

---

# LIVRABLES ATTENDUS

1. **Rapport d'audit** :
   - Score SEO actuel vs optimisé
   - Vulnérabilités trouvées (critique, haute, moyenne, basse)
   - Checklist d'actions prioritaires

2. **Code à implémenter** :
   - Composant SEO.tsx réutilisable
   - Middleware sécurité
   - Helpers de validation
   - Configurations (next.config.js, robots.txt, sitemap)

3. **Documentation** :
   - Guide d'implémentation step-by-step
   - Best practices pour l'équipe
   - Checklist de déploiement sécurisé

4. **Exemples concrets** :
   - Meta tags pour page vitrine tatoueur
   - Schema.org pour profil tatoueur
   - Validation formulaire de contact sécurisé

---

# FORMAT DE RÉPONSE

Organise ta réponse en sections claires :

## 🔍 AUDIT SEO
### ✅ Points forts
### ⚠️ Points à améliorer
### 🚀 Quick wins (actions rapides)

## 🔒 AUDIT SÉCURITÉ
### ✅ Points forts
### 🚨 Vulnérabilités critiques
### ⚠️ Améliorations recommandées
### 🚀 Quick wins

## 💻 CODE À IMPLÉMENTER
[Fournis le code complet prêt à copier-coller]

## 📋 CHECKLIST D'ACTIONS
[Liste prioritisée avec estimations de temps]

## 📚 RESSOURCES
[Liens vers documentation pertinente]

---

Commence l'analyse maintenant !
```

---

## 🎯 COMMENT UTILISER CE PROMPT

### Étape 1 : Ouvrir Cursor
Ouvrez votre projet ink-flow.me dans Cursor

### Étape 2 : Copier le prompt
Copiez tout le texte du prompt ci-dessus (entre les ```)

### Étape 3 : Cmd/Ctrl + K
Appuyez sur Cmd+K (Mac) ou Ctrl+K (Windows) pour ouvrir Cursor AI

### Étape 4 : Coller et contexte
Collez le prompt et ajoutez :
- Votre stack technique exacte
- Fichiers spécifiques à analyser
- Priorités (SEO vs sécurité)

### Étape 5 : Itération
Posez des questions de suivi pour clarifier les recommandations

---

## 💡 VARIANTES DU PROMPT

### Pour un audit rapide (15 min) :
```
Analyse rapide SEO et sécurité de ink-flow.me. 
Donne-moi les 10 actions les plus critiques à faire MAINTENANT, 
avec code prêt à copier-coller.
```

### Pour focus SEO uniquement :
```
Audit SEO complet de ink-flow.me (SaaS tatoueurs).
Fournis meta tags, Schema.org, et optimisations performance 
pour pages vitrine tatoueurs + prise de rendez-vous.
```

### Pour focus sécurité uniquement :
```
Audit sécurité de ink-flow.me.
Analyse authentification, protection XSS/CSRF, 
rate limiting, et file uploads. 
Fournis middleware Next.js prêt à utiliser.
```

---

## 📊 RÉSULTATS ATTENDUS

Après avoir utilisé ce prompt, vous aurez :

✅ **Score SEO** avec recommandations chiffrées
✅ **Liste de vulnérabilités** classées par priorité
✅ **Code prêt à l'emploi** (composants, middleware, configs)
✅ **Checklist d'actions** avec estimations de temps
✅ **Documentation** pour maintenir les bonnes pratiques

---

## 🔥 BONUS : COMMANDES UTILES

Après implémentation, testez avec :

```bash
# SEO
npm run build
npm run analyze  # analyse du bundle
lighthouse https://ink-flow.me --view

# Sécurité
npm audit
npm audit fix
npx snyk test
```

---

## 📞 SUPPORT

Si Cursor ne comprend pas bien :
1. Précisez votre stack technique
2. Montrez-lui des fichiers spécifiques (@fichier.tsx)
3. Demandez des exemples concrets
4. Itérez question par question

Bon audit ! 🚀
