// Publishes the hidden test preview to GitHub Pages: https://moaadswaed48-ship-it.github.io/StoryTime/next/
//
//   node scripts/deploy/preview.mjs            build, lay out, commit next/ on gh-pages and push
//   node scripts/deploy/preview.mjs --no-push  build and lay out into the gh-pages worktree only (to check first)
//
// What it does:
//  1. Builds with BASE_PATH=/StoryTime/next/, SITE_ORIGIN=https://moaadswaed48-ship-it.github.io, NOINDEX=1 and the
//     local test-mode data layer (the VITE_SUPABASE_* variables are removed, so the test-mode banner shows).
//  2. Adds next/robots.txt (disallow all; advisory, the root robots.txt belongs to the old site) and makes app URLs
//     open directly: GitHub Pages serves only the site-root 404.html (the old site's), so the SPA fallback is written
//     as index.html into every client-only route folder, for all four languages and every known story id.
//  3. Replaces only the next/ folder of the gh-pages branch (in a separate git worktree, so the main checkout's
//     branch is never switched), commits it and pushes. Nothing else on gh-pages is touched.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repo = resolve(import.meta.dirname, '../..')
const BASE = '/StoryTime/next/'
const ORIGIN = 'https://moaadswaed48-ship-it.github.io'
const LANGS = ['ar', 'he', 'en', 'da']
const push = !process.argv.includes('--no-push')
const worktree = process.env.PAGES_WORKTREE ?? join(tmpdir(), 'storytime-gh-pages')
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: repo, stdio: 'inherit', ...opts })
const git = (args, cwd = worktree) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

// 1. Build.
const env = { ...process.env, BASE_PATH: BASE, SITE_ORIGIN: ORIGIN, NOINDEX: '1', NODE_ENV: 'production' }
for (const k of Object.keys(env)) if (k.startsWith('VITE_SUPABASE')) delete env[k]
delete env.LAB
run('npm', ['run', 'build'], { env })
const out = resolve(repo, 'build/client' + BASE)
const fallback = readFileSync(join(out, '__spa-fallback.html'), 'utf8')

// 2. robots.txt and the client-only route folders.
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
const storyIds = new Set()
for (const d of readdirSync(resolve(repo, 'content/stories'))) if (existsSync(resolve(repo, 'content/stories', d, 'story.json'))) storyIds.add(d)
for (const m of readFileSync(resolve(repo, 'src/data/local/seed.ts'), 'utf8').matchAll(/make\('(\d-\d)', (\d+)/g)) storyIds.add(`story-sample-${m[1].replace('-', '')}-${m[2]}`)
const appRoutes = ['', 'welcome', 'library', 'collections', 'collections/stories', 'collections/films', 'collections/activities',
  'settings', 'owner', 'owner/dashboard', 'owner/changes', 'plans', 'checkout', 'checkout/done', 'test-pay']
for (const id of storyIds) for (const sub of ['', '/read', '/watch', '/do']) appRoutes.push(`story/${id}${sub}`)
const clientRoutes = [...appRoutes.map((r) => `app/${r}`), 'auth/check-email', 'auth/confirm', 'auth/reset', 'auth/deleted']
let written = 0
for (const lang of LANGS) {
  for (const r of clientRoutes) {
    const dir = join(out, lang, r)
    if (existsSync(join(dir, 'index.html'))) continue // a pre-rendered page stays as it is
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), fallback)
    written++
  }
}
// Every page must carry the preview robots tag.
const html = []
const walk = (d) => { for (const f of readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(join(d, f.name)) : f.name.endsWith('.html') && html.push(join(d, f.name)) }
walk(out)
const bare = html.filter((f) => !readFileSync(f, 'utf8').includes('<meta name="robots" content="noindex, nofollow"/>'))
if (bare.length) throw new Error(`preview: pages without the noindex tag:\n${bare.join('\n')}`)
console.log(`preview: ${html.length} pages, ${written} app route folders, ${storyIds.size} story ids, all noindex`)

// 3. Copy into next/ on gh-pages and publish.
git(['fetch', 'origin', 'gh-pages'], repo)
if (!existsSync(join(worktree, '.git'))) git(['worktree', 'add', '--detach', worktree, 'origin/gh-pages'], repo)
else git(['checkout', '--detach', 'origin/gh-pages'])
const next = join(worktree, 'next')
rmSync(next, { recursive: true, force: true })
cpSync(out, next, { recursive: true })
git(['add', '--all', '--', 'next'])
const changed = git(['diff', '--cached', '--name-only'])
if (changed.split('\n').some((f) => f && !f.startsWith('next/'))) throw new Error('preview: a change outside next/ was staged; stopping')
if (!changed) { console.log('preview: nothing changed'); process.exit(0) }
const head = git(['rev-parse', '--short', 'HEAD'], repo)
git(['commit', '-q', '-m', `Preview: new site in next/ (built from ${head})`, '--', 'next'])
if (!push) { console.log(`preview: committed in ${worktree}, not pushed (--no-push)`); process.exit(0) }
for (let i = 0; ; i++) {
  try { git(['push', 'origin', 'HEAD:gh-pages']); break } catch (e) {
    if (i === 3) throw e
    const wait = 2 ** (i + 1)
    console.log(`preview: push failed, retrying in ${wait}s`)
    execFileSync('sleep', [String(wait)])
  }
}
console.log(`preview: pushed. Live in a minute or two at ${ORIGIN}${BASE}`)
