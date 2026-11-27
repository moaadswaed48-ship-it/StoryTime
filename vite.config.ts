import { fileURLToPath } from 'node:url'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { basePath, noIndex, noIndexAsked, originIsPlaceholder, siteOrigin } from './site.config.ts'

const SRC = fileURLToPath(new URL('./src', import.meta.url))
const CONTENT = fileURLToPath(new URL('./content', import.meta.url))

/**
 * The test-mode backend (accounts in this browser) and the story files it reads exist only in test-mode builds.
 * A launch build (VITE_SUPABASE_URL and a publishable key set) must not publish either (CLAUDE.md hard rule 6):
 * story text is fetched from Supabase for accounts with a trial or pass, never shipped in public script files.
 * `__TEST_BACKEND__` lets the code drop those imports, and in a launch build this plugin answers every import of
 * them with an empty module that throws, so not one file of theirs can reach the output, whatever the bundler's
 * dead-code removal does. e2e/stage4b1.spec.ts scans every file of a launch build for story lines.
 */
const TEST_ONLY = [
  `${SRC}/data/local/`,
  `${SRC}/features/owner/data/local.ts`,
  `${SRC}/features/owner/data/blobs.ts`,
  `${CONTENT}/stories/`,
]
const OFF = '\0storytime:test-backend-off'

function testBackendOff(): Plugin {
  return {
    name: 'storytime:test-backend-off',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source === OFF) return OFF
      const r = await this.resolve(source, importer, { ...options, skipSelf: true })
      const id = r?.id.split('?')[0] ?? ''
      return TEST_ONLY.some((p) => id.startsWith(p)) ? OFF : null
    },
    load(id) {
      if (id === OFF) return `throw new Error('The test-mode backend is not part of a launch build.')\nexport {}\n`
      return null
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const launch = !!(env.VITE_SUPABASE_URL && (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY))
  // A launch build must name its real address (canonical links, sitemap, robots.txt) or say NOINDEX=1 (review 26 Nov, 8).
  if (launch && originIsPlaceholder && !noIndexAsked && mode === 'production') {
    throw new Error('Launch build refused: set SITE_ORIGIN to the real address (for example https://storytime.co.il), or NOINDEX=1 for a hidden preview.')
  }
  return {
    base: basePath,
    plugins: [...(launch ? [testBackendOff()] : []), tailwindcss(), reactRouter()],
    resolve: {
      alias: {
        '@': SRC,
        '~content': CONTENT,
      },
    },
    define: {
      __SITE_ORIGIN__: JSON.stringify(siteOrigin),
      __NOINDEX__: JSON.stringify(noIndex),
      __TEST_BACKEND__: JSON.stringify(!launch),
    },
  }
})
