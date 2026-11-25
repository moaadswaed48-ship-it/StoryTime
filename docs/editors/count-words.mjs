// Counts the words a native editor has to read, per language. Plain Node, no packages; reads only project files.
//   node docs/editors/count-words.mjs            (prints a table)
// Stories: the 45 folders content/stories/a01..c15 (samples and the author's story are not counted).
// Site text: string literals in src/i18n/<lang>/landing.ts, src/emails/copy/<lang>.ts, src/i18n/<lang>/legal.ts and
// the other src/i18n/<lang>/*.ts files (buttons, menus, account pages). Counting words inside code is approximate.
import { readFileSync, readdirSync, existsSync } from 'node:fs'

const LANGS = ['ar', 'he', 'en', 'da']
const words = (s) => (typeof s === 'string' ? s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0)
const deep = (v) => (typeof v === 'string' ? words(v) : Array.isArray(v) ? v.reduce((a, x) => a + deep(x), 0)
  : v && typeof v === 'object' ? Object.values(v).reduce((a, x) => a + deep(x), 0) : 0)

const ids = readdirSync('content/stories').filter((d) => /^[abc]\d\d$/.test(d)).sort()
const scriptOf = { ar: /[؀-ۿ]/, he: /[֐-׿]/, en: /[A-Za-z]/, da: /[A-Za-zÆØÅæøå]/ }
function codeWords(file, lang) {
  if (!existsSync(file)) return 0
  const src = readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  let n = 0
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    const s = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\$\{[^}]*\}/g, ' ')
    if (!scriptOf[lang].test(s)) continue
    if (/^[\w./:@-]+$/.test(s)) continue // identifiers, paths, keys
    n += words(s)
  }
  return n
}

const rows = []
for (const lang of LANGS) {
  let book = 0, film = 0, activity = 0, titles = 0, pages = 0, lines = 0
  for (const id of ids) {
    const d = JSON.parse(readFileSync(`content/stories/${id}/${lang}.json`, 'utf8'))
    titles += words(d.title) + deep(d.names)
    for (const p of d.pages) { book += words(p.text); pages++ }
    for (const f of d.film) { film += words(f.text); lines++ }
    activity += deep(d.activity)
  }
  const landing = codeWords(`src/i18n/${lang}/landing.ts`, lang)
  const emails = codeWords(`src/emails/copy/${lang}.ts`, lang)
  const legal = codeWords(`src/i18n/${lang}/legal.ts`, lang)
  let ui = 0
  for (const f of readdirSync(`src/i18n/${lang}`)) if (!['landing.ts', 'legal.ts'].includes(f)) ui += codeWords(`src/i18n/${lang}/${f}`, lang)
  rows.push({ lang, stories: ids.length, pages, lines, titles, book, film, activity, landing, emails, legal, ui })
}
const cols = ['lang', 'stories', 'pages', 'lines', 'titles', 'book', 'film', 'activity', 'landing', 'emails', 'legal', 'ui']
console.log(`| ${cols.join(' | ')} | story total | all |`)
console.log(`|${cols.map(() => '---').join('|')}|---|---|`)
for (const r of rows) {
  const st = r.titles + r.book + r.film + r.activity
  console.log(`| ${cols.map((c) => r[c]).join(' | ')} | ${st} | ${st + r.landing + r.emails + r.legal + r.ui} |`)
}
