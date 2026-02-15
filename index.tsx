import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

// Hide splash screen when app is ready
const splash = document.getElementById('splash');
if (splash) {
  const hideSplash = () => {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 350);
  };
  if (document.readyState === 'complete') {
    setTimeout(hideSplash, 300);
  } else {
    window.addEventListener('load', () => setTimeout(hideSplash, 300));
  }
}