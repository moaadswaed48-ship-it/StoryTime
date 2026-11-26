// After `react-router build`: lay build/client out exactly like the URL space, ready for a plain file host.
//  - React Router writes pre-rendered pages under build/client/<base path>/ but the assets and the SPA fallback at
//    build/client/. Both move under the base path, so build/client/StoryTime/next/assets/x.js is served at
//    /StoryTime/next/assets/x.js. Deploy = copy build/client/<base path>/ to where the base path points.
//  - __spa-fallback.html: the page for client-only URLs (the app). 404.html is a copy for hosts that serve
//    404.html for unknown paths (GitHub Pages uses only the one at the site root: see docs/HANDOFF.md).
//  - .nojekyll: GitHub Pages would otherwise hide files whose names start with "_".
//  - build/client/.vite (the build manifest) is removed: it is not part of the site.
//  - sitemap.xml and robots.txt from the list of public pages (src/seo/sitemap.ts): preview builds (NOINDEX=1) disallow
//    all crawling; launch builds allow the public pages and name the sitemap.
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { basePath, noIndex, siteOrigin } from '../site.config.ts'
import { robotsTxt, sitemapXml } from '../src/seo/sitemap.ts'

const client = resolve(import.meta.dirname, '..', process.env.BUILD_DIR || 'build', 'client')
const site = resolve(client, '.' + basePath)
rmSync(resolve(client, '.vite'), { recursive: true, force: true })

if (basePath !== '/') {
  mkdirSync(site, { recursive: true })
  const spa = resolve(client, 'index.html')
  if (existsSync(spa) && /"isSpaMode":true/.test(readFileSync(spa, 'utf8'))) renameSync(spa, resolve(site, '__spa-fallback.html'))
  if (existsSync(resolve(client, '__spa-fallback.html'))) renameSync(resolve(client, '__spa-fallback.html'), resolve(site, '__spa-fallback.html'))
  rmSync(resolve(site, 'assets'), { recursive: true, force: true })
  renameSync(resolve(client, 'assets'), resolve(site, 'assets'))
}
const fallback = resolve(site, '__spa-fallback.html')
if (!existsSync(fallback)) throw new Error('postbuild: no __spa-fallback.html (is "/" still pre-rendered?)')
if (!/"isSpaMode":true/.test(readFileSync(fallback, 'utf8'))) throw new Error('postbuild: __spa-fallback.html is not the SPA fallback')
copyFileSync(fallback, resolve(site, '404.html'))
writeFileSync(resolve(site, '.nojekyll'), '')
writeFileSync(resolve(site, 'sitemap.xml'), sitemapXml(siteOrigin, basePath))
writeFileSync(resolve(site, 'robots.txt'), robotsTxt(siteOrigin, basePath, noIndex))
if (existsSync(resolve(site, 'lab'))) throw new Error('postbuild: lab pages must not be in a production build')
console.log(`postbuild: site laid out at build/client${basePath} (base ${basePath})`)
