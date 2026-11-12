import { defineConfig, devices } from '@playwright/test'

// ST_DEV=1 → run against the shared dev server (feature demo pages); otherwise against the production preview build.
const dev = !!process.env.ST_DEV
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: dev ? `http://localhost:${process.env.PW_PORT ?? 5173}/` : 'http://localhost:4173/', // PW_PORT: a second dev server (another worktree) without touching the shared one
    trace: 'off',
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: dev ? undefined : { command: 'npx vite preview --host 0.0.0.0 --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', browserName: 'chromium', hasTouch: true } },
  ],
})
