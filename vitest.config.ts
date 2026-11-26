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
    __TEST_BACKEND__: 'true',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Each database test file builds a fresh Postgres (PGlite) with every migration; with all files running at once
    // on a busy machine that can pass the 5 s / 10 s defaults. Raised so a slow machine does not read as a failure.
    testTimeout: 30_000,
    hookTimeout: 180_000,
  },
})
