/**
 * Stand-alone page for the 3D hero: the lab page (src/lab/hero.tsx) mounted without the rest of the site, so the
 * screenshot and poster scripts keep working even when another part of the app does not compile.
 * Served by scripts/hero/serve.mjs. ?dir=rtl&lang=ar checks the right-to-left layout.
 */
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '../../src/app.css'
import HeroLab from '../../src/lab/hero.tsx'

const q = new URLSearchParams(location.search)
if (q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <HeroLab />
  </BrowserRouter>,
)
