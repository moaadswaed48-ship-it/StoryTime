// Lighthouse on the public pages, mobile profile (Lighthouse's default: Moto G Power size, simulated slow 4G and CPU),
// each page run several times; the median of each score is reported (the machine may be busy, so one run is noise).
//   node scripts/qa/lighthouse.mjs --url=http://localhost:4391/ [--runs=3] [--langs=ar,en] [--pages=,plans] [--out=file.json]
// Serve a launch-mode build first (BASE_PATH=/ and no NOINDEX, or the SEO score counts the preview's noindex):
//   BUILD_DIR=/some/dir BASE_PATH=/ npm run build && BUILD_DIR=/some/dir BASE_PATH=/ node scripts/serve.mjs --port=4391
// Chromium: CHROME_PATH, else the Playwright build at /opt/pw-browsers/chromium. Error reporting to Lighthouse's
// servers is switched off (it is opt-in anyway); nothing is sent anywhere but the local site.
import { writeFileSync } from 'node:fs'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { LANGS } from '../../src/i18n/config.ts'
import { PUBLIC_PAGES } from '../../src/seo/paths.ts'

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const base = arg('url', 'http://localhost:4391/').replace(/\/?$/, '/')
const runs = Number(arg('runs', '3'))
const langs = arg('langs', LANGS.join(',')).split(',')
const pages = arg('pages', null)?.split(',') ?? [...PUBLIC_PAGES]
const out = arg('out', null)
const CATS = ['performance', 'accessibility', 'best-practices', 'seo']

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium',
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
})
const results = []
try {
  for (const lang of langs) {
    for (const page of pages) {
      const url = `${base}${lang}/${page ? `${page}/` : ''}`
      const per = []
      for (let i = 0; i < runs; i++) {
        const r = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATS, enableErrorReporting: false })
        const lhr = r.lhr
        const a = lhr.audits
        per.push({
          scores: Object.fromEntries(CATS.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)])),
          fcp: a['first-contentful-paint']?.numericValue, lcp: a['largest-contentful-paint']?.numericValue,
          tbt: a['total-blocking-time']?.numericValue, cls: a['cumulative-layout-shift']?.numericValue,
          bytes: a['total-byte-weight']?.numericValue,
          failed: Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual' && x.scoreDisplayMode !== 'notApplicable').map((x) => x.id),
        })
      }
      const row = {
        url: `${lang}/${page}`,
        ...Object.fromEntries(CATS.map((c) => [c, median(per.map((p) => p.scores[c]))])),
        lcpMs: Math.round(median(per.map((p) => p.lcp))), fcpMs: Math.round(median(per.map((p) => p.fcp))),
        tbtMs: Math.round(median(per.map((p) => p.tbt))), cls: Number(median(per.map((p) => p.cls)).toFixed(3)),
        kb: Math.round(median(per.map((p) => p.bytes)) / 1024),
        runs: per.map((p) => p.scores),
        failed: [...new Set(per.flatMap((p) => p.failed))],
      }
      results.push(row)
      console.log(`${row.url.padEnd(26)} perf ${row.performance} a11y ${row.accessibility} bp ${row['best-practices']} seo ${row.seo}  LCP ${row.lcpMs} ms  TBT ${row.tbtMs} ms  CLS ${row.cls}  ${row.kb} KB  [${row.failed.join(' ')}]`)
    }
  }
} finally {
  await chrome.kill()
}
if (out) writeFileSync(out, JSON.stringify(results, null, 2))
