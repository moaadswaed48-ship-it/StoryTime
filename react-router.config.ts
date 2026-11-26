import type { Config } from '@react-router/dev/config'
import { basePath } from './site.config.ts'
import { prerenderPaths } from './src/seo/paths.ts'

/** BUILD_DIR (optional) builds somewhere other than ./build, e.g. a private copy for audits while others rebuild.
 *  Outside the project, the folder above it needs a link to node_modules (the pre-render step imports React). */
const buildDirectory = process.env.BUILD_DIR || 'build'

/**
 * Static output only: no runtime server. Public pages are pre-rendered per language; everything else
 * (the signed-in app under /:lang/app/*) is served by the SPA fallback and rendered in the browser.
 */
export default {
  appDirectory: 'src',
  buildDirectory,
  ssr: false,
  basename: basePath,
  prerender: prerenderPaths(),
} satisfies Config
