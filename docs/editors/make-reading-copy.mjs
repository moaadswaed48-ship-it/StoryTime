// Writes one reading copy per language for the native editors: docs/editors/reading-copy/<lang>.md
// It holds every line they are asked to read, each with the reference to quote in the corrections table:
// the 45 stories (book pages, film lines, activity), then the landing page, the emails and the legal drafts.
// Plain Node 22 (it loads the TypeScript word files directly; type-only imports are stripped). Reads project files only.
//   node docs/editors/make-reading-copy.mjs            (all four languages)
// Run it again just before sending the files, so the copy matches the current texts.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const LANGS = ['ar', 'he', 'en', 'da']
const L = {
  ar: { dir: 'rtl', book: 'الكتاب', film: 'الفيلم', act: 'النشاط', voice: 'للصوت (التشكيل الكامل)', screen: 'على الشاشة',
    landing: 'الصفحة الرئيسية', emails: 'الرسائل الإلكترونية', legal: 'المسوّدات القانونية (للصياغة فقط)', age: 'الفئة العمرية' },
  he: { dir: 'rtl', book: 'הספר', film: 'הסרט', act: 'הפעילות', voice: 'לקול (שכבת הדיבור)', screen: 'על המסך',
    landing: 'דף הבית', emails: 'הודעות הדוא״ל', legal: 'טיוטות משפטיות (לניסוח בלבד)', age: 'קבוצת גיל' },
  en: { dir: 'ltr', book: 'Book', film: 'Film', act: 'Activity', voice: 'Voice form', screen: 'On screen',
    landing: 'Landing page', emails: 'Emails', legal: 'Legal drafts (wording only)', age: 'Age group' },
  da: { dir: 'ltr', book: 'Bogen', film: 'Filmen', act: 'Aktiviteten', voice: 'Til stemmen', screen: 'På skærmen',
    landing: 'Forsiden', emails: 'E-mails', legal: 'Juridiske udkast (kun sproget)', age: 'Aldersgruppe' },
}

const ids = readdirSync('content/stories').filter((d) => /^[abc]\d\d$/.test(d)).sort()

function flatten(obj, prefix = '', out = []) {
  if (typeof obj === 'string') out.push([prefix, obj])
  else if (Array.isArray(obj)) obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out))
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  return out
}
const isWords = (s) => /\p{L}{2,}/u.test(s) && !/^[\w./:@#-]+$/.test(s)
async function load(file) {
  const m = await import(pathToFileURL(resolve(file)).href)
  return m.default ?? m[Object.keys(m)[0]]
}

mkdirSync('docs/editors/reading-copy', { recursive: true })
for (const lang of LANGS) {
  const t = L[lang]
  const pointed = lang === 'ar' || lang === 'he'
  let md = `<div dir="${t.dir}">\n\n# StoryTime · ${lang} · reading copy\n\n`
  md += `Generated ${new Date().toISOString().slice(0, 10)} by \`node docs/editors/make-reading-copy.mjs\`. `
  md += `References: story id · p = book page · f = film line · activity field. Site texts: the key in bold.\n\n`
  for (const id of ids) {
    const s = JSON.parse(readFileSync(`content/stories/${id}/story.json`, 'utf8'))
    const d = JSON.parse(readFileSync(`content/stories/${id}/${lang}.json`, 'utf8'))
    md += `\n---\n\n## ${id.toUpperCase()} · ${d.title}\n\n${t.age}: ${s.ageGroups.join(', ')} · ${Object.values(d.names).join(', ')}\n\n`
    md += `### ${t.book}\n\n`
    for (const p of d.pages) {
      md += `- **p${p.n}** ${p.text}\n`
      if (pointed || p.speech !== p.text) md += `  - *${t.voice}:* ${p.speech}\n`
    }
    md += `\n### ${t.film}\n\n`
    for (const f of d.film) {
      md += `- **${f.id}** (${d.names[f.speaker] ?? f.speaker}) ${f.text}\n`
      if (pointed || f.speech !== f.text) md += `  - *${t.voice}:* ${f.speech}\n`
    }
    md += `\n### ${t.act}\n\n`
    for (const [k, v] of flatten(d.activity)) md += `- **${k}** ${v}\n`
  }
  const site = [
    [t.landing, `src/i18n/${lang}/landing.ts`],
    [t.emails, `src/emails/copy/${lang}.ts`],
    [t.legal, `src/i18n/${lang}/legal.ts`],
  ]
  for (const [title, file] of site) {
    md += `\n---\n\n## ${title} (\`${file}\`)\n\n`
    for (const [k, v] of flatten(await load(file))) if (isWords(v)) md += `- **${k}** ${v.replace(/\n/g, ' ')}\n`
  }
  md += `\n</div>\n`
  writeFileSync(`docs/editors/reading-copy/${lang}.md`, md)
  console.log(lang, md.length)
}
