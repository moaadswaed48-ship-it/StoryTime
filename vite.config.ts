import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE ?? '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true },
  // Pre-bundle everything a feature may import so the shared dev server never reloads mid-session.
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client', 'zustand', 'clsx', 'lucide-react', 'lenis', 'lenis/react',
      'gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'gsap/Flip', 'gsap/Draggable', 'gsap/Observer', 'gsap/InertiaPlugin', '@gsap/react',
      'three', 'three/examples/jsm/utils/SkeletonUtils.js', '@react-three/fiber', '@react-three/drei', 'maath', 'maath/easing', '@use-gesture/react',
    ],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    // three.js / R3F are only imported by lazily mounted 3D features — never preload them from the HTML.
    modulePreload: { resolveDependencies: (_file, deps) => deps.filter((d) => !/\/(three|r3f)-/.test(d)) },
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
