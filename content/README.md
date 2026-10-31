# Adding or editing a book

1. Open `content/books.json` and copy any book object. Give it a new `id` (lowercase, hyphens), a unique `order`, and set `placeholder` to `false`.
2. Fill in `title`, `author`, `ageRange`, `pages`, `price.amount` (whole cents, e.g. `1490` = $14.90), `tags`, `blurb`, and `firstPage.text` (110–170 words, paragraphs separated by a blank line).
3. Pick the cover: `cover.palette` (background, ink, accent colours), `pattern`, `motif`. To use real artwork later, put a square-ish image in `public/covers/` and set `cover.image` to `/covers/<file>.webp`.

Run `npm run validate` — it tells you in plain words if anything is missing. Exactly one book must have `featured: true` (it appears in the hero callout).
