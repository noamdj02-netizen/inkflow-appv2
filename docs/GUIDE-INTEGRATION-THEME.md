# 🌓 InkFlow - Guide d'Intégration du Thème Jour/Nuit

## 📦 Fichiers fournis (référence dans l’archive)

1. **inkflow-theme-toggle.jsx** - Dashboard complet React avec thème
2. **inkflow-toggle-button.html** - Bouton standalone (HTML/CSS/JS)
3. **inkflow-theme-variables.css** - Variables CSS uniquement
4. **inkflow-theme-logic.js** - Logique JavaScript uniquement

**Note :** Dans ce projet, le thème est déjà intégré (`index.css` + `components/ThemeToggle.tsx`). Ce guide sert de référence si vous modifiez le thème.

---

## 🚀 Méthode 1 : Intégration rapide (React)

Si votre dashboard utilise déjà React :

### Étape 1 : Hook useTheme

Le projet utilise déjà un équivalent dans `ThemeToggle.tsx` et le contexte/thème. Pour un hook standalone :

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

### Étape 2 : Variables CSS

Les variables sont dans `index.css` (`:root[data-theme="light"]` et `:root[data-theme="dark"]`).

### Étape 3 : Bouton dans le header

Utilisez le composant existant `<ThemeToggle />` ou un bouton avec `className="theme-toggle"` et `data-theme={theme}`.

---

## 🎨 Conversion des couleurs

| Ancien   | Nouveau              | Usage           |
|----------|----------------------|-----------------|
| `#ffffff`| `var(--bg-card)`     | Fond de carte   |
| `#f8f9fa`| `var(--bg-primary)`  | Fond de page    |
| `#1a1a1a`| `var(--text-primary)`| Texte principal |
| `#6b7280`| `var(--text-secondary)` | Texte secondaire |
| `#ff8c00`| `var(--orange)`      | Accent orange   |
| `#e5e7eb`| `var(--border)`      | Bordures        |

---

## 🐛 Problèmes courants

- **Thème ne persiste pas** : vérifier `localStorage` et que `data-theme` est appliqué au chargement.
- **Transitions saccadées** : ajouter `transition: all 0.3s ease;` sur les éléments qui utilisent les variables.
- **Éléments qui ne changent pas** : utiliser les variables CSS, pas des couleurs en dur.

Bon développement ! 🚀
