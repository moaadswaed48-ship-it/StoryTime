// The instruction pictures' own small page (index.html beside this file): it draws one card, one whole set or
// the cast sheet for studio/scripts/instructions-export.mjs to capture. Separate from the site and from the
// Studio's page, so a render never depends on work in progress elsewhere.
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../../../src', import.meta.url)) } },
  server: { fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] } },
  logLevel: 'warn',
})
