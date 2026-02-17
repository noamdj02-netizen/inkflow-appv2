// ============================================
// 🚀 COPIER-COLLER RAPIDE - Code minimal
// ============================================

// ────────────────────────────────────────────
// 1️⃣ HOOK REACT (hooks/useTheme.js)
// ────────────────────────────────────────────

import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem('inkflow-theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inkflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}


// ────────────────────────────────────────────
// 2️⃣ COMPOSANT BOUTON (components/ThemeToggle.jsx)
// ────────────────────────────────────────────

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      data-theme={theme}
      aria-label="Toggle theme"
    >
      <div className="toggle-slider">
        <Sun className="toggle-icon sun" />
        <Moon className="toggle-icon moon" />
      </div>
    </button>
  );
}


// ────────────────────────────────────────────
// 3️⃣ CSS MINIMAL (styles/theme.css)
// ────────────────────────────────────────────

/* Variables de thème */
:root[data-theme="light"] {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
  --orange: #ff8c00;
  --border: #e5e7eb;
  --shadow-sm: rgba(0, 0, 0, 0.05);
}

:root[data-theme="dark"] {
  --bg-primary: #0f1113;
  --bg-secondary: #18191b;
  --bg-card: #1e2023;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --orange: #ff9500;
  --border: #2d3035;
  --shadow-sm: rgba(0, 0, 0, 0.3);
}

/* Bouton toggle */
.theme-toggle {
  position: relative;
  width: 56px;
  height: 28px;
  background: var(--border);
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
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
}

.toggle-icon.moon {
  position: absolute;
  opacity: 0;
}

.theme-toggle[data-theme="dark"] .toggle-icon.sun {
  opacity: 0;
}

.theme-toggle[data-theme="dark"] .toggle-icon.moon {
  opacity: 1;
}


// ────────────────────────────────────────────
// 4️⃣ UTILISATION DANS VOTRE HEADER
// ────────────────────────────────────────────

import { ThemeToggle } from './components/ThemeToggle';

function Header() {
  return (
    <header className="header">
      <div className="logo">InkFlow</div>
      
      <div className="header-actions">
        <button>Ajouter un widget</button>
        <ThemeToggle /> {/* ← Ajoutez ici */}
        <div className="notifications">🔔</div>
        <div className="profile">AM</div>
      </div>
    </header>
  );
}


// ────────────────────────────────────────────
// 5️⃣ MIGREZ VOS STYLES EXISTANTS
// ────────────────────────────────────────────

// Avant :
.ma-carte {
  background: #ffffff;
  color: #1a1a1a;
}

// Après :
.ma-carte {
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.3s ease; /* Important ! */
}


// ────────────────────────────────────────────
// 🎯 C'EST TOUT !
// ────────────────────────────────────────────
// Votre thème est maintenant fonctionnel avec :
// ✅ Sauvegarde automatique dans localStorage
// ✅ Transitions fluides
// ✅ Animation du bouton
// ✅ Synchronisation des couleurs


// ────────────────────────────────────────────
// 📦 VERSION SANS REACT (JavaScript pur)
// ────────────────────────────────────────────

// Dans votre fichier main.js :
function initTheme() {
  const theme = localStorage.getItem('inkflow-theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('inkflow-theme', newTheme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.setAttribute('data-theme', newTheme);
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
});


// ────────────────────────────────────────────
// 📝 HTML DU BOUTON (si pas React)
// ────────────────────────────────────────────

<button id="theme-toggle" class="theme-toggle">
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


// ────────────────────────────────────────────
// 💡 ASTUCES
// ────────────────────────────────────────────

// 1. Ajoutez transition sur tous les éléments qui utilisent les variables
// 2. Testez sur mobile (le bouton reste fonctionnel)
// 3. Les couleurs d'accent (orange, vert, bleu) restent les mêmes dans les deux thèmes
// 4. Le thème persiste après rechargement grâce à localStorage
