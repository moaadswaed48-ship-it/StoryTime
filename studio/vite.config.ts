// The Studio's own small page (studio/index.html): it draws one scene for the export script to capture.
// It is separate from the site, so a render never depends on the app's routes or on work in progress there.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  logLevel: 'warn',
})
