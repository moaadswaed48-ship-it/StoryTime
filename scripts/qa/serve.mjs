// Starts `vite preview` on 4173 (unless already up) and resolves when it answers. Returns a stop() function.
import { spawn } from 'node:child_process'
export const BASE = process.env.QA_URL ?? 'http://localhost:4173/'
export async function ensureServer() {
  if (await up()) return { stop() {} }
  const child = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', '4173', '--strictPort'], { stdio: 'ignore', detached: true })
  for (let i = 0; i < 100; i++) {
    if (await up()) break
    await new Promise((r) => setTimeout(r, 200))
  }
  if (!(await up())) throw new Error('preview server did not start on 4173')
  return { stop: () => { try { process.kill(-child.pid, 'SIGTERM') } catch {} } }
}
async function up() {
  try { const r = await fetch(BASE, { method: 'GET' }); return r.ok } catch { return false }
}
