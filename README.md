# StoryTime · وقت الحكاية

A cinematic preview of a storybook service for kindergarten children (ages 3–6). Every story can be **read** (a book that opens, with pictures that move), **watched** (a short film with the same characters) and **played** (a small game with the same hero).

- Opens in Arabic (right-to-left); one tap switches the whole site to English (`?lang=en`).
- The story *أوراق الخريف والطيور المهاجرة* is the author's own text, shown exactly as written. The English column is a draft translation.
- The film clips, the scene pictures and the 3D model of Sari were generated once and are committed under `public/`.
- Plans, prices and sign-in are a demonstration: prices are labelled as samples, the login is prefilled and nothing is sent anywhere.

```bash
npm install
npm run dev                      # http://localhost:5173
npm run build && npm run preview # production build on :4173
npm test && npm run qa:e2e       # unit + browser checks
```

One section alone: `http://localhost:5173/demo.html?f=library&qa=1` (see `docs/SPEC.md`, section 6).

`CLAUDE.md` holds the project rules; `docs/SPEC.md` is the full build spec.
