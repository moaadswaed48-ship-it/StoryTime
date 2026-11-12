// Builds the site for static hosting (GitHub Pages or any plain file host) and copies it to a folder.
//   node scripts/deploy/site.mjs --out=<folder> [--url=https://…/]
// The build uses relative addresses (VITE_BASE=./), so it works from any path. The trailers are left out:
// they are files to send, not part of the site.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const out = resolve((process.argv.find((a) => a.startsWith('--out=')) ?? '').slice(6) || 'site')
// The public address goes into the link-preview tags: WhatsApp only shows the picture when it has a full address.
const url = (process.argv.find((a) => a.startsWith('--url=')) ?? '').slice(6) || 'https://moaadswaed48-ship-it.github.io/StoryTime/'
// never publish a build that does not type-check
execFileSync('npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit'], { stdio: 'inherit', shell: process.platform === 'win32' })
execFileSync('npx', ['vite', 'build'], { stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, VITE_BASE: './', VITE_SITE_URL: url } })
mkdirSync(out, { recursive: true })
// everything but the git folder is replaced: no old copy (like the former b/) stays online
for (const f of readdirSync(out)) if (f !== '.git') rmSync(resolve(out, f), { recursive: true, force: true })
cpSync('dist', out, { recursive: true, filter: (src) => !/film[\\/]trailer-/.test(src) })
writeFileSync(resolve(out, '.nojekyll'), '') // serve the files as they are
const size = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((a, f) => a + size(resolve(p, f)), 0) : statSync(p).size)
console.log(`site → ${out} · ${(size(out) / 1e6).toFixed(1)} MB · index.html ${existsSync(resolve(out, 'index.html')) ? 'ok' : 'MISSING'}`)
