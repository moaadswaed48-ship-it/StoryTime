# Pilot stories: checks (22 Nov 2026)

**Result.** A04, B02 and C01 are written in full in four languages: book, film script with shot list, activity and
character sheets. Every file passes the automatic checks below, with no errors. They are a writer's draft. None of the
four languages has had a native read yet, and the Arabic and Hebrew marks follow our own conventions, which still
wait for their editors (`REVIEW.md` §9). The lists of words I am least sure of are in §4.

**Files.** `content/stories/{a04,b02,c01}/` each hold `story.json`, `cast.json`, `ar.json`, `he.json`, `en.json` and
`da.json`. `docs/story-room/pilots/src/<id>.ar.json` and `<id>.he.json` are the Arabic and Hebrew sources (voice layer
only). `docs/story-room/pilots/tools/storytool.py` builds and checks everything.

---

## 1. How the Arabic and Hebrew display text is made (and why)

- **Arabic.** Only the full layer (style-ar F1 to F12) is written by hand, in the source file. The light layer is
  generated from it by applying deletion rules L1 to L8 in order, never typed. So checklist item 3 ("regenerating it
  gives the identical text") holds by construction. Two writer's markers help the rules and never reach the output:
  `|` after a one-letter prefix (وَ| بِ| لِ| فَ| كَ|), so L8 can strip it, and `^` after a word whose final vowel is a
  person or gender ending kept by L2 (لَكَ^، فَضْلِكِ^). The script reproduces the guide's three worked examples
  exactly. The adult activity text is written in full marks too and reduced the same way (style-ar §2.3).
- **Hebrew.** The source holds the speech layer. The three voice marks are typed as placeholders right after their
  letter (`@` stress U+05AB, `%` vocal shva U+05BD, `$` kamatz katan U+05C7). The build converts them, and the
  display layer is the speech layer with those three removed. Adult activity text is unpointed, in full spelling.
- Rebuild with `python3 docs/story-room/pilots/tools/storytool.py build`. Check with `... storytool.py check`.

## 2. Automatic checks (`storytool.py check`), last run: no errors

What the script checks for every story:
- **Shape:** page numbers run 1..N; same page numbers, film line ids (in shot order) and step numbers in all four
  languages; cast ids equal the `cast.json` sheets; names given for every cast id in every language; speakers are
  `narrator` or a cast id; every line has an emotion; every sheet has the `Sheet` fields with hex colours; zones are
  valid; `image` is null.
- **Age limits** (from each brief): spreads; total words, words per spread and longest sentence. These are held for
  English and Danish. Arabic and Hebrew must stay under the cap and the sentence limit, because the briefs set word
  counts for English only. The checks also cover the film total against the brief's range and `targetSeconds` (each
  shot's action starts with its length, "8 s."), the activity step count and minutes, and caption length (at most 8,
  12 and 16 words for groups A, B and C).
- **Script rules:** no digits in story or film text; no Latin letters in Arabic or Hebrew. Every Arabic `speech`
  carries full marks (each letter is marked except a long vowel letter, a wasl alif, or the article lam before a sun
  letter). Words before `. ! ؟ : » …` are in pausal form. There is no sukun before a hamzat al-wasl, and no tatweel.
  Every Hebrew `speech` is fully pointed (mid-word letters carry a vowel unless they are a mater lectionis), and every
  ש has its dot. Hebrew display equals speech minus the three voice marks. Hebrew adult text is unpointed. English and
  Danish `text` equals `speech`.

| Story | Lang | Words (cap) | Per spread (brief) | Longest sentence (limit) | Film words / longest caption |
|---|---|---|---|---|---|
| A04 (2-3) | en | 102 (40-150) | 5-13 (3-15) | 8 (8) | 67 / 8 |
| | da | 101 | 5-15 | 8 | 67 / 8 |
| | ar | 107 | 5-16 | 6 | 61 / 7 |
| | he | 96 | 5-15 | 8 | 54 / 6 |
| B02 (4-5) | en | 335 (200-450) | 17-29 (15-40) | 12 (14) | 112 / 8 |
| | da | 318 | 16-28 | 12 | 115 / 7 |
| | ar | 237 | 13-24 | 11 | 86 / 7 |
| | he | 275 | 14-25 | 13 | 92 / 7 |
| C01 (6-8) | en | 674 (450-900) | 34-61 (30-70) | 19 (20) | 231 / 11 |
| | da | 660 | 33-63 | 18 | 226 / 11 |
| | ar | 485 | 24-48 | 14 | 170 / 10 |
| | he | 525 | 26-55 | 15 | 179 / 10 |

Films: A04 160 s in 17 shots (brief 2 to 3 min), B02 263 s in 35 shots (4 to 5 min), C01 399 s in 50 shots (6 to 8
min). Every film has shots with no words and holds of 2 to 6 s, so a longer language can stretch. Activities: A04
10 min, one action repeated, 5 pictures. B02 15 min, 3 steps (the brief allows 2 or 3). C01 25 min, 5 steps.

What the checks found and I fixed while writing: 14 Arabic words not in pausal form before a colon, `!` or `؟`; one
Danish spread at 17 words (A04 page 9); one Hebrew sentence at 15 words (B02 page 11); one 21-word and one 22-word
sentence (C01 page 3, English and Danish).

## 3. Read-through on each style guide's 10-point checklist

I read every page and line of all three stories in each language against its checklist. A tick means I checked the
point and found nothing wrong. It does not mean a native speaker has approved it.

**Arabic (style-ar §10).** 1 ✓ everyday Standard Arabic; no dialect words. 2 ✓ machine-checked (§2). 3 ✓ by
construction. 4 ✓ hamza seats read by hand (دافِئة، حِذائِها، رائِحة، شاطِئ، أَسمائِها، النَتائِج، شَيئَه). 5 ✓
numbers are words. Counted pomegranates agree with feminine رُمّانة (عَشْرُ رُمَّانَاتٍ، سَبْعٌ لَكَ، ثَمَانِيَ
رُمَّانَاتٍ، ثَمَانٍ). Sums stated as pure numbers use the abstract school forms (سَبْعَةٌ وَثَلَاثَةٌ… عَشَرَةٌ), with
الْمَجْمُوعُ as the maths word. 6 ✓ refrains repeat mark for mark (عَلَى مَهْلٍ، عَلَى مَهْلٍ، مَعًا؛ وَالْمَطَرُ
يَطْرُقْ: طَقْ، طَقْ، طَقْ). 7 ✓ adults are addressed with verbal nouns, household plurals and impersonal forms. The
child reader is addressed in the plural too (B02: وَأَنْتُمْ، مَاذَا كُنْتُمْ سَتَفْعَلُونْ؟). 8 ✓ ledger spellings.
9 ✓ ، ؟ «». 10 ✓ nothing from §8 or §9.

**Hebrew (style-he §10).** 1 ✓ written fresh, not translated. 2 ✓ machine-checked for full pointing and shin dots. The
spelling aims at pointed spelling (שֻׁלְחָן، אֲדֻמִּים، שָׁלֹשׁ، מְאֹד، לִצְחֹק). Participles keep their vav (אוֹמֵר،
יוֹשְׁבִים), as modern pointed books do: see §4. 3 ✓ machine-checked. 4 ✓. 5 ✓ the A04 count is masculine with
רִמּוֹנִים. Counting aloud and pure sums use feminine forms, as the guide's §6 says. 6 ✓. 7 ✓ infinitives, plurals,
"הגננת או הגנן". 8 ✓. 9 ✓ dialogue introduced by a colon. 10 ✓.

**English (style-en §9).** All 10 ✓. British spelling (humour, colour); present tense in A04 and past in B02 and C01;
curly quotes; no semicolons in A or B; at most one exclamation mark per spread in B and C; effort praised, not
"clever".

**Danish (style-da §9).** All 10 ✓. »Guillemets«; no optional start comma (»Vis os hvad I har taget med«); bedstefar
in narration and dialogue, since the outline does not say which side of the family he is on.

**Other choices made, with the reason:**
- **Cast ids carry the story id** (`a04-sami`), because `src/cast/cast.ts` already has a sheet `sami` (an
  activity-cast toddler) and sheet ids must be unique. The schema example's plain `sami` would clash.
- **The Sheet type has no wheelchair.** The boy in B02 is described as using one in `manner` and in every art note.
  The Studio must add a wheelchair before drawing him. The book text never mentions it, so the story is not about it
  (`REVIEW.md` §5).
- **Unnamed characters** (B02's classmates and teacher; C01's seller, baker and doctor) are named by role, so no name
  was added outside the ledger. The ladybird (A04) is not a humanoid, so it has no sheet; the art notes describe it.
- **Every text zone is `full` (a band at the top or bottom).** The art does not flip for right-to-left, so a calm area
  on one side would put Arabic and Hebrew words over a busy part of the picture.
- **Emotion directions are in English in all four files.** They are production notes, like the art notes.
- **C01 page 14:** the outline's "split in the sun" became "split open, as very ripe pomegranates sometimes do".
  Sources say ripening fruit cracks mainly when a dry spell is followed by heavy water, not because of sun
  ([NHB pomegranate disorders](https://nhb.gov.in/pdf/fruits/pomegranate/pom003.pdf);
  [review, 2020](https://agris.fao.org/search/en/records/65dfb79e6eef00c2cea3295c), read as search summaries).
- **B02:** "it sings the sea" is Dalia's own phrase, never the narrator's claim. That keeps the story clear of the
  false idea that a shell holds the sea.
- **Emergency numbers** 101 (Israel) and 112 (Denmark) appear in every activity's safety line. Both are still [U] in
  the briefs and must be confirmed before publishing.

## 4. Words and lines I am least sure of, for the native editors

**Arabic**
1. **The L2 rule and a final shadda.** L2 strips every mark from a word's last letter, so a final doubled letter loses
   its shadda in the light layer: عَدَّ shows as عَد, ظَلَّ as ظَل, لَكِنَّ as لَكِن, أَيِّ as أَي, مُسَاعِدَيَّ as
   مُساعِدَي, سِنِّ as سِن. This is my strongest concern. I suggest adding "keep a shadda on the last letter" to L2's
   keep column.
2. **L5 and a sun letter.** After L5 removes the sun letter's shadda, its vowel stays (التَلّة، الطَبلة، الصَدَفة). The
   guide does not say whether it should. Also, الَّتِي shows as الّتي, because L8 keeps the shadda.
3. **Pausal forms.** Counting in pause (C01: وَاحِدْ، اثْنَانْ، ثَلَاثَةْ… even before commas) is a deliberate
   exception to F7. Pausal ـكِ and ـكَ lose the gender ending, so I reordered lines to avoid it (جَاءَ دَوْرُكِ يَا
   دَالْيَا).
4. **Words:** دُعْسُوقَة (ladybird: everyday enough?); زِيقْ for a rubber duck's squeak; طَقْ for rain on a roof;
   خَشْخاشة (rattle); بَسْطَة (stall); زَبُونَانِ; شْشْشْ (a hush written with sukuns, for the voice); اللَّابُورْنُوم
   (laburnum); "في إسرائيل" in the safety line (the alternative is في البلاد); Western digits in adult text.
5. **Lines:** A04 p1 يَقُولُ الْجَدّْ (narration uses الجَدّ, dialogue uses جَدّي); A04 f09 لِنَمْشِ مَعًا يَا جَدِّي
   (too formal for a toddler?); B02 p11 تُغَنِّي لَكُمُ الْبَحْرْ ("sings you the sea"); C01 p12 «لَا، لَا، اثْنَتَانِ
   لِي!»; C01 f25 سَآخُذُ ثَمَانِيًا!; C01 title عَشْرُ رُمَّانَاتٍ وَسَلَّتَانِ.

**Hebrew**
1. **Spelling:** pointed spelling for most words, but full spelling with vav in participles (אוֹמֵר، עוֹצֵר، הוֹלֶכֶת),
   and אֲגוּדָלִים، אֵיפֹה، קוֹנְכִיָּה. These need the editor's ruling (README Hebrew Q1).
2. **Stress mark placement.** I put the stress mark on the letter that carries the stressed vowel (שְׁתַּ֫יִם، לְמַ֫עְלָה),
   which is how Phonikud places it. The guide says "first letter of the stressed syllable", and these two differ
   after an initial shva. Past-tense forms like יָשְׁבוּ، אָמְרָה، צָחֲקוּ، הָיוּ are left final-stressed (the Academy
   form); everyday speech stresses the first syllable.
3. **Vocal shva:** I marked prefixes (וְ בְּ לְ מְ), an initial י ל מ נ ר, and תְּאֵנִים، תְּחַלְּקוּ، הַיְּרֻקָּה،
   הַמְּסֻדָּרִים، וּזְהֻבָּה. I left these unmarked: דְּבוֹרָה، בְּשֵׁלִים، הַסְּגוּרָה، וּדְבוֹרָה.
4. **Words:** פָּרַת מֹשֶׁה רַבֵּנוּ (the everyday word for ladybird, but it contains a religious figure; the alternative
   is חִפּוּשִׁית); רַבֵּ֫נוּ stressed on the second syllable; טִיף for rain; שְׁשְׁשׁ for a hush; לבורנום in adult text;
   יֹפִי (C01 p7).
5. **Lines:** B02 p5 קוֹנְכִיָּה לְבָנָה וּמְסֻלְסֶלֶת, עִם קְצָת וָרֹד; C01 p4 שִׁלֵּב אֶת הַיָּדַיִם ("folded his
   arms"); C01 p12 אֵיךְ שֶׁלֹּא נְחַלֵּק אוֹתָם, תָּמִיד יוֹצֵא עֶשֶׂר.

**English**
1. "bring-something day" (B02 p1): is it natural, or would "show-and-tell day" be clearer for families in Israel?
2. A04 "Step… tap" and the use of the present tense throughout A04.
3. C01 p8 "His tummy gave a jump".

**Danish**
1. Sound words: "tok" (the stick, chosen because "tak" means "thank you"), "dryp, dryp, dryp" (rain), "Fiiiiit"
   (whistle), "Piv" (rubber duck).
2. "Løb, løb, løb!" as a narrated chant (A04).
3. The spacing before "…" (written "løb …").
4. Titles: "Konkylien der synger" (no comma, by our start-comma rule), "Keglespil med ti", "Kiggerammen".
5. "Det gav et sæt i maven på ham" (C01 p8); "Sælgeren slog sin allerstørste latter op" (C01 p15); "saft" for the
   baker's juice.

## 5. Not done, and not checked

- No native speaker has read any language. The voice marks (Arabic full layer, Hebrew P1 to P3) are untested with the
  voice engine.
- No pictures, film or audio were made. That is the Studio's work, not part of this brief.
- The film timings are estimates. They need checking against a real voice read in each language.
