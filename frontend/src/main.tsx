import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Password-recovery links land on the app root as `#type=recovery&...`.
// Route them to the reset screen before the router boots; the hash stays in
// place so supabase-js can detect the recovery event.
if (window.location.hash.includes('type=recovery')) {
  window.history.replaceState(null, '', '/reset-password?recovery=1' + window.location.hash)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
