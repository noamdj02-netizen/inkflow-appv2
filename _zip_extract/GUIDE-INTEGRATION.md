# 🌓 InkFlow - Guide d'Intégration du Thème Jour/Nuit

## 📦 Fichiers fournis

1. **inkflow-theme-toggle.jsx** - Dashboard complet React avec thème
2. **inkflow-toggle-button.html** - Bouton standalone (HTML/CSS/JS)
3. **inkflow-theme-variables.css** - Variables CSS uniquement
4. **inkflow-theme-logic.js** - Logique JavaScript uniquement

---

## 🚀 Méthode 1 : Intégration rapide (React)

Si votre dashboard utilise déjà React :

### Étape 1 : Copiez le hook dans votre code

```javascript
import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('inkflow-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inkflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
```

### Étape 2 : Ajoutez les variables CSS à votre fichier global

Copiez tout le contenu de `inkflow-theme-variables.css` dans votre fichier CSS principal.

### Étape 3 : Utilisez le hook dans votre header

```javascript
import { useTheme } from './hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header>
      {/* Vos autres éléments */}
      
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        data-theme={theme}
      >
        <div className="toggle-slider">
          <Sun className="toggle-icon sun" />
          <Moon className="toggle-icon moon" />
        </div>
      </button>
    </header>
  );
}
```

### Étape 4 : Ajoutez le CSS du bouton

```css
.theme-toggle {
  position: relative;
  width: 56px;
  height: 28px;
  background: var(--border);
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px var(--shadow-sm);
}

.theme-toggle:hover {
  background: var(--border-light);
  transform: scale(1.05);
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: var(--orange);
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255, 140, 0, 0.4);
}

.theme-toggle[data-theme="dark"] .toggle-slider {
  transform: translateX(28px);
}

.toggle-icon {
  width: 14px;
  height: 14px;
  color: white;
  transition: all 0.3s ease;
}

.toggle-icon.sun {
  opacity: 1;
  transform: rotate(0deg);
}

.toggle-icon.moon {
  position: absolute;
  opacity: 0;
  transform: rotate(180deg);
}

.theme-toggle[data-theme="dark"] .toggle-icon.sun {
  opacity: 0;
  transform: rotate(-180deg);
}

.theme-toggle[data-theme="dark"] .toggle-icon.moon {
  opacity: 1;
  transform: rotate(0deg);
}
```

---

## 🎨 Méthode 2 : Migration de votre CSS existant

### Remplacez vos couleurs par les variables CSS

**Avant :**
```css
.ma-carte {
  background: #ffffff;
  color: #1a1a1a;
  border: 1px solid #e5e7eb;
}
```

**Après :**
```css
.ma-carte {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  transition: all 0.3s ease; /* Important pour les animations fluides */
}
```

### Exemples de conversion courants

| Ancien | Nouveau | Usage |
|--------|---------|-------|
| `#ffffff` | `var(--bg-card)` | Fond de carte |
| `#f8f9fa` | `var(--bg-primary)` | Fond de page |
| `#1a1a1a` | `var(--text-primary)` | Texte principal |
| `#6b7280` | `var(--text-secondary)` | Texte secondaire |
| `#ff8c00` | `var(--orange)` | Accent orange |
| `#10b981` | `var(--green)` | Statut confirmé |
| `#6366f1` | `var(--blue)` | Boutons primaires |
| `#e5e7eb` | `var(--border)` | Bordures |

---

## 🛠️ Méthode 3 : Intégration HTML/JavaScript pure

Si vous n'utilisez pas React :

### 1. Ajoutez le CSS dans votre `<head>`
```html
<link rel="stylesheet" href="inkflow-theme-variables.css">
<link rel="stylesheet" href="votre-style-du-bouton.css">
```

### 2. Ajoutez le bouton dans votre header
```html
<button id="theme-toggle-btn" class="theme-toggle" aria-label="Toggle theme">
  <div class="toggle-slider">
    <svg class="toggle-icon sun" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    <svg class="toggle-icon moon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  </div>
</button>
```

### 3. Ajoutez le JavaScript avant `</body>`
```html
<script src="inkflow-theme-logic.js"></script>
```

---

## 🎯 Conseils d'intégration

### 1. Ajoutez les transitions partout
Tous vos éléments qui utilisent les variables CSS doivent avoir une transition :
```css
.mon-element {
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.3s ease; /* ← Important ! */
}
```

### 2. Testez ces éléments spécifiquement
- ✅ Header
- ✅ Sidebar
- ✅ Cartes de stats
- ✅ Graphiques (modifiez les couleurs d'axes)
- ✅ Tableaux
- ✅ Badges/Pills
- ✅ Formulaires
- ✅ Modals
- ✅ Dropdowns

### 3. Gardez vos couleurs d'accent
Les couleurs d'accent (orange, vert, bleu) restent les mêmes dans les deux thèmes pour la cohérence de la marque InkFlow.

### 4. Positionnement du bouton
Le bouton s'intègre naturellement à côté de "Ajouter un widget" dans votre header :
```html
<div class="header-actions">
  <button class="add-widget-btn">Ajouter un widget</button>
  <button class="theme-toggle">...</button> <!-- ← Ici -->
  <div class="notification-icon">🔔</div>
  <div class="profile-icon">AM</div>
</div>
```

---

## 📱 Responsive

Le bouton s'adapte automatiquement sur mobile. Vous pouvez ajuster la taille si nécessaire :

```css
@media (max-width: 768px) {
  .theme-toggle {
    width: 48px;
    height: 24px;
  }
  
  .toggle-slider {
    width: 20px;
    height: 20px;
  }
}
```

---

## 🐛 Problèmes courants

### Le thème ne persiste pas au rechargement
✅ Vérifiez que `localStorage` fonctionne et que la fonction `initTheme()` est appelée au chargement.

### Les transitions sont saccadées
✅ Ajoutez `transition: all 0.3s ease;` sur tous les éléments utilisant les variables CSS.

### Certains éléments ne changent pas de couleur
✅ Assurez-vous qu'ils utilisent les variables CSS et non des couleurs en dur.

### Le bouton ne se déplace pas
✅ Vérifiez que l'attribut `data-theme` est bien appliqué au bouton ET au `document.documentElement`.

---

## 🎉 Résultat final

Votre dashboard InkFlow aura maintenant :
- 🌞 Un mode clair élégant
- 🌙 Un mode sombre professionnel
- 💾 Sauvegarde automatique de la préférence
- ✨ Transitions fluides et animations
- 📱 Responsive sur tous les écrans
- 🎨 Couleurs synchronisées automatiquement

Bon développement ! 🚀
