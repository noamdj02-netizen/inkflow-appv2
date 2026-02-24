import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initTheme } from './hooks/useTheme';
import App from './App';

// Appliquer le thème avant le premier render pour éviter un flash (light/dark).
initTheme();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA / iOS: fix viewport height (100vh bug on mobile standalone)
function setAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 100));
if (typeof window.visualViewport !== 'undefined') {
  window.visualViewport.addEventListener('resize', setAppHeight);
}

// Hide splash when React has rendered (requestAnimationFrame after first paint)
const splash = document.getElementById('splash');
if (splash) {
  const hideSplash = () => {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 350);
  };
  if (document.readyState === 'complete') {
    requestAnimationFrame(() => requestAnimationFrame(hideSplash));
  } else {
    window.addEventListener('load', () => requestAnimationFrame(() => requestAnimationFrame(hideSplash)));
  }
}