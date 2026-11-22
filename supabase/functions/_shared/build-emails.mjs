// Builds supabase/functions/_shared/emails.mjs from src/emails/server.ts: one self-contained ES module (React,
// React Email, the four languages) that the edge functions import. Run with `npm run emails:bundle` before
// deploying the email functions; the output is generated, do not edit it by hand.
//
// It resolves packages with the browser/worker conditions, because Supabase edge functions run on Deno with web
// APIs (ReadableStream, fetch, WebCrypto), not on Node.
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const root = fileURLToPath(new URL('../../../', import.meta.url))

await build({
  configFile: false,
  root,
  logLevel: 'warn',
  resolve: {
    alias: { '@': `${root}src` },
    conditions: ['worker', 'browser', 'module', 'import', 'default'],
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: fileURLToPath(new URL('./', import.meta.url)),
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    lib: { entry: `${root}src/emails/server.ts`, formats: ['es'], fileName: () => 'emails.mjs' },
    rollupOptions: { output: { codeSplitting: false } },
  },
})
console.log('wrote supabase/functions/_shared/emails.mjs')
