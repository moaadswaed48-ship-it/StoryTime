# Style guide: Hebrew (עברית) for StoryTime read-aloud text

For writers and reviewers of StoryTime's Hebrew stories. Tags: [S] sourced (file and section named), [D] our
judgement, [U] unverified, [P] proposal to test. Research files: `ages` = `docs/research/ages-raw.md`, `vowels` =
`docs/research/vowel-marks-raw.md`.

**Status:** the niqqud convention in section 2 is **our own convention**. No source was found for niqqud practice by
age in children's books, and the Ministry of Education's niqqud document could not be read [S that both are missing,
vowels §2]. It must be confirmed by a native Hebrew children's-book editor before Stage 6 writing begins.

**Write Hebrew first, not as a translation.** The story's events, characters and pictures are shared with the other
three languages; the sentences are written fresh in Hebrew (master plan §10, Stage 6).

---

## 1. Register

1. Modern standard Hebrew, close to how an educated parent speaks to a child. Not slang, not high literary style [D].
2. Narration in the past tense (מָאיָה רָצָה). Group A may use the present tense for immediacy (מָאיָה רָצָה can be
   past or present; choose one tense per book and keep it) [D].
3. No biblical narrative forms (וַיֹּאמֶר, וַיֵּלֶךְ), no archaic words where an everyday word exists.
4. Parents in dialogue and in group-A narration: אִמָּא, אַבָּא, סַבָּא, סַבְתָּא (the child's own words). In group B and C
   narration: also אִמָּהּ, אָבִיו when it reads naturally [D].
5. Grammar to avoid in group A: the passive, relative clauses with שֶׁ inside a long sentence, conditional sentences.
   Rare in group B; free in group C [D].

---

## 2. Niqqud in two layers

Every sentence is stored twice (master plan §13: `display` and `speech`):
- **Display layer:** what the parent and child see.
- **Speech layer:** what the future narrator voice reads. It equals the display layer plus three kinds of marks that
  are never shown on screen.

### 2.1 Policy by age

Research: children learn to read with pointed text, which is "consistent and phonologically well-specified", and
the move to unpointed text begins at about grade 3 [S, ages §H and vowels §2; both via search summaries]. All our
groups are below grade 3, so:

| Group | Display layer | Why |
|---|---|---|
| A (2 to 3) | full niqqud | the adult reads aloud; full niqqud is the usual form of Hebrew picture books [U, general knowledge, vowels §2 notes niqqud remains in texts for children] and helps the child who starts to notice letters |
| B (4 to 5) | full niqqud | the same; children start to know letters of their own name [S, ages §D1] |
| C (6 to 8) | full niqqud | beginning readers read pointed text; do not move to unpointed text before grade 3 [S, ages §H] |

Unlike Arabic, Hebrew needs no separate "light" display layer at these ages: full Hebrew niqqud is the normal form for
young readers, and dropping it would harm the beginning reader [D]. Whether groups A and B could use lighter niqqud
for the adult reader is an open question for the editor (README).

**Adult-facing text** (activity explanations, notes, captions for the teacher or parent) is written unpointed, in
standard full spelling (כתיב מלא), because adults read unpointed Hebrew [D].

### 2.2 Display layer: eight rules

| # | Rule | Example |
|---|---|---|
| H1 | Every letter carries its sign by the Academy of the Hebrew Language's niqqud rules: vowels, shva, hataf vowels, dagesh kal and dagesh hazak, mapiq in final ה. | הַיַּלְדָּה, שֶׁלָּהּ |
| H2 | **Spelling is the pointed spelling (כתיב חסר מנוקד)**, as the Academy's rules for pointed text require; not full spelling with niqqud added. [D, editor to confirm: many modern picture books mix the two] | שֻׁלְחָן, not שׁוּלְחָן |
| H3 | The dot on ש is always written (שׁ or שׂ). | שָׁלוֹם, שָׂמֵחַ |
| H4 | Holam on vav (וֹ) and shuruk (וּ) are written precisely; a consonantal vav is written as plain ו with its vowel. | אוֹר, סוּס |
| H5 | Final letters ך ם ן ף ץ; final kaf carries its sign (ךְ, ךָ). | לֵךְ, לְךָ |
| H6 | Kamatz katan is written as an ordinary kamatz in the display layer. | כָּל |
| H7 | Foreign sounds use the geresh character ׳ (not an apostrophe): ג׳ ז׳ צ׳. | |
| H8 | No maqaf, no cantillation marks, no stress marks in the display layer. Text stored in Unicode NFC. | |

### 2.3 Speech layer: display plus three marks

These follow the "enhanced niqqud" of the open Hebrew tool Phonikud, whose README says its invented marks U+05AB and
U+05BD mark stress (hat'ama) and the vocal shva [S: github.com/thewh1teagle/phonikud README, fetched 22 Nov 2026
through a summarising fetch tool; whether ElevenLabs reads these marks is U and must be tested, vowels §4.2].

| # | Add | Where | Example (display, then speech) |
|---|---|---|---|
| P1 | U+05AB (stress) | on the first letter of the stressed syllable, **only** in words whose stress is not on the last syllable (מִלְעֵיל). Words stressed on the last syllable (the default) get nothing. | מָאיָה רָצָה → מָ֫איָה רָ֫צָה |
| P2 | U+05BD (vocal shva) | under every letter whose shva is pronounced /e/ in standard modern Israeli speech | בְּבַקָּשָׁה → the ב gets U+05BD |
| P3 | U+05C7 (kamatz katan) | replaces the ordinary kamatz wherever it is pronounced /o/ | כָּל → כׇּל |

Two writers who agree on the standard pronunciation will mark the same letters. Where pronunciation varies between
speakers, follow the Academy's recommended form and list the word for the editor.

**Tools:** Dicta Nakdan, Phonikud and UNIKUD are second opinions only; Phonikud's datasets have non-commercial
licences and its model licence must be checked before commercial use [S, vowels §3]. A human checks every word.

---

## 3. Sentence rhythm for reading aloud

1. One idea per sentence. Group A: 2 to 6 words; group B: 5 to 10; group C: 8 to 14, varied [D, from the age briefs].
2. The important word comes last. Hebrew allows verb-first and subject-first; choose what sounds natural aloud.
3. A refrain repeats word for word, sign for sign [S, ages §G].
4. Rhyme is written in Hebrew from the start, never translated [S that rhyme transfer is unverified, ages §H].
   Watch stress: Hebrew rhyme needs matching stress, not only matching letters [D].
5. Pauses come from punctuation; the newest voice model has no break tags [S, vowels §4.2].
6. Read every sentence aloud before saving it.

---

## 4. Speaking to parents and teachers without assuming gender

Hebrew marks gender in "you" and in verbs. Project rule 5 requires that we never assume the reader's gender.

1. **Activity steps and captions:** the infinitive. "לָשִׂים אֶת הָאֶבֶן בַּכּוֹס" (unpointed in adult text: לשים את
   האבן בכוס) [D].
2. **To the adult and child together:** the plural, addressed to the household: "קראו יחד את הסיפור" [D; the plural
   is grammatically masculine but addresses a mixed group].
3. **Notes to the adult alone:** impersonal forms: "כדאי ל...", "אפשר ל...", "מומלץ ל...".
4. **Never** slash forms (קרא/י, את/ה) and never a singular imperative to the reader.
5. **Never** assume who the adult is: not "אמא" by default; "ההורים", "המבוגרים" or "הגננת או הגנן" written out.

---

## 5. Names

1. One name per character in all four languages; the Hebrew spelling with niqqud is fixed in the name ledger at the
   end of `outlines.md`. Copy it exactly [D].
2. **Keep** the name; **adapt** only its spelling to Hebrew sounds; **translate** names that are ordinary words (a
   cat called "Cloud" becomes עָנָן); **change** a name only if it means something rude or silly in Hebrew, and record it.
3. Names shared by all the Abrahamic traditions (Adam, Yousef, Elias) are welcome; names tied to only one community's
   religious figures, public figures, or the owner's family (for example Sari) are not used [D].
4. A name that is also a Hebrew word (לִינָה, נִינָה, דַּלְיָה) is fine when the picture and context make it clearly a
   name; note it for the editor.

---

## 6. Numerals

1. In story text, numbers are words, pointed, with correct gender (a feminine noun: שָׁלֹשׁ סִירוֹת; a masculine noun:
   שְׁלֹשָׁה דְּגִים). Counting aloud uses the feminine forms: אַחַת, שְׁתַּיִם, שָׁלֹשׁ [D, editor to confirm].
2. Where digits are needed (a clock face, an activity), use Western digits 0 to 9, as Hebrew print does. Never Hebrew
   letters as numbers.
3. Films carry no digits or words inside the picture (master plan §7).

---

## 7. Punctuation and typesetting

1. Standard punctuation: . , ? ! : with no space before, one after.
2. Dialogue in double quotation marks, introduced by a colon: אָמְרָה מָאיָה: "בּוֹאִי!"
3. No abbreviations (no ״ inside words) in children's text.
4. Text is real text, right-to-left, logical CSS (start and end), set with the rtl-typesetting skill and a font that
   places niqqud clearly; never letter-space Hebrew with niqqud (marks drift) [D].

---

## 8. Words and content to avoid

- Slang and spoken fillers: סַבָּבָּה, אַחְלָה, יַאללָה, וַואלָה, אוֹקֵיי.
- Religious formulas in narration or dialogue: בָּרוּךְ הַשֵּׁם, בְּעֶזְרַת הַשֵּׁם, אִם יִרְצֶה הַשֵּׁם [D].
- Army, security and political words; names of real towns; days of the week that mark a sabbath (Friday, Saturday)
  [D].
- Labels that shame a child: עַצְלָן, טִפֵּשׁ, יֶלֶד רַע; teasing about bodies, skin colour or accent [D].
- Food that excludes some families: pork; meat with milk in one meal; wine [D].
- Gender rules as morals ("בָּנִים לֹא בּוֹכִים") [D].

---

## 9. Cultural neutrality for every family in Israel

The same Hebrew book will be read in secular, traditional and religious Jewish homes and in Arab homes where Hebrew is
the family's or the school's language.

1. No holidays, sabbath scenes or religious symbols as subject or decoration [D].
2. Places are types: the sea, the market, the desert, the hills, a city, a village. No real place names, maps, flags
   or uniforms of army or police; a lifeguard, a bus driver, a nurse are fine [D].
3. Shared foods: bread, pita, olives, oranges, watermelon, pomegranates, cucumbers, tomatoes, dates, figs, rice.
4. Families of many shapes: mother and father, a single parent, grandparents raising a child, big and small families
   [S, ages §J2 item 34 for "families that look different"; the limits of what to show are D].
5. Clothes everyday and modest enough for any family [D].
6. No pigs; dogs outdoors, not shown licking faces [D].
7. The local year: winter rain, spring anemones, summer sea and heat, autumn first rain and migrating birds.

---

## 10. Reviewer's checklist (tick all ten)

- [ ] 1. Modern standard Hebrew, natural aloud; no slang, no biblical forms; written fresh, not translated word for word.
- [ ] 2. Display layer: full niqqud by H1 to H8; pointed spelling (כתיב חסר מנוקד); shin and sin dots on every ש.
- [ ] 3. Speech layer: equals the display layer plus only P1 (stress on non-final-stress words), P2 (vocal shva) and P3 (kamatz katan).
- [ ] 4. Adult-facing text is unpointed, in standard full spelling.
- [ ] 5. Numbers are words with correct gender; digits, where needed, are Western.
- [ ] 6. Sentence lengths fit the age brief; refrains repeat sign for sign.
- [ ] 7. Adults are addressed by infinitive, household plural or impersonal forms; no slash forms; no assumed gender.
- [ ] 8. Character names match the ledger exactly, with the same niqqud.
- [ ] 9. Punctuation and quotation marks follow section 7; no letter-spacing.
- [ ] 10. Nothing in sections 8 and 9 is broken: no religious formula, no politics, no excluded food, no shaming label.
