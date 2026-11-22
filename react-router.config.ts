import type { Config } from '@react-router/dev/config'
import { basePath } from './site.config.ts'
import { prerenderPaths } from './src/seo/paths.ts'

/**
 * Static output only: no runtime server. Public pages are pre-rendered per language; everything else
 * (the signed-in app under /:lang/app/*) is served by the SPA fallback and rendered in the browser.
 */
export default {
  appDirectory: 'src',
  buildDirectory: 'build',
  ssr: false,
  basename: basePath,
  prerender: prerenderPaths(),
} satisfies Config
