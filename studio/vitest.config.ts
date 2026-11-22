// The Studio's own tests: `npx vitest run --config studio/vitest.config.ts`
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  test: { include: ['studio/tests/**/*.test.ts'], environment: 'node', testTimeout: 240000 },
})
