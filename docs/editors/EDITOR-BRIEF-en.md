# StoryTime: brief for the native English editor

> **Summary for the owner (Moaad).** This brief asks one native English children's-book editor to read all 45
> stories (book, film lines, activity), the landing page, the 19 emails and the legal drafts (wording only), about
> **43,000 words** in all (46,000 with the optional site buttons), and to send corrections in one table. It lists, in order, the lines our AI writers and
> reviewers were least sure of: the British-or-American choice, sound words, the C07 road-crossing rewrite, the long
> adult notes and a handful of lines that may sound like a lecture. Rough effort: **25 to 40 hours** (our estimate,
> not a quote). Send the editor this file plus `docs/editors/reading-copy/en.md`.

Draft of 25 Nov 2026. Everything below comes from the project's own notes; nothing about the editor's pay, contract or
deadline is set here (the owner decides those).

---

## 1. What StoryTime is

StoryTime is a story library for children aged 2 to 8, in Arabic, Hebrew, English and Danish, sold to families and
kindergarten teachers in Israel by age-group pass. Each story has four parts:

- **a book** that the adult reads aloud (pages turn like paper; the words sit on calm areas of the picture);
- **a film** with its own script, narrated later by a recorded voice, with captions;
- **an activity** for the child and an adult: goal, materials, picture steps with very short captions, a safety line,
  a note explaining the idea to the adult, and a version for a class;
- a future **read-aloud voice** (not recorded yet).

The 45 stories were written by AI writers, one batch at a time, from shared outlines, and then reviewed line by line
by a separate AI reviewer per language. **Each language was written natively, not translated from English**, so the
English is one of four equals, not the master. A human native ear has not read any of it yet: that is your job.

The pictures and films are drawn in code and carry no words, so one picture serves all four languages.

## 2. The readers: three age groups

| Group | Ages | Who reads | Book limits (from the age briefs) |
|---|---|---|---|
| A | 2 to 3 | An adult reads aloud to a toddler | 40 to 150 words a book, 3 to 15 words a spread, sentences of at most 8 words; present tense allowed; no passive, no "if" sentences |
| B | 4 to 5 | An adult reads aloud; the child joins refrains | 200 to 450 words, 15 to 40 a spread, sentences up to 14 words |
| C | 6 to 8 | Read together; some children start reading alone | 450 to 900 words, 30 to 70 a spread, sentences up to 20 words |

A check tool keeps every story inside these limits. If a fix would push a line over a limit, please say so in the
"reason" column and we will rebalance.

## 3. What to read, and how much

Everything is in one file: **`docs/editors/reading-copy/en.md`** (the owner can send it as a document). Each line
carries the reference to quote back: story id, `p` = book page, `f` = film line, the activity field, or a key for site
texts.

| Part | What it is | Words |
|---|---|---|
| 45 stories: book text | 562 pages | 15,659 |
| 45 stories: film lines | 891 spoken lines (their own script, not a copy of the book) | 4,592 |
| 45 stories: activities | goal, materials, steps, safety line, adult note, class note | 15,633 |
| 45 stories: titles and names | | 426 |
| Landing page | | 1,094 |
| 19 emails | confirm address, welcome, trial, receipt, pass reminders, password reset and others | 1,253 |
| Legal drafts | terms, privacy, refunds, accessibility, credits, cookies: **for wording only, not for law** (a lawyer reviews the content) | 4,192 |
| **Total asked** | | **about 42,850** |
| Optional | buttons, menus, account and owner's-area pages | 3,312 |

Counted by `node docs/editors/count-words.mjs` on 25 Nov 2026 (site texts counted from the word files, so roughly).
**Rough effort:** at a careful editing pace of 1,200 to 1,800 words an hour, with reading aloud, about 25 to 40 hours.
This is our estimate, not a measured figure.

The landing page and legal pages can also be seen as pages on the hidden test site:
`https://moaadswaed48-ship-it.github.io/StoryTime/next/en/` and `…/next/en/legal/terms/` (also `privacy`,
`refunds`, `accessibility`, `credits`, `cookies`).

**Please do not edit:** the first story of the library, by a human author, which is hers and is not in your reading
copy; character **names** (they are shared by four languages: if one reads badly, tell us); and **facts** (safety,
nature, numbers: flag them, we check them with sources). Placeholders in square brackets (for example
`[support email address: to be added before sales open]`) are meant to be visible until the owner fills them. Words in curly brackets, such as `{endsAt}` or `{group}`, are filled in by the site (a date, an age group): keep
them exactly as they are. In the legal drafts, `[[…]]` marks a visible gap and `{path|label}` a link.

## 4. The house style in short (`docs/story-room/style-en.md`)

1. Plain, warm, concrete words a good parent uses with a child; nouns the child can see in the picture.
2. **British spelling** by default (colour, favourite, Mum). This is an open question: families in Israel may know
   American English better (see priority 1).
3. Mum, Dad, Grandma, Grandpa; some stories keep Mama and Papa from their outlines, consistent inside each story.
4. One idea per sentence; the strongest word at the end of the sentence and of the spread; refrains repeat word for
   word; rhyme only when natural, never twisted word order.
5. Numbers are words in the story; digits only in adult activity text. Clock times as words.
6. Curly double quotes, a named speaker when not obvious; no semicolons in groups A and B; at most one exclamation
   mark per spread in groups B and C; em dash only in group C.
7. The adult is "the grown-up", "parent or teacher", "they"; never a default mum.
8. Avoid: shaming labels (naughty, lazy, silly), "smart" praise (praise effort), religion, holidays, politics, army,
   real place names, brands, pork, wine, meat with milk, weekday names that mark a sabbath.

## 5. Your priority list

### Priority 1: choices that affect every story

1. **British or American English** for families in Israel (style guide §1; pilot review). Today: British throughout.
2. **The adult notes are long for a phone.** Every reviewer said so: correct, but "the owner may want them cut by a
   third". Please say whether to cut, and show the cut on two or three notes as a model.
3. **Mama/Papa versus Mum/Dad** across the library (A01, A03, A06, A08, A13 use Papa or Mama; B06 uses Dad where the
   outline said Papa).
4. **Capitals for shouts** ("I'M ANGRY!" B03, "BOOM!" A07, "WAAAH!" B10): one per story. Do they help the voice, or
   should the shout be shown only by the tag?
5. **The shared safety line** at the end of every activity: "If there is an accident, call your local emergency
   number." Natural?
6. **Rhythm read aloud.** The reviewers trusted their grammar but not their ear: please read every page aloud.

### Priority 2: specific lines

**Group A (2 to 3)**
- A01 "Wheee" (three e's); inverted lines "Down slides Papa", "Up go the pigeons".
- A02 "Too squishy"; p8 "Bits of wool fall down" (the nicer "little bits" was cut to stay inside 15 words).
- A05 "Bend, bend!" for knees. A06 "Night-night, Papa". A07 "BOOM! says the sky". A08 "stripy sleeve".
- A11 "The biggest round of all" and the chant "Round, round, round"; "Whoo-whooo!" for the train (a British reader
  may expect "Toot-toot!").
- A12 "wee" and "pants" (British).
- A14 p3 and p4 "Dad holds the basket / the bag", "Dad sings": natural, or let the picture carry the speaker?
- A04 p10 "Sami and Grandpa sit on a warm rock" (exactly at the 8-word limit). "Tweeeet!" (how many e's?) and
  "Boom, boom, BOOM".

**Group B (4 to 5)**
- B01 "Maa-aa" for the goat; "Meh".
- B02 "it sings the sea" (Dalia's own odd phrase, kept on purpose); "Show-and-tell day".
- B03 p5 "She stamped her foot and shouted out exactly how she felt. “I'M ANGRY! You rode over my sun.”"
- B04 "Fee-oo-wee" (clay whistle). B07 "Snow lady" (the outline's word; "snowman" is more usual), "Thwack", "Splat",
  "Plop". Goat bells "Clink, clank, clink"; "Ding-dong".
- B05 p7 "Where does Yasmin think the basket is?" (the classic false-belief question: does a parent need the note?).
- B09 "Up it went"; "the wind hummed in their ears".
- B10 "Waaah" / "WAAAH!"; B11 syllables written with hyphens ("Win-dow", "Ta-la"), "Boom-boom" as one word.
- B12 "You're hired!" was changed to "You're a real builder now!": does it keep enough of Mum's joke for a
  four-year-old?
- B13 "Yellow, green, yellow, green" (three beats where "blue, white" had two); the title "The Yellow-Green Path" may
  read as one colour ("The Yellow and Green Path" would avoid it; the owner's call).
- B14 "little painter". B14 "Psshh" for the bus door; "Swish, swish went the wipers".

**Group C (6 to 8)**
- C01 p12 "However we share them, it always makes ten" (a teacher may prefer "they always make ten").
- C02 "Slap, slap", "Swish… thump… hop"; "first-grader" (kept: the Israeli school's own term); "jumpers".
- C04 the riddle mishearing "A deck?".
- C05 "the snack's on us"; "Next time, we'll share ours": warm enough, or too neat?
- C06 "Fweeee!".
- **C07, read aloud from start to finish.** It was rewritten so that Noah's aunt holds his hand at every crossing
  (road-safety decision). Is she present without taking the game from the children? Also "the green man".
- C07 p9 "Quiet, he thought, is not the same as empty" and C08 p8 "And you matter much more to me than any ball":
  cut either if you hear a lecture.
- C08 "striped like a sweet".
- C09 "Pins and needles" (p6). C10 "Long-Legs" hyphenated as a name.
- C11 "It's time you met the clock" (the pun should land); refrain "Two hands, twelve marks, and no idea".
- C12 "pulled the frog's surprised face"; "Deal".
- C13 "the baker's boy" in narration against the role name "the boy from the bakery".
- Sentences at 19 to 20 words (C08 p9, C11 p5, C12 p10 and p13, C13 p6, C14 p8): within the limit; worth hearing.

### Priority 3: site texts

- **Landing page:** the value name "Being good to your mother" (the owner's own words); the alternative is
  "Kindness to Mum".
- **Emails:** age groups inside sentences are lower-cased ("for ages 4–5"), the table keeps "Ages 4–5"; the marketing
  subject starts with the Hebrew legal mark `פרסומת | Advertisement` (required by Israeli law, keep it); subject lines
  short and plain. Owner's area: "Owner's area".
- **Legal drafts:** wording and clarity only. Please do not change the meaning: mark anything unclear and we pass it
  to the lawyer.

## 6. How to send corrections back

One table (a spreadsheet or a table in a document), one row per change, sent to the owner by email:

| Story or page | Place | Current line | Proposed line | Reason |
|---|---|---|---|---|
| B12 | p9 | You're a real builder now! | … | The joke is lost; a four-year-old will not … |
| C07 | f14 | … | … | … |
| Emails | `templates.trial_ends_tomorrow.subject` | … | … | … |
| All stories | activity `safety` | … | … | Applies to all 45 |

- **Place** is the reference printed in bold in the reading copy: `p5`, `f12`, `steps[2].caption`, `forAdult`, or the
  site-text key.
- Mark a change that should apply everywhere (a word, a spelling) once, with "all stories" in the first column.
- Questions and judgements without a proposed line are welcome: leave "Proposed line" empty and write the question
  under "Reason".
- If you would rather mark up the reading copy itself, that works too; the table is only the simplest way for us to
  apply your changes exactly.
