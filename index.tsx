import './instrumentation';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Le thème est géré par next-themes + script inline dans index.html (évite le flash)

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

// Le splash est masqué par AppSplashGate une fois l'auth résolue (évite le flash)