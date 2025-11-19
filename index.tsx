

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';

// --- DATA PRIVACY NOTE ---
// All application data (conversation reports, ABC events, child profiles, etc.)
// is stored EXCLUSIVELY in the user's browser using localStorage.
// No data is sent to any external servers or third parties.
// The application operates entirely client-side for maximum privacy.
// --- END DATA PRIVACY NOTE ---

// Global error handler for critical unhandled errors during startup
window.onerror = (message, source, lineno, colno, error) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px; color: #ef4444; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 50px auto; max-width: 600px;">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">Krytyczny błąd podczas uruchamiania aplikacji!</h2>
        <p style="font-size: 1rem; margin-bottom: 20px;">Przepraszamy, coś poszło nie tak. Spróbuj odświeżyć stronę lub wyczyścić pamięć podręczną przeglądarki.</p>
        <p style="font-size: 0.8rem; color: #dc2626;">Szczegóły błędu (dla deweloperów):</p>
        <pre style="text-align: left; background-color: #fee2e2; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.75rem;">${message}<br>Source: ${source} at Line ${lineno}, Column ${colno}<br>Error: ${error ? error.stack : 'N/A'}</pre>
      </div>
    `;
  }
  // Prevent default browser error reporting
  return true; 
};


// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical React render error:", error);
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px; color: #ef4444; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 50px auto; max-width: 600px;">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">Krytyczny błąd podczas ładowania interfejsu!</h2>
        <p style="font-size: 1rem; margin-bottom: 20px;">Przepraszamy, nie udało się poprawnie uruchomić aplikacji. Spróbuj odświeżyć stronę lub wyczyścić pamięć podręczną przeglądarki.</p>
        <p style="font-size: 0.8rem; color: #dc2626;">Szczegóły błędu (dla deweloperów):</p>
        <pre style="text-align: left; background-color: #fee2e2; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.75rem;">${error instanceof Error ? error.message : String(error)}<br>${error instanceof Error ? error.stack : 'N/A'}</pre>
      </div>
    `;
  }
}