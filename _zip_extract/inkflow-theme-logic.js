// ========================================
// INKFLOW THEME TOGGLE - Logic JavaScript
// ========================================

// Initialiser le thème au chargement de la page
function initTheme() {
  // Récupérer le thème depuis localStorage ou utiliser 'light' par défaut
  const savedTheme = localStorage.getItem('inkflow-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  return savedTheme;
}

// Fonction pour changer le thème
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('inkflow-theme', newTheme);
  
  return newTheme;
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Attacher l'événement au bouton toggle
  const toggleButton = document.getElementById('theme-toggle-btn');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleTheme);
  }
});

// ========================================
// VERSION REACT HOOK (pour votre app React)
// ========================================

/*
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

// UTILISATION dans votre composant :
// const { theme, toggleTheme } = useTheme();
// <button onClick={toggleTheme}>Toggle</button>
*/
