/**
 * Serves the stand-alone 3D hero page (scripts/hero/harness.html) with Vite.
 *   node scripts/hero/serve.mjs [port]      → http://127.0.0.1:5184/scripts/hero/harness.html
 * Exports `startHarness` for the other hero scripts.
 */
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../..', import.meta.url))

export async function startHarness(port = 5184) {
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [tailwindcss()],
    resolve: { alias: { '@': `${root}src`, '~content': `${root}content` } },
    define: { __SITE_ORIGIN__: JSON.stringify('http://localhost'), __NOINDEX__: 'true' },
    server: { host: '127.0.0.1', port, strictPort: false },
    appType: 'mpa',
  })
  await server.listen()
  const address = server.httpServer.address()
  return { server, url: `http://127.0.0.1:${address.port}/scripts/hero/harness.html` }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startHarness(Number(process.argv[2]) || 5184)
  console.log(url)
}
