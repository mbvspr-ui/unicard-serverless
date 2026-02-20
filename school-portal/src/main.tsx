import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPWA, registerServiceWorker } from './utils/pwa'

// Initialize PWA
initPWA();

// Register service worker
registerServiceWorker().then((registration) => {
  if (registration) {
    // Service worker registered
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
