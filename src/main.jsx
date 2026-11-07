import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import { resumeGoogleTranslation } from './lib/googleTranslate'
import App from './App.jsx'

/* ── Service worker: production only. Dev must not cache Vite modules. ── */
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
  window.caches?.keys?.().then((keys) => {
    keys.forEach((key) => window.caches.delete(key))
  })
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW registration is best-effort — never crash the app */
    })
  })
}

// Re-apply a Google page translation chosen on a previous visit
resumeGoogleTranslation()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
