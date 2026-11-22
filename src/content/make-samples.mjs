#!/usr/bin/env node
/**
 * Makes the media of the three SAMPLE stories in content/stories/sample-* (part B1 test content, not real stories):
 *   pages/NN.svg                 a painted placeholder picture per page (code-drawn SVG, no words in it)
 *   audio/<lang>/NN.mp3 + .json  a test recording per page: a soft tick at the start of every word, with the word
 *                                timings (WordTiming in src/content/schema.ts). Silence plus ticks: NOT a voice.
 *   film/film.mp4, poster.webp   a short code-drawn sample film (960x540, 24 fps, H.264 + AAC) and its poster frame
 *   film/<lang>.vtt              captions in each language, from the film lines in <lang>.json
 *   activity/step-N.svg (+ .mp4 loops), activity/material-<id>.svg
 * Needs ffmpeg with libx264, libmp3lame and libwebp. Run: node src/content/make-samples.mjs
 * Deterministic: running it again writes the same pictures and timings.
 */
import { spawnSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const ROOT = new URL('../../content/stories/', import.meta.url).pathname
const LANGS = ['ar', 'he', 'en', 'da']
const two = (n) => String(n).padStart(2, '0')
const W = 1200
const H = 1500

/* ── Pictures (SVG) ───────────────────────────────────────────────────────── */

const defs = (sky) => `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset=".45" stop-color="#ffe7a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
  <radialGradient id="shine" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="paint" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .25  0 0 0 .09 0"/></filter>
</defs>`

const svg = (sky, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${defs(sky)}
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<g filter="url(#paint)">${body}</g>
<rect width="${W}" height="${H}" filter="url(#grain)"/>
</svg>`

const hills = (c1, c2, y = 980) => `<path d="M-60 ${y} Q 260 ${y - 150} 620 ${y - 40} T 1260 ${y - 70} V ${H + 60} H -60Z" fill="${c1}"/>
<path d="M-60 ${y + 120} Q 380 ${y - 10} 760 ${y + 90} T 1260 ${y + 60} V ${H + 60} H -60Z" fill="${c2}"/>`
const sun = (x, y, r = 90) => `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="url(#glow)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd98a"/>`
const ball = (x, y, r = 120) => `<ellipse cx="${x}" cy="${y + r * 0.95}" rx="${r * 0.9}" ry="${r * 0.18}" fill="#000" opacity=".13"/><circle cx="${x}" cy="${y}" r="${r}" fill="#c9503c"/><path d="M${x - r} ${y} Q ${x} ${y + r * 0.5} ${x + r} ${y}" stroke="#f4d9c6" stroke-width="${r * 0.12}" fill="none" opacity=".8"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#shine)"/>`
const bush = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="40" rx="260" ry="40" fill="#000" opacity=".1"/><circle cx="-130" cy="-40" r="120" fill="#4f7a4a"/><circle cx="110" cy="-50" r="130" fill="#557f4d"/><circle cx="0" cy="-130" r="150" fill="#62905a"/><circle cx="-20" cy="-20" r="140" fill="#5a8752"/></g>`
const pot = (x, y) => `<ellipse cx="${x}" cy="${y + 175}" rx="200" ry="34" fill="#000" opacity=".12"/><path d="M${x - 170} ${y - 40} L ${x + 170} ${y - 40} L ${x + 130} ${y + 170} L ${x - 130} ${y + 170}Z" fill="#c07650"/><rect x="${x - 190}" y="${y - 80}" width="380" height="70" rx="18" fill="#cd8460"/><ellipse cx="${x}" cy="${y - 78}" rx="168" ry="26" fill="#5d4535"/>`
const sprout = (x, y, h, leaves) => `<path d="M${x} ${y} C ${x - 18} ${y - h * 0.4} ${x + 20} ${y - h * 0.7} ${x} ${y - h}" stroke="#5f9a4f" stroke-width="16" fill="none" stroke-linecap="round"/>${leaves ? `<path d="M${x} ${y - h} C ${x - 130} ${y - h - 90} ${x - 190} ${y - h + 10} ${x - 10} ${y - h + 6}Z" fill="#76b062"/><path d="M${x} ${y - h} C ${x + 130} ${y - h - 90} ${x + 190} ${y - h + 10} ${x + 10} ${y - h + 6}Z" fill="#6aa457"/>` : `<ellipse cx="${x + 8}" cy="${y - h}" rx="22" ry="14" fill="#86bd6d"/>`}`
const block = (x, y, w, h, c = '#d9a066') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c}"/><rect x="${x}" y="${y}" width="${w}" height="${Math.min(18, h / 4)}" rx="8" fill="#fff" opacity=".18"/>`
const car = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-110" y="-70" width="220" height="70" rx="26" fill="#3f6fa6"/><path d="M-60 -70 Q -40 -130 20 -130 Q 70 -130 80 -70Z" fill="#4f82bd"/><rect x="-28" y="-118" width="70" height="40" rx="10" fill="#dfeefa"/><circle cx="-62" cy="4" r="30" fill="#2b2b33"/><circle cx="62" cy="4" r="30" fill="#2b2b33"/><circle cx="-62" cy="4" r="11" fill="#bbb"/><circle cx="62" cy="4" r="11" fill="#bbb"/></g>`
const room = () => `<rect x="0" y="0" width="${W}" height="${H}" fill="#e9e1d6"/><rect x="0" y="860" width="${W}" height="${H - 860}" fill="#cdb79c"/><path d="M60 1120 Q 600 1040 1140 1120 L 1180 1420 Q 600 1500 20 1420Z" fill="#5b7fb0"/><path d="M110 1150 Q 600 1080 1090 1150" stroke="#86a7d1" stroke-width="10" fill="none"/>`
const drop = (x, y, s = 1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -46 C 22 -14 30 4 30 18 A 30 30 0 1 1 -30 18 C -30 4 -22 -14 0 -46Z" fill="#7fb8de"/>`

const ART = {
  'sample-a': {
    sky: ['#cfe4f1', '#eef4ea'],
    pages: [
      () => sun(940, 300) + hills('#a9cf8f', '#8cbd75') + ball(600, 1060, 150),
      () => sun(200, 260, 70) + hills('#a9cf8f', '#8cbd75', 1000) + `<path d="M260 1120 h170 M220 1170 h150 M290 1070 h110" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".8"/>` + ball(620, 1110, 120),
      () => hills('#a9cf8f', '#8cbd75', 960) + bush(620, 1040, 1.15) + `<circle cx="790" cy="1060" r="44" fill="#c9503c"/>`,
      () => sun(980, 240, 70) + hills('#a9cf8f', '#8cbd75', 1000) + bush(520, 1080, 1) + ball(840, 1070, 110),
      () => sun(600, 420, 120) + hills('#a9cf8f', '#8cbd75', 1050) + ball(600, 700, 130) + `<path d="M520 900 q 80 50 160 0" stroke="#fff" stroke-width="12" fill="none" opacity=".7"/>`,
    ],
  },
  'sample-b': {
    sky: ['#f6e7cf', '#f3efe4'],
    pages: [
      () => sun(950, 280, 80) + hills('#c9d6a2', '#b3c58c', 940) + `<path d="M420 ${H} Q 560 1100 640 940 L 700 940 Q 700 1120 860 ${H}Z" fill="#e3cfa8"/><ellipse cx="660" cy="1090" rx="22" ry="15" fill="#7a5a3a"/><circle cx="660" cy="1090" r="70" fill="url(#glow)"/>`,
      () => `<rect x="0" y="0" width="${W}" height="${H}" fill="#efe4d2"/><rect x="0" y="1180" width="${W}" height="80" fill="#d8c3a2"/><rect x="0" y="1260" width="${W}" height="${H}" fill="#c9b08b"/>` + pot(600, 1010),
      () => sun(600, 260, 90) + `<rect x="0" y="1180" width="${W}" height="${H}" fill="#d8c3a2"/>` + pot(600, 1010) + drop(560, 760) + drop(640, 640, 0.8) + drop(600, 520, 0.6),
      () => `<rect x="0" y="0" width="${W}" height="${H}" fill="#efe4d2"/><rect x="0" y="1180" width="${W}" height="${H}" fill="#d8c3a2"/>` + pot(600, 1010) + sprout(600, 932, 70, false),
      () => sun(950, 280, 70) + `<rect x="0" y="1180" width="${W}" height="${H}" fill="#d8c3a2"/>` + pot(600, 1060) + sprout(600, 982, 330, true),
      () => sun(600, 330, 140) + hills('#c9d6a2', '#b3c58c', 1120) + pot(600, 1180) + sprout(600, 1102, 420, true),
    ],
  },
  'sample-c': {
    sky: ['#e9e1d6', '#e9e1d6'],
    pages: [
      () => room() + block(330, 1030, 110, 110) + block(450, 1050, 90, 90, '#c98d55') + block(380, 940, 120, 90, '#e2b07a') + car(800, 1180, 0.9),
      () => room() + block(240, 820, 120, 330) + block(840, 820, 120, 330) + `<g transform="rotate(28 600 1040)">${block(430, 1000, 340, 56, '#e2b07a')}</g>`,
      () => room() + block(370, 820, 120, 330) + block(710, 820, 120, 330) + `<path d="M520 760 l 120 0" stroke="#7a6a5a" stroke-width="10" stroke-linecap="round" stroke-dasharray="4 26"/>`,
      () => room() + block(370, 820, 120, 330) + block(710, 820, 120, 330) + `<g transform="rotate(-9 600 790)">${block(350, 770, 500, 50, '#e2b07a')}${car(560, 770, 0.6)}</g>`,
      () => room() + block(370, 880, 120, 330) + block(710, 880, 120, 330) + block(350, 830, 500, 50, '#e2b07a') + block(350, 776, 500, 50, '#d39a60'),
      () => room() + block(370, 880, 120, 330) + block(710, 880, 120, 330) + block(350, 830, 500, 50, '#e2b07a') + block(350, 776, 500, 50, '#d39a60') + car(620, 770, 0.6),
    ],
  },
}

/* ── Activity pictures ────────────────────────────────────────────────────── */
const person = (x, y, s, shirt, skin = '#e3b48e', hair = '#4a3428') => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="210" rx="150" ry="26" fill="#000" opacity=".1"/><path d="M-110 210 Q -120 40 0 30 Q 120 40 110 210Z" fill="${shirt}"/><circle cx="0" cy="-40" r="80" fill="${skin}"/><path d="M-82 -50 Q -70 -140 10 -128 Q 86 -120 82 -46 Q 40 -100 -82 -50Z" fill="${hair}"/><circle cx="-26" cy="-40" r="7" fill="#2b2b33"/><circle cx="26" cy="-40" r="7" fill="#2b2b33"/><path d="M-20 -6 Q 0 10 20 -6" stroke="#8a4a3a" stroke-width="6" fill="none" stroke-linecap="round"/></g>`
const stepBg = '<rect width="800" height="600" fill="#f4efe6"/><rect y="430" width="800" height="170" fill="#e6dccb"/>'
const stepSvg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">${stepBg}${body}</svg>`
const cup = (x, y, fill = '') => `<path d="M${x - 70} ${y - 120} L ${x + 70} ${y - 120} L ${x + 55} ${y + 60} L ${x - 55} ${y + 60}Z" fill="#dfeef5" stroke="#9cc0d4" stroke-width="6"/>${fill}`
const book = (x, y, c) => `<rect x="${x}" y="${y}" width="190" height="44" rx="6" fill="${c}"/><rect x="${x + 6}" y="${y + 6}" width="178" height="8" fill="#fff" opacity=".5"/>`
const coin = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="10" fill="#c9a24a"/><ellipse cx="${x}" cy="${y - 4}" rx="26" ry="10" fill="#e5c26a"/>`
const STEPS = {
  'sample-a': [
    stepSvg(person(220, 300, 0.95, '#7d9fc4') + person(580, 340, 0.7, '#e0a35a', '#d9a27e', '#2e2420')),
    stepSvg(person(160, 300, 0.95, '#7d9fc4') + person(640, 340, 0.7, '#e0a35a', '#d9a27e', '#2e2420') + `<circle cx="400" cy="470" r="40" fill="#c9503c"/>`),
    stepSvg(person(160, 300, 0.95, '#7d9fc4') + person(640, 340, 0.7, '#e0a35a', '#d9a27e', '#2e2420') + `<circle cx="560" cy="470" r="40" fill="#c9503c"/>`),
  ],
  'sample-b': [
    stepSvg(cup(400, 400, `<rect x="345" y="390" width="110" height="60" rx="26" fill="#fff"/>`) + `<path d="M520 230 q 30 40 0 70" stroke="#7fb8de" stroke-width="8" fill="none"/>`),
    stepSvg(cup(400, 400, `<rect x="345" y="390" width="110" height="60" rx="26" fill="#fff"/><ellipse cx="400" cy="385" rx="30" ry="18" fill="#8a5a3a"/>`) + `<rect x="560" y="80" width="190" height="230" fill="#cfe4f1" stroke="#bba" stroke-width="10"/>`),
    stepSvg(cup(400, 400, `<rect x="345" y="390" width="110" height="60" rx="26" fill="#fff"/><ellipse cx="400" cy="385" rx="30" ry="18" fill="#8a5a3a"/>`) + drop(400, 200, 0.8)),
  ],
  'sample-c': [
    stepSvg(book(150, 386, '#5b7fb0') + book(150, 342, '#c9503c') + book(460, 386, '#6a9a5a') + book(460, 342, '#d9a066')),
    stepSvg(book(150, 386, '#5b7fb0') + book(150, 342, '#c9503c') + book(460, 386, '#6a9a5a') + book(460, 342, '#d9a066') + `<path d="M150 342 Q 400 400 650 342" stroke="#fffdf6" stroke-width="10" fill="none"/>` + coin(400, 360)),
    stepSvg(book(150, 386, '#5b7fb0') + book(150, 342, '#c9503c') + book(460, 386, '#6a9a5a') + book(460, 342, '#d9a066') + `<path d="M160 340 l 30 -24 l 30 24 l 30 -24 l 30 24 l 30 -24 l 30 24 l 30 -24 l 30 24 l 30 -24 l 30 24 l 30 -24 l 30 24 l 30 -24 l 30 24 l 30 -24 l 30 24" stroke="#fffdf6" stroke-width="8" fill="none" stroke-linejoin="round"/>` + coin(330, 312) + coin(400, 312) + coin(470, 312) + coin(400, 300)),
  ],
}
const icon = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="40" fill="#f4efe6"/>${body}</svg>`
const MATERIALS = {
  'soft-ball': icon(`<circle cx="160" cy="165" r="90" fill="#c9503c"/><path d="M70 165 Q 160 215 250 165" stroke="#f4d9c6" stroke-width="12" fill="none"/>`),
  cushions: icon(`<rect x="50" y="150" width="220" height="90" rx="40" fill="#7d9fc4"/><rect x="70" y="90" width="180" height="80" rx="36" fill="#e0a35a"/>`),
  cup: icon(`<path d="M100 70 L 220 70 L 205 250 L 115 250Z" fill="#dfeef5" stroke="#9cc0d4" stroke-width="8"/>`),
  cotton: icon(`<circle cx="130" cy="170" r="50" fill="#fff"/><circle cx="185" cy="160" r="56" fill="#fff"/><circle cx="160" cy="200" r="50" fill="#fdfdfd"/>`),
  bean: icon(`<ellipse cx="160" cy="165" rx="80" ry="52" fill="#8a5a3a" transform="rotate(-20 160 165)"/>`),
  water: icon(drop(160, 170, 2.2)),
  paper: icon(`<rect x="80" y="60" width="160" height="210" fill="#fffdf6" stroke="#d6cfc2" stroke-width="6"/>`),
  books: icon(book(65, 200, '#5b7fb0') + book(65, 156, '#c9503c') + book(65, 112, '#d9a066')),
  coins: icon(coin(120, 200) + coin(190, 190) + coin(155, 150)),
}

/* ── Raster frames for films and loops (tiny anti-aliased painter) ─────────── */
function canvas(w, h) {
  const px = Buffer.alloc(w * h * 3)
  const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  const blend = (i, [r, g, b], a) => {
    px[i] += (r - px[i]) * a
    px[i + 1] += (g - px[i + 1]) * a
    px[i + 2] += (b - px[i + 2]) * a
  }
  return {
    px,
    vgrad(top, bottom, y0 = 0, y1 = h) {
      const a = hex(top)
      const b = hex(bottom)
      for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, y1); y++) {
        const t = (y - y0) / Math.max(1, y1 - y0)
        const c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 3
          px[i] = c[0]
          px[i + 1] = c[1]
          px[i + 2] = c[2]
        }
      }
    },
    ellipse(cx, cy, rx, ry, color, alpha = 1) {
      const c = hex(color)
      for (let y = Math.max(0, Math.floor(cy - ry - 1)); y <= Math.min(h - 1, Math.ceil(cy + ry + 1)); y++)
        for (let x = Math.max(0, Math.floor(cx - rx - 1)); x <= Math.min(w - 1, Math.ceil(cx + rx + 1)); x++) {
          const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry)
          const a = Math.min(1, Math.max(0, (1 - d) * Math.min(rx, ry) + 0.5))
          if (a > 0) blend((y * w + x) * 3, c, a * alpha)
        }
    },
    rect(x0, y0, rw, rh, color, alpha = 1) {
      const c = hex(color)
      for (let y = Math.max(0, Math.round(y0)); y < Math.min(h, Math.round(y0 + rh)); y++)
        for (let x = Math.max(0, Math.round(x0)); x < Math.min(w, Math.round(x0 + rw)); x++) blend((y * w + x) * 3, c, alpha)
    },
    hill(baseY, amp, phase, color) {
      const c = hex(color)
      for (let x = 0; x < w; x++) {
        const top = baseY - amp * Math.sin((x / w) * Math.PI * 1.3 + phase)
        for (let y = Math.max(0, Math.floor(top)); y < h; y++) blend((y * w + x) * 3, c, y === Math.floor(top) ? 1 - (top % 1) : 1)
      }
    },
  }
}
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))

const FILM = {
  'sample-a': {
    seconds: 18,
    draw(g, t, w, h) {
      g.vgrad('#cfe4f1', '#eef4ea', 0, h)
      g.ellipse(w * 0.8, h * 0.2, 46, 46, '#ffd98a')
      g.hill(h * 0.66, 40, 0.3, '#a9cf8f')
      g.hill(h * 0.76, 30, 1.6, '#8cbd75')
      const bushX = w * 0.62
      let x
      let y = h * 0.78
      if (t < 6) x = -60 + ease(t / 5) * (w * 0.4)
      else if (t < 12) x = w * 0.4 + ease((t - 6) / 4) * (bushX - w * 0.4 + 30)
      else {
        x = bushX + 30 + ease((t - 12) / 3) * 150
        y = h * 0.78 - Math.abs(Math.sin((t - 12) * 3.2)) * 120 * Math.max(0, 1 - (t - 12) / 7)
      }
      g.ellipse(x, h * 0.78 + 40, 48, 9, '#3a5a30', 0.25)
      g.ellipse(x, y, 42, 42, '#c9503c')
      g.ellipse(x - 12, y - 14, 14, 10, '#ffffff', 0.35)
      g.ellipse(bushX, h * 0.75, 90, 70, '#5a8752')
      g.ellipse(bushX - 60, h * 0.78, 70, 52, '#4f7a4a')
      g.ellipse(bushX + 64, h * 0.78, 70, 50, '#557f4d')
    },
    ticks: [5, 11.5, 13, 14.4, 15.6],
  },
  'sample-b': {
    seconds: 21,
    draw(g, t, w, h) {
      g.vgrad('#f6e7cf', '#f3efe4', 0, h)
      g.ellipse(w * 0.15, h * 0.18, 40, 40, '#ffd98a')
      g.rect(0, h * 0.82, w, h * 0.18, '#d8c3a2')
      const px = w / 2
      const py = h * 0.7
      g.rect(px - 110, py - 40, 220, 34, '#cd8460')
      g.rect(px - 95, py - 6, 190, 90, '#c07650')
      g.ellipse(px, py - 40, 104, 14, '#5d4535')
      if (t < 6) {
        const sy = -20 + ease(t / 4) * (py - 40 + 20)
        g.ellipse(px, sy, 11, 8, '#7a5a3a')
      }
      if (t >= 6 && t < 12) for (let k = 0; k < 3; k++) {
        const ty = ((t - 6 + k * 0.7) % 2) / 2
        g.ellipse(px - 20 + k * 20, 40 + ty * (py - 90), 9, 13, '#7fb8de', 1 - ty * 0.4)
      }
      if (t >= 11) {
        const grow = ease((t - 11) / 6)
        const top = py - 42 - grow * 160
        g.rect(px - 4, top, 8, py - 42 - top, '#5f9a4f')
        if (grow > 0.6) {
          const leaf = ease((grow - 0.6) / 0.4)
          g.ellipse(px - 34 * leaf, top + 6, 36 * leaf + 1, 14 * leaf + 1, '#76b062')
          g.ellipse(px + 34 * leaf, top + 6, 36 * leaf + 1, 14 * leaf + 1, '#6aa457')
        }
      }
    },
    ticks: [4, 6.5, 7.2, 8.6, 9.4, 17],
  },
  'sample-c': {
    seconds: 21,
    draw(g, t, w, h) {
      g.vgrad('#e9e1d6', '#e3d9cb', 0, h * 0.6)
      g.rect(0, h * 0.6, w, h * 0.4, '#cdb79c')
      g.ellipse(w / 2, h * 0.86, w * 0.46, h * 0.1, '#5b7fb0')
      const near = t < 7 ? 0 : ease((t - 7) / 2)
      const lx = w * 0.26 + near * w * 0.1
      const rx = w * 0.66 - near * w * 0.1
      g.rect(lx, h * 0.5, 70, h * 0.3, '#d9a066')
      g.rect(rx, h * 0.5, 70, h * 0.3, '#d9a066')
      if (t < 7) {
        const fall = ease((t - 2) / 1.2)
        g.rect(w * 0.36, h * 0.46 + fall * h * 0.34, w * 0.28, 22, '#e2b07a')
      } else {
        g.rect(lx - 10, h * 0.46, rx + 80 - lx, 22, '#e2b07a')
        const second = ease((t - 9.5) / 1.5)
        if (t > 9.5) g.rect(lx - 10 - (1 - second) * w * 0.5, h * 0.46 + 22, rx + 80 - lx, 22, '#d39a60')
        if (t > 13) {
          const cx = lx - 60 + ease((t - 13) / 6) * (rx - lx + 160)
          const cy = h * 0.46 - 26
          g.rect(cx - 50, cy - 18, 100, 30, '#3f6fa6')
          g.rect(cx - 22, cy - 36, 50, 20, '#4f82bd')
          g.ellipse(cx - 28, cy + 14, 13, 13, '#2b2b33')
          g.ellipse(cx + 28, cy + 14, 13, 13, '#2b2b33')
        }
      }
    },
    ticks: [3.2, 9.6, 10.8, 13.2, 19],
  },
}

const LOOPS = {
  'sample-a': {
    2: (g, t, w, h) => { loopBg(g, w, h); stick(g, w * 0.2, h, '#7d9fc4', 1); stick(g, w * 0.8, h, '#e0a35a', 0.75); g.ellipse(w * 0.28 + ease(t) * w * 0.44, h * 0.8, 20, 20, '#c9503c') },
    3: (g, t, w, h) => { loopBg(g, w, h); stick(g, w * 0.2, h, '#7d9fc4', 1); stick(g, w * 0.8, h, '#e0a35a', 0.75); g.ellipse(w * 0.72 - ease(t) * w * 0.44, h * 0.8, 20, 20, '#c9503c') },
  },
  'sample-b': {
    3: (g, t, w, h) => { loopBg(g, w, h); g.rect(w * 0.4, h * 0.5, w * 0.2, h * 0.32, '#dfeef5'); g.rect(w * 0.42, h * 0.62, w * 0.16, h * 0.1, '#ffffff'); g.ellipse(w * 0.5, h * 0.62, 14, 9, '#8a5a3a'); g.ellipse(w * 0.5, h * 0.1 + ease(t) * h * 0.48, 9, 13, '#7fb8de', 1 - t * 0.5) },
  },
  'sample-c': {
    3: (g, t, w, h) => { loopBg(g, w, h); g.rect(w * 0.12, h * 0.6, w * 0.22, h * 0.2, '#5b7fb0'); g.rect(w * 0.66, h * 0.6, w * 0.22, h * 0.2, '#6a9a5a'); for (let k = 0; k < 9; k++) g.rect(w * 0.16 + k * w * 0.075, h * 0.555 + (k % 2) * 10, w * 0.075, 6, '#fffdf6'); g.ellipse(w * 0.5, h * 0.2 + ease(t) * h * 0.32, 18, 7, '#e5c26a') },
  },
}
function loopBg(g, w, h) {
  g.vgrad('#f4efe6', '#efe8dc', 0, h)
  g.rect(0, h * 0.82, w, h * 0.18, '#e6dccb')
}
function stick(g, x, h, color, s) {
  g.ellipse(x, h * 0.82 - 70 * s, 40 * s, 62 * s, color)
  g.ellipse(x, h * 0.82 - 150 * s, 30 * s, 30 * s, '#e3b48e')
}

function encode(frames, w, h, fps, draw, out, audioWav, extra = []) {
  const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-r', String(fps), '-i', '-']
  if (audioWav) args.push('-i', audioWav)
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart')
  if (audioWav) args.push('-c:a', 'aac', '-b:a', '64k', '-shortest')
  else args.push('-an')
  args.push(...extra, out)
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] })
    ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code} for ${out}`))))
    let i = 0
    const pump = () => {
      while (i < frames) {
        const g = canvas(w, h)
        draw(g, i / fps, w, h)
        i++
        if (!ff.stdin.write(g.px)) return void ff.stdin.once('drain', pump)
      }
      ff.stdin.end()
    }
    pump()
  })
}

/* ── Sound: soft ticks over silence ───────────────────────────────────────── */
const RATE = 22050
function wav(seconds, ticks, freq = 620, gain = 0.16) {
  const n = Math.ceil(seconds * RATE)
  const data = new Int16Array(n)
  ticks.forEach((at, k) => {
    const f = freq * (k % 2 ? 1.25 : 1)
    const start = Math.floor(at * RATE)
    for (let i = 0; i < 0.09 * RATE && start + i < n; i++) {
      const env = Math.sin(Math.PI * Math.min(1, i / (0.09 * RATE)))
      data[start + i] += Math.round(Math.sin((2 * Math.PI * f * i) / RATE) * env * gain * 32767)
    }
  })
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVEfmt ', 8)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22)
  buf.writeUInt32LE(RATE, 24)
  buf.writeUInt32LE(RATE * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  Buffer.from(data.buffer).copy(buf, 44)
  return buf
}

/** Word timings for a test recording: a pause, then each word for a time that grows with its length. */
function timingFor(text) {
  const words = text.split(/\s+/).filter(Boolean)
  let t = 0.4
  const out = []
  for (const word of words) {
    const letters = word.replace(/[ً-ْ֑-ׇ]/g, '').replace(/[^\p{L}\p{N}]/gu, '').length
    const d = 0.26 + 0.05 * letters + (/[.!?؟,،»«“”]$/.test(word) ? 0.18 : 0)
    out.push([Math.round(t * 100) / 100, Math.round((t + d) * 100) / 100])
    t += d + 0.06
  }
  return { duration: Math.round((t + 0.5) * 100) / 100, words: out }
}

const vttTime = (s) => {
  const ms = Math.round(s * 1000)
  const hh = String(Math.floor(ms / 3600000)).padStart(2, '0')
  const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
  const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  return `${hh}:${mm}:${ss}.${String(ms % 1000).padStart(3, '0')}`
}

/* ── Run ──────────────────────────────────────────────────────────────────── */
const tmp = join(tmpdir(), `storytime-samples-${process.pid}`)
mkdirSync(tmp, { recursive: true })
for (const id of Object.keys(ART)) {
  const dir = join(ROOT, id)
  const story = JSON.parse(readFileSync(join(dir, 'story.json'), 'utf8'))
  const langs = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8'))]))
  for (const sub of ['pages', 'film', 'activity', ...LANGS.map((l) => `audio/${l}`)]) mkdirSync(join(dir, sub), { recursive: true })

  ART[id].pages.forEach((draw, i) => writeFileSync(join(dir, 'pages', `${two(i + 1)}.svg`), svg(ART[id].sky, draw())))

  for (const lang of LANGS) {
    for (const p of langs[lang].pages) {
      const timing = timingFor(p.text)
      const w = join(tmp, `${id}-${lang}-${p.n}.wav`)
      writeFileSync(w, wav(timing.duration, timing.words.map(([s]) => s)))
      const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', w, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '32k', join(dir, 'audio', lang, `${two(p.n)}.mp3`)])
      if (r.status !== 0) throw new Error(String(r.stderr))
      writeFileSync(join(dir, 'audio', lang, `${two(p.n)}.json`), `${JSON.stringify(timing)}\n`)
    }
  }

  // Film: frames, ticks for sound, captions spread over the shots (each line gets an equal share of its shot).
  const f = FILM[id]
  const fw = join(tmp, `${id}-film.wav`)
  writeFileSync(fw, wav(f.seconds, f.ticks, 330, 0.22))
  await encode(f.seconds * 24, 960, 540, 24, f.draw, join(dir, 'film', 'film.mp4'), fw)
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '2', '-i', join(dir, 'film', 'film.mp4'), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '80', join(dir, 'film', 'poster.webp')])
  const shotLen = f.seconds / story.film.shots.length
  for (const lang of LANGS) {
    const cues = []
    story.film.shots.forEach((shot, s) => {
      const per = shotLen / shot.lines.length
      shot.lines.forEach((lineId, k) => {
        const line = langs[lang].film.find((x) => x.id === lineId)
        const start = s * shotLen + k * per + 0.4
        cues.push(`${cues.length + 1}\n${vttTime(start)} --> ${vttTime(start + per - 0.6)}\n${line.text}\n`)
      })
    })
    writeFileSync(join(dir, 'film', `${lang}.vtt`), `WEBVTT\n\n${cues.join('\n')}`)
  }

  // Activity: still per step, loop clips for steps marked loop, a picture per material.
  STEPS[id].forEach((s, i) => writeFileSync(join(dir, 'activity', `step-${i + 1}.svg`), s))
  for (const [n, draw] of Object.entries(LOOPS[id] ?? {})) {
    await encode(48, 480, 360, 24, (g, t, w, h) => draw(g, (t % 2) / 2, w, h), join(dir, 'activity', `step-${n}.mp4`), null)
  }
  for (const m of story.activity.materials) writeFileSync(join(dir, 'activity', `material-${m}.svg`), MATERIALS[m])
  console.log(`${id}: done`)
}
rmSync(tmp, { recursive: true, force: true })
