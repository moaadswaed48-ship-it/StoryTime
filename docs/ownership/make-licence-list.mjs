// Builds docs/ownership/LIBRARY-LIST.md from package-lock.json: every installed code library, its version and
// licence, production and development listed apart, grouped by licence, non-permissive ones flagged.
// Plain Node, no packages, reads only the lockfile and package.json. Run from the project folder:
//   node docs/ownership/make-licence-list.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const all = lock.packages

// Licences that only ask for the notice to be kept (and allow commercial use, change and resale).
const PERMISSIVE = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', '0BSD', 'Apache-2.0', 'BlueOak-1.0.0',
  'Unlicense', 'CC0-1.0', '(MIT OR CC0-1.0)'])
// The lockfile has no licence field for these; read by hand from the package's own LICENSE file.
const READ_BY_HAND = { 'webgl-constants': 'MIT' }

const nameOf = (path) => path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length)

// Which of OUR direct dependencies brings each library in (walk the tree from each direct dependency).
const direct = { prod: Object.keys(pkg.dependencies ?? {}), dev: Object.keys(pkg.devDependencies ?? {}) }
function resolve(name, from) {
  // npm's lookup: nearest node_modules up from the requiring package
  let base = from
  while (true) {
    const p = (base ? `${base}/` : '') + `node_modules/${name}`
    if (all[p]) return p
    if (!base) return null
    const i = base.lastIndexOf('/node_modules/')
    base = i === -1 ? '' : base.slice(0, i)
  }
}
const broughtBy = {}
for (const top of [...direct.prod, ...direct.dev]) {
  const start = `node_modules/${top}`
  const seen = new Set()
  const stack = [start]
  while (stack.length) {
    const p = stack.pop()
    if (!p || seen.has(p)) continue
    seen.add(p)
    ;(broughtBy[p] ??= new Set()).add(top)
    const e = all[p]
    for (const d of Object.keys({ ...(e.dependencies ?? {}), ...(e.optionalDependencies ?? {}), ...(e.peerDependencies ?? {}) })) {
      const r = resolve(d, p)
      if (r) stack.push(r)
    }
  }
}

const rows = { prod: [], dev: [] }
for (const [path, e] of Object.entries(all)) {
  if (!path) continue
  const name = nameOf(path)
  let licence = e.license ?? READ_BY_HAND[name] ?? 'UNKNOWN'
  if (/gsap\.com\/standard-license/.test(licence)) licence = 'GSAP Standard "no charge" licence (not open source)'
  const side = e.dev ? 'dev' : 'prod'
  rows[side].push({ name, version: e.version, licence, optional: !!e.optional, by: [...(broughtBy[path] ?? [])].sort() })
}

function table(side) {
  const groups = {}
  for (const r of rows[side]) (groups[r.licence] ??= []).push(r)
  const order = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)
  let out = ''
  out += `| Licence | Libraries | Permissive? |\n|---|---|---|\n`
  for (const l of order) out += `| ${l} | ${groups[l].length} | ${PERMISSIVE.has(l) ? 'yes' : '**NO: see note**'} |\n`
  out += `| **Total** | **${rows[side].length}** | |\n\n`
  for (const l of order) {
    out += `#### ${l} (${groups[l].length})${PERMISSIVE.has(l) ? '' : ' **FLAG: not a plain permissive licence**'}\n\n`
    out += `| Library | Version | Brought in by (our direct dependency) |\n|---|---|---|\n`
    for (const r of groups[l].sort((a, b) => a.name.localeCompare(b.name))) {
      out += `| ${r.name}${r.optional ? ' (optional, one computer type only)' : ''} | ${r.version} | ${r.by.join(', ') || '-'} |\n`
    }
    out += '\n'
  }
  return out
}

const md = `# Code libraries in StoryTime, with their licences (generated)

**Generated on ${new Date().toISOString().slice(0, 10)} by \`node docs/ownership/make-licence-list.mjs\` from \`package-lock.json\`.**
Do not edit by hand: run the script again after any library is added, removed or updated.
Plain-language explanation of what each licence asks: \`docs/ownership/THIRD-PARTY-LICENCES.md\`.

- **Production** = libraries the site needs to run (some reach the visitor's browser; some are tools that only
  run on our side, for example the email preview tool inside \`react-email\`).
- **Development** = tools used only to build and test the site; none is sent to visitors.
- "Brought in by" names the library we chose directly in \`package.json\` that pulls this one in.

## Production (${rows.prod.length} libraries)

${table('prod')}
## Development only (${rows.dev.length} libraries)

${table('dev')}`
writeFileSync('docs/ownership/LIBRARY-LIST.md', md)
console.log(`prod ${rows.prod.length}, dev ${rows.dev.length}`)
for (const side of ['prod', 'dev']) {
  const flagged = rows[side].filter((r) => !PERMISSIVE.has(r.licence))
  for (const r of flagged) console.log('FLAG', side, r.name, r.version, r.licence, '<-', r.by.join(','))
}
