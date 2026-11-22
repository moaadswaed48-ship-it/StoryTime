import { existsSync, readdirSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end checks against the built site, served the way a static host serves it, under the preview base path.
 * WebKit (Safari) runs only where a WebKit build is installed; this container has Chromium only (docs/HANDOFF.md).
 */
const BASE_PATH = process.env.BASE_PATH ?? '/StoryTime/next/'
const PORT = Number(process.env.E2E_PORT ?? 4317)
const browsers = process.env.PLAYWRIGHT_BROWSERS_PATH ?? ''
const hasWebKit = !!browsers && existsSync(browsers) && readdirSync(browsers).some((d) => d.startsWith('webkit'))

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'qa/out/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}${BASE_PATH}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    ...(hasWebKit ? [{ name: 'iphone', use: { ...devices['iPhone 14'] } }] : []),
  ],
  webServer: {
    command: `npm run build && node scripts/serve.mjs --port=${PORT}`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    env: { BASE_PATH, NOINDEX: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
