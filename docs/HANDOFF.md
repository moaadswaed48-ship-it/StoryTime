# Handoff

## Stage 0 (Builder): app skeleton and carry-over

Status: IN PROGRESS (started 22 Nov 2026). Updated as work proceeds.

- [x] Versions checked with `npm view` (22 Nov 2026) and installed, exact pins in package.json
- [x] Carry-over files copied raw from `origin/laptop/landing-v2` into their new folders
- [ ] Stack config (vite, react-router framework mode, tailwind 4, tsconfig)
- [ ] Routes and prerender with lang/dir/canonical/hreflang
- [ ] Typed i18n dictionaries (ar, he, en, da)
- [ ] Carry-over files adapted (see docs/CARRY-OVER.md)
- [ ] Lab pages: /lab/curl, /lab/kit, /lab/shelf
- [ ] Tooling: typecheck, test, build, e2e
- [ ] Checks run and screenshots in qa/out/

Notes for the next builder:
- WebKit is NOT installed under /opt/pw-browsers (only chromium). Do not run `playwright install` in this container.
- Global Playwright is 1.63.0; `@playwright/test` is pinned to 1.63.0 to match the installed Chromium.
