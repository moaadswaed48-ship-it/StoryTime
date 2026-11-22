// Serves the built site (build/client) the way a static host would, for `npm run preview` and the e2e tests.
//   node scripts/serve.mjs [--port=4173]
// A folder URL without its slash redirects to it (as GitHub Pages and Cloudflare do); an unknown URL under the base
// path gets the SPA fallback, which opens client-only pages such as /ar/app/library.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { basePath } from '../site.config.ts'

const root = resolve(import.meta.dirname, '../build/client')
const port = Number(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? process.env.PORT ?? 4173)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.data': 'text/x-script', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain' }

if (!existsSync(root)) throw new Error('build/client is missing: run npm run build first')

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  const path = decodeURIComponent(url.pathname)
  if (path === '/' && basePath !== '/') return void res.writeHead(302, { location: basePath }).end()
  let file = resolve(root, '.' + path)
  if (!file.startsWith(root + sep) && file !== root) return void res.writeHead(403).end()
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) return void res.writeHead(301, { location: path + '/' + url.search }).end()
    file = resolve(file, 'index.html')
  }
  let status = 200
  if (!existsSync(file)) {
    file = resolve(root, '.' + basePath, '__spa-fallback.html')
    if (!path.startsWith(basePath) || extname(path)) status = 404
  }
  res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
  createReadStream(file).pipe(res)
}).listen(port, () => console.log(`serving build/client at http://localhost:${port}${basePath}`))
