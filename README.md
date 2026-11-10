# StoryTime · وقت الحكاية

A preview of an interactive storybook service for kindergarten children (ages 3–6): every story can be **read** as a book whose pages turn, **watched** as a short film made from the same pictures, and **played** as a game.

- Opens in Arabic (right-to-left); one tap switches the whole site to English (`?lang=en`).
- The story *أوراق الخريف والطيور المهاجرة* is the author's own text; illustrations are a first prototype.
- Hudhud the hoopoe is an original 3D character; the game teaches the letters of the names from the story.
- Sign-up, plans and payment are shown but not connected; the login is a demo.

```bash
npm install
npm run dev                      # http://localhost:5173
npm run build && npm run preview # production build on :4173
npm test && npm run qa:e2e       # unit + browser checks
```

See `CLAUDE.md` for the architecture rules.
