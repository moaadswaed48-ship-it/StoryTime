# Landing page copy notes (25 Nov 2026)

**In three lines:** the landing page now has its words in Arabic, Hebrew, English and Danish, in eight plain sections
(the design pass restyles them). Every claim was checked against the build as it is today; the lines that must change
when production lands are listed below. A native editor should read the lines marked in section 4 before launch.

Files: words `src/i18n/<lang>/landing.ts` (type `src/i18n/landing-schema.ts`, loaded only by the landing route through
`src/i18n/landing.ts`), page `src/routes/landing.tsx`, graph `src/features/landing/ImpactChart.tsx`, tests
`tests/landing.test.ts`, `e2e/landing.spec.ts`, screenshots `qa/out/landing/`.

---

## 1. Headlines considered

Goal: seven words or fewer, saying something only this product can say (one story you read, watch and then do
together), written natively rather than translated.

| Language | Options considered | Chosen, and why |
|---|---|---|
| English | "One story to read, watch and do together" (8 words, too long) · "Stories that teach kindness, then come alive" (a competitor could say it) · "Read, watch and play each story together" · "Read it, watch it, then live it" ("live it" is vague) | **"Read it, watch it, do it together"** (7). Three verbs map to the book, the film and the activity; "together" is the parent-and-child promise. Passes the swap test: library apps without activities cannot say "do it". |
| Arabic | «حكاية تُقرأ وتُشاهَد وتُعاش معًا» (passive, stiff) · «نقرؤها، نشاهدها، ثم نعيشها معًا» · «اقرؤوا وشاهدوا والعبوا معًا» (imperative plural sounds like an order) | **«حكايات نقرؤها ونشاهدها ونعيشها معًا»** (5). First person plural speaks for the family without assuming who the adult is (style guide §4); «نعيشها» carries both the activity and living the value. |
| Hebrew | "סיפור שקוראים, צופים בו ועושים יחד" (clunky) · "סיפורים שקוראים, רואים ועושים ביחד" · "קוראים, צופים ועושים יחד" | **"לקרוא, לצפות ולעשות יחד"** (4). Infinitives are natural in Hebrew headlines and are gender-neutral (style guide §4). The three verbs match the storybook doors (לקרוא, לצפות, לעשות). |
| Danish | "Læs den, se den, og gør den sammen" ("gør den" sounds wrong) · "Læs, se og leg historien sammen" · "Læs den, se den og leg den sammen" | **"Én historie. Læs, se og leg sammen"** (6). "Leg" (play) is how a Danish parent would describe the activity; "Én historie" keeps the one-story promise. |

Subheads say the same in each language: stories for ages 2 to 8 that teach respect and kindness, each with a picture
book, a short film and an activity to share. The voice is left out of the hero on purpose (it is not recorded yet).

## 2. Claims and the evidence behind them

- **The four parts of a story** (section 2) describe A04 "Slow, Slow, Together": title, excerpt (page 5) and activity
  ("The Looking Frame") come from `content/stories/a04/`. A test fails if the excerpt or titles drift from the story.
  The status line says plainly that pictures, films and the recorded voice are still in production.
- **Values examples** come from the outlines: A03 (mother), B02 (classmates, written), B14 (elders), C01 (numbers,
  written). The lead says they come from "stories written and being written", because A03 and B14 are outlines only.
- **The graph** is an illustration with sample numbers (master plan §3.10). The label is fixed above the plot in the
  page's language, the axes carry words only (Start/Later, Less/More), and there is no hover tooltip, so the sample
  values never read as data. The text alternative repeats that it is an illustration.
- **Research lines**, only from items the research marked verified (`docs/research/ages-raw.md`):
  WHO 2019 (section C, page fetched) on reading and storytelling with a caregiver; Durlak 2011 (section F2: 213
  programmes, about 11 percentile points where achievement was measured); Jones, Greenberg and Crowley 2015 (section
  F3: kindergarten prosocial skills associated with education and employment 13 to 19 years later). A "scope" line
  says these studies are of school programmes and long-term follow-up, not of StoryTime. Left out: Mol & Bus (tagged
  abstract only), Moffitt (search summary), Lee 2014 (single lab), Taylor 2017 (possible author bias).
- **The owner's adult-outcome message (N3)** stays soft: only the Jones line speaks about later life, worded as a
  link over time, not proof. The founders' study is announced with no numbers.
- **No** testimonials, user counts, awards, press logos or prices. Prices show the existing "Price not set yet"
  placeholder.

## 3. Lines to change as the build moves on

| When | Line | Change |
|---|---|---|
| A04 pictures, film and voice exist | `inside.status` | Delete or reword. |
| The recorded voice is in | `faq.items[8]` (recorded voice) | Rewrite as a yes. |
| The library holds 15 per group | `ages.planned`; values `lead` ("being written") | Reword or delete. |
| The owner's papers arrive | graph `SAMPLE`, `evidence.chart.*`, `evidence.ownStudy` | Real figures, a source line, and a lawyer's look at the wording (product checklist open decision 4). Until then the graph should stay on the preview only. |
| Prices are set | plans teaser | Shows nothing extra today; consider showing the 1-month price. |
| A classroom mode is built | FAQ teachers answer | Add it. |

## 4. Lines a native editor should check

**Arabic**
- Headline «حكايات نقرؤها ونشاهدها ونعيشها معًا»: is «نعيشها» natural for "do the activity and live the value", or too figurative?
- «البرّ بالأمّ» as the value name: right register for parents, or too religious-classical? Alternative «الإحسان إلى الأمّ».
- «احترام رفاق الصفّ» for a kindergarten group (B02 is a kindergarten).
- «درجة مئينية» for "percentile point".
- «طاقم الروضة» in the Jones line (the study's kindergarten teachers).
- Digits: Western digits are used, as in every other dictionary (style guide §6 leaves Eastern digits as an open question).

**Hebrew**
- Headline "לקרוא, לצפות ולעשות יחד".
- "כיבוד אם" as the value name: natural, or too close to the commandment wording? Alternative "להיות טובים לאמא".
- "קריין" in the voice answer is masculine; the narrator's gender is not chosen yet ("קריין או קריינית"?).
- "נקודות אחוזון" for "percentile points".

**Danish**
- Headline "Én historie. Læs, se og leg sammen".
- "børnehaveklassen" for the US kindergarten of the Jones study.
- "percentilpoint".
- The commerce line reused in the plans teaser breaks "5 %" across lines on phones (`commerce.ts`, not landing words):
  a non-breaking space there would fix it.

**English**
- "Being good to your mother" as the value name (the owner's own words); "Kindness to Mum" is the alternative.

## 5. Advice skills used
copywriting (diagnosis: blank brief; three-question gate; no AI tells), cro (one main action above the fold, trial
terms near the top), marketing-psychology (no false scarcity or social proof), copy-editing, signup, pricing. All read
as advice only; nothing was run or installed.
