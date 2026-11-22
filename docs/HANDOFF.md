# Handoff

## Stage 0 (Builder): app skeleton and carry-over

Status: DONE (22 Nov 2026), not committed by the Builder. Checks below were run on the final code.

- [x] Versions checked with `npm view` on 22 Nov 2026; exact pins in package.json
- [x] Stack: Vite 8.3.8, React 19.3.1, TypeScript 7.0.2 (strict), Tailwind 4.3.5, React Router 8.5.2 framework
      mode (`ssr: false` + `prerender`), GSAP 3.15.1, three 0.187.0, @react-three/fiber 9.8.2, drei 10.7.9,
      zustand 5.1.0, Vitest 5.1.1, @playwright/test 1.63.0
- [x] Routes, pre-rendering, lang/dir/canonical/hreflang (25 pages pre-rendered: `/` + 6 pages × 4 languages)
- [x] Typed dictionaries in `src/i18n/<lang>/<feature>.ts`; a missing key fails `tsc` (tested by deleting one)
- [x] Carry-over copied and adapted: every file in `docs/CARRY-OVER.md`
- [x] Lab pages `/lab/curl`, `/lab/kit`, `/lab/shelf` run (dev server only)
- [x] Scripts `dev`, `build`, `preview`, `typecheck`, `test`, `e2e`
- [x] Checks: typecheck clean; 17 unit tests pass; build passes; 18 e2e tests pass (phone 390 and desktop 1440,
      Chromium); screenshots in `qa/out/` looked at

### How it fits together
- `site.config.ts` reads `BASE_PATH` (preview `/StoryTime/next/`, launch `/`), `SITE_ORIGIN` (canonical host;
  placeholder default is the GitHub Pages host, set it for launch), `NOINDEX=1` (preview), `LAB=1`.
- `src/routes.ts` is the URL map. `src/seo/paths.ts` lists the pre-rendered paths and builds hreflang.
  Public URLs always end in `/`. `/` is a language picker whose inline script redirects by browser language
  (fallback Arabic) before paint.
- `/:lang` layout (`src/routes/lang.tsx`) loads that language's dictionary chunk: `loader` at build time,
  `clientLoader` in the browser. Pages read it with `useLang()`.
- `/:lang/app/*` is client-only (SPA fallback), `noindex`, with no sign-in check yet.
- `scripts/postbuild.mjs` lays `build/client` out exactly like the URL space (React Router puts pages under the
  base path but assets at the root; this fixes it) and writes `__spa-fallback.html`, `404.html`, `.nojekyll`.
  Deploy = copy `build/client/<BASE_PATH>/`. `npm run preview` serves it (run with the same `BASE_PATH`).

### Notes for the next builder
- WebKit is NOT installed under /opt/pw-browsers (only Chromium): the Safari/iPhone e2e project switches itself on
  only where a WebKit build exists. Do not run `playwright install` here.
- Global Playwright is 1.63.0; `@playwright/test` is pinned to 1.63.0 to match the installed Chromium.
- GitHub Pages only honours the `404.html` at the site root (`/StoryTime/404.html`, the old site). For the preview,
  client-only app URLs opened directly will 404 unless that root file is also the new SPA fallback; links inside
  the app work. Cloudflare at launch: serve `__spa-fallback.html` for unknown paths.
- React writes `hrefLang` in camel case in the HTML. Valid (HTML attribute names are case-insensitive) and read
  correctly by browsers and Google; grep with `-i`.
- The curl engine kills its WebGL context on `destroy()`: always give a new engine a new `<canvas>` (see
  `src/lab/curl.tsx`); React's development double-mount otherwise breaks it.
- Kit puppets still default to the Moon bubble helmet: pass `{ helmet: false }`.
- `studio/scripts/render.mjs` and `sheet.sh` need the Stage 3 studio page (`window.__film`); `music.mjs` and
  `qa.mjs` were run and work.
- No fonts are bundled (system fonts); the container renders Arabic and Hebrew with DejaVu. Fonts are a Stage 2
  brand decision.
- Lab pages carry a few English-only labels on purpose: they never ship.
