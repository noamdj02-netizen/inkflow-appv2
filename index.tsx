import './instrumentation';
import 'lenis/dist/lenis.css';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Le thème est géré par next-themes + script inline dans index.html (évite le flash)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA / iOS: hauteur visible (Safari barre URL, Expo WebView). Alimente --vh et --vvh pour le CSS.
function setAppHeight() {
  const vv = window.visualViewport;
  const h = vv && vv.height > 0 ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
  document.documentElement.style.setProperty('--vvh', `${h}px`);
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 120));
const vvBoot = window.visualViewport;
if (vvBoot) {
  vvBoot.addEventListener('resize', setAppHeight);
  vvBoot.addEventListener('scroll', setAppHeight);
}

// Le splash est masqué par AppSplashGate une fois l'auth résolue (évite le flash)
