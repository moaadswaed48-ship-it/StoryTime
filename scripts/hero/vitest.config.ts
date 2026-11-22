/**
 * Runs the 3D hero tests, which live beside the code in src/hero3d/__tests__ (the main vitest config only looks
 * in tests/).   npx vitest run --config scripts/hero/vitest.config.ts
 */
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  root,
  resolve: { alias: { '@': `${root}src`, '~content': `${root}content` } },
  test: { include: ['src/hero3d/**/*.test.ts'], environment: 'node', testTimeout: 60_000 },
})
