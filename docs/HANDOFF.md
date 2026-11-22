# Handoff

## Stage 0 (Builder): app skeleton and carry-over

Status: IN PROGRESS (started 22 Nov 2026). Updated as work proceeds.

- [ ] Stack scaffolded at repo root (package.json, vite, react-router framework mode, tailwind 4)
- [ ] Routes and prerender with lang/dir/canonical/hreflang
- [ ] Typed i18n dictionaries (ar, he, en, da)
- [ ] Carry-over files copied and adapted (see docs/CARRY-OVER.md)
- [ ] Lab pages: /lab/curl, /lab/kit, /lab/shelf
- [ ] Tooling: typecheck, test, build, e2e
- [ ] Checks run and screenshots in qa/out/

Notes for the next builder:
- WebKit is NOT installed under /opt/pw-browsers (only chromium). Do not run `playwright install` in this container.
