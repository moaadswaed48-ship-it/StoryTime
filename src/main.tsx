import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import '@fontsource-variable/rubik/wght.css'
import '@fontsource/noto-naskh-arabic/arabic-500.css'
import '@fontsource/noto-naskh-arabic/arabic-700.css'
import './i18n/locale'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
