import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE ?? '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  assetsInclude: ['**/*.hdr'],
  server: { host: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    // three.js / R3F are only ever imported dynamically (after the hero paints) — never preload them from the HTML.
    modulePreload: { resolveDependencies: (_file, deps) => deps.filter((d) => !/\/(three|r3f|Scene|HeroView|ShelfView|coverAtlas)-/.test(d)) },
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/](three|three-stdlib)[\\/]/, priority: 20 },
            { name: 'r3f', test: /node_modules[\\/]@react-three[\\/]/, priority: 15 },
            { name: 'gsap', test: /node_modules[\\/]gsap[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
