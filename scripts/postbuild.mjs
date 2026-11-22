// After `react-router build`: make the static output ready for a plain file host.
//  - 404.html: a copy of the SPA fallback, so a host that serves 404.html for unknown paths (GitHub Pages)
//    still opens client-only pages such as /ar/app/library.
//  - .nojekyll: GitHub Pages would otherwise hide files whose names start with "_" (the SPA fallback).
import { copyFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const out = resolve(import.meta.dirname, '../build/client')
const fallback = ['__spa-fallback.html', 'index.html'].map((f) => resolve(out, f)).find(existsSync)
if (!fallback) throw new Error('postbuild: no SPA fallback found in build/client')
copyFileSync(fallback, resolve(out, '404.html'))
writeFileSync(resolve(out, '.nojekyll'), '')
if (existsSync(resolve(out, 'lab'))) throw new Error('postbuild: lab pages must not be in a production build')
console.log(`postbuild: 404.html from ${fallback.split('/').pop()}, .nojekyll written; top level:`, readdirSync(out).join(' '))
