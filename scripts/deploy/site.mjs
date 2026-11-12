// Builds the site for static hosting (GitHub Pages or any plain file host) and copies it to a folder.
//   node scripts/deploy/site.mjs --out=<folder>
// The build uses relative addresses (VITE_BASE=./), so it works from any path. The trailers are left out:
// they are files to send, not part of the site.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const out = resolve((process.argv.find((a) => a.startsWith('--out=')) ?? '').slice(6) || 'site')
execFileSync('npx', ['vite', 'build'], { stdio: 'inherit', env: { ...process.env, VITE_BASE: './' } })
mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (f !== '.git') rmSync(resolve(out, f), { recursive: true, force: true })
cpSync('dist', out, { recursive: true, filter: (src) => !/film[\\/]trailer-/.test(src) })
writeFileSync(resolve(out, '.nojekyll'), '') // serve the files as they are
const size = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((a, f) => a + size(resolve(p, f)), 0) : statSync(p).size)
console.log(`site → ${out} · ${(size(out) / 1e6).toFixed(1)} MB · index.html ${existsSync(resolve(out, 'index.html')) ? 'ok' : 'MISSING'}`)
