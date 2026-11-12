import { defineConfig, type Plugin } from 'vite'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.glb': 'model/gltf-binary',
  '.json': 'application/json',
  '.wav': 'audio/wav',
}

/**
 * The studio reads the website's own media without copying it:
 *   /site/…   → ../public/…        (paintings, cover, Sari model)
 *   /cache/…  → ./.cache/…         (clip frames extracted by scripts/prepare.mjs)
 */
function mounts(): Plugin {
  const roots: Record<string, string> = {
    '/site/': resolve(import.meta.dirname, '../public'),
    '/cache/': resolve(import.meta.dirname, '.cache'),
  }
  return {
    name: 'storytime-mounts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        for (const [prefix, root] of Object.entries(roots)) {
          if (!url.startsWith(prefix)) continue
          const file = normalize(join(root, url.slice(prefix.length)))
          if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) break
          res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
          res.setHeader('Cache-Control', 'max-age=3600')
          createReadStream(file).pipe(res)
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [mounts()],
  server: { host: '127.0.0.1', port: 5180, strictPort: false, fs: { allow: [resolve(import.meta.dirname, '..')] } },
  logLevel: 'warn',
})
