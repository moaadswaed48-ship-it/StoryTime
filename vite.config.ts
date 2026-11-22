import { fileURLToPath } from 'node:url'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { basePath, noIndex, siteOrigin } from './site.config.ts'

export default defineConfig({
  base: basePath,
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  define: {
    __SITE_ORIGIN__: JSON.stringify(siteOrigin),
    __NOINDEX__: JSON.stringify(noIndex),
  },
})
