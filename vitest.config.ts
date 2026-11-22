import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~content': fileURLToPath(new URL('./content', import.meta.url)),
    },
  },
  define: {
    __SITE_ORIGIN__: JSON.stringify('https://example.test'),
    __NOINDEX__: 'false',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
