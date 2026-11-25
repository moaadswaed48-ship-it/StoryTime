# Batch A1 notes: stories A01, A02, A03, A05, A06, A07, A08 (ages 2 to 3), 25 Nov 2026

**Result.** Seven stories are written in full in four languages: book, film script with shot list, activity, and
character sheets. They follow the reviewed outlines and the pilot format. The check tool reports **no errors** for
all seven. They are a writer's draft: no native speaker has read any language yet, and §4 lists the lines I trust
least. I am a language model; I do not claim native certainty in any of the four languages.

**Files.** `content/stories/{a01,a02,a03,a05,a06,a07,a08}/` (`story.json`, `cast.json`, `ar.json`, `he.json`,
`en.json`, `da.json`) and `docs/story-room/pilots/src/<id>.ar.json` and `<id>.he.json` for the same seven ids. The
Arabic and Hebrew files in `content/` were generated from those sources by the tool, never typed.

---

## 1. Counts (from the check tool, last run: no errors)

The brief's limits (40 to 150 words, 3 to 15 a spread, 8 words a sentence, 8 words a caption) bind English and
Danish; Arabic and Hebrew must stay under the cap and the sentence limit.

| Story | Spreads | Film | ar | he | en | da | Longest sentence (en / da / ar / he) |
|---|---|---|---|---|---|---|---|
| A01 One, Two, Three, Wheee! | 11 | 160 s, 17 shots | 88 | 89 | 106 | 105 | 8 / 8 / 6 / 7 |
| A02 The Sparrow's Warm Nest | 11 | 158 s, 17 shots | 97 | 103 | 120 | 120 | 8 / 8 / 7 / 8 |
| A03 Thank You, Mama | 10 | 151 s, 16 shots | 82 | 85 | 100 | 84 | 8 / 7 / 7 / 7 |
| A05 Little Camel Shakes the Sand | 11 | 155 s, 16 shots | 88 | 94 | 103 | 104 | 8 / 8 / 8 / 8 |
| A06 Little Hippo's Big Yawn | 11 | 151 s, 16 shots | 85 | 86 | 99 | 98 | 7 / 7 / 6 / 6 |
| A07 Boom, Says the Sky | 11 | 157 s, 16 shots | 83 | 88 | 96 | 98 | 6 / 6 / 7 / 7 |
| A08 After the Nap | 11 | 154 s, 15 shots | 89 | 104 | 122 | 109 | 7 / 8 / 7 / 6 |

Words per spread stay between 4 and 15 in every language. The longest film caption is 8 words (English and Danish).
Every film has at least one shot with no words and ends on a still image held about 6 s, with no autoplay. A refrain
returns on at least two of every three spreads. Activities: 5 minutes (A06) or 8 minutes (the rest), one action
repeated, 4 picture steps (A07 has 5, the last one hand-washing). Every safety line ends with the general emergency
line, not numbers, as in the reviewed pilots.

## 2. Choices I made, with the reason

- **Animals have character sheets** (`a02-sparrow`, `a05-little-camel`, `a05-mother-camel`, `a06-little-hippo`,
  `a06-papa-hippo`), because they speak in the films and the tool requires a sheet for every speaker. The `Sheet`
  type has no animal body, so the human fields are placeholders and `manner` says how to read the colours and that
  the Studio must add an animal body. Background figures have no sheet: the pigeons (A01), the market sellers (A02),
  the lizard (A05), the toy lamb (A07), the goldfish (A08).
- **Translated names**, for the name ledger (I may not edit `outlines.md`): Little Camel = الجَمَل الصَغير,
  הַגָּמָל הַקָּטָן, Lille Kamel; Mother Camel = ماما, אִמָּא, Mor Kamel; Little Hippo = فَرَس النَهر الصَغيرة,
  הִיפּוֹ הַקְּטַנָּה, Lille Flodhest; Papa Hippo = بابا, אַבָּא הִיפּוֹ, Far Flodhest. The sparrow (she) = العُصفورة,
  צִפּוֹר הַדְּרוֹר (צִפּוֹר keeps her feminine; דְּרוֹר alone is masculine), spurven. The old knitter =
  العَجوز الطَيِّب, הָאִישׁ הַזָּקֵן, the old man, den gamle mand.
- **Counting.** Arabic counts aloud with the counting forms واحِد، اثنان، ثَلاثة (style-ar §6.3), even though the
  steps and pigeons are feminine nouns; written amounts agree (ثَلاثُ دَرَجاتٍ، ثَلاثُ حَماماتٍ). Hebrew counts aloud
  in the feminine (אַחַת, שְׁתַּיִם, שָׁלֹשׁ; style-he §6), and the counted nouns are feminine anyway (מַדְרֵגוֹת, יוֹנִים).
- **A05 in Arabic:** a camel has four knees and four feet, so the book says رُكَبِه and أَقدامِه (plurals); the
  activity, about the child's own body, uses the duals.
- **A03 in Arabic:** "here you are" depends on who receives (تَفَضَّلْ / تَفَضَّلِي). Lina says تَفَضَّلي to Mama; the
  adult text explains both forms and says a mix-up does not matter.
- **A08 activity:** the three pictures are laid one under the other, not in a row, because one picture serves
  right-to-left and left-to-right readers.
- **A06 activity:** no toothpaste amount is given; every language says "as much as your dentist or clinic advises".
- **A07:** lightning is shown only as a soft glow, never a bolt; every boom comes after its glow and is kept quiet.
- **No falling leaves** in A08 (autumn): the tree keeps its leaves (outline rule).
- **Gender-neutral adult text:** Arabic uses verbal nouns, the household plural and الصِّغار; Hebrew uses infinitives,
  plurals and "הגננת או הגנן".

## 3. What the check tool would need (I did not edit it)

1. `STORIES` in `storytool.py` lists only the pilots, so `build` and `check` skip every new story. I ran both through
   a small wrapper that sets `STORIES` to my seven ids (no change to the tool). Suggestion: let `build` and `check`
   take story ids as arguments, or read every folder in `content/stories/` that has a source file.
2. The Arabic full-mark check cannot accept a stretched sound word (ويييي, every letter must carry a mark), so
   "Wheee" became one syllable, وي (see §4).
3. The Hebrew word count splits a word at a geresh (אַפְּצִ׳י counts as two words). Harmless here, but worth fixing.
4. The `Sheet` type needs an animal body (see §2).

## 4. Lines I am least sure of, for the native editors

**Arabic**
1. **وي for "Wheee"** (A01, eight times). On screen it can be read وَيْ ("woe"). Alternatives: هوب، يااااه, or a tool
   exception for stretched sound words.
2. **Word choices:** الزَلّاقة for a playground slide (spoken: زحليقة); بَندورة (A02; Standard طماطم); تَنُطّ for a
   sparrow's hop; السُكوتَر (A03, a loanword) and شِبشِب for slippers; القَيلولة for a kindergarten nap (A08);
   تَبرُك for a kneeling camel (A05, Standard-only, pictured); شَهيق… زَفير… as toddler breathing words (A07).
3. **Sound words:** طَنّ (keys, A03); هَزّ، رَفّ، طَقّ، دَبّ، أَتشو (A05); فَرك for brushing teeth (A06); بوم for
   thunder (A07); تِك for knitting needles and زَقزَق for the sparrow (A02); فوش، فوه (wind and a breath).
4. **Grammar to confirm:** A02 p6 «لا أَصفَرُ، ولا أَخضَرُ، ولا أَحمَرْ» (an elliptical list with رفع after a repeated
   لا; an editor may prefer لا الأصفرَ…); the name فَرَس النَهر الصَغيرة (فرس taken as feminine); A07 p3 ثُمّْ… with a
   pausal sukun on the shadda.
5. **Lines:** A01 f10 سَأَدفَعُكَ يا بابا; A05 f19 نَظيف! كُلّي نَظيف!; A06 f17 تُصبِح على خَيرٍ يا بابا; A08 p1
   «بَعدَ القَيلولةِ، أَرجِعْ» (أرجع rather than أعود, by style-ar §1.1); A02 f16 صَباحُ الخَيرِ يا عُصفورة.

**Hebrew**
1. **Sound words:** וִייי (Wheee); הוֹפּ; טִיק (knitting needles); צִיף (the sparrow); וּוּשׁ; אַפְּצִ׳י; פּוּ; שְׁפְּרִיץ
   (A06, splash: may be too colloquial); הַם, הַם (A08, eating).
2. **Names:** הִיפּוֹ (a colloquial short form of הִיפּוֹפּוֹטָם; the formal word is סוּס יְאוֹר); צִפּוֹר הַדְּרוֹר.
3. **Stress marks I placed:** יָ֫ארָה (YAra); הַכּוֹ֫בַע on the holam vav; פְּנִ֫ימָה, הַחוּ֫צָה, מִתַּ֫חַת, אֵ֫צֶל; אַרְגַּז left
   final-stressed.
4. **Vocal shva I marked:** מְצַחְצְחִים (both), מְלָפְפוֹנִים (identical letters), תִּפְתְּחִי, הַמַּפְתְּחוֹת, מַסְרְגוֹת. Left
   silent: הוֹלְכִים, יוֹשְׁבוֹת, נוֹפְלִים, כְּבֵדִים, צְהֻבִּים.
5. **Lines:** A01 p5 הַבִּרְכַּיִם שֶׁלּוֹ מַגִּיעוֹת עַד הָאָזְנַיִם; A05 p6 הַגַּבְשׁוּשִׁיּוֹת (knobbly); the A05 refrain of
   participles used as sound words (מְנַעֵר, מְנַפְנֵף, מִתְנַעְנֵעַ, מִתְקַפֵּל, רוֹקֵעַ); A03 p6 נוֹפְלִים לָאָרֶץ; A06 p11
   עֲיֵפָה for "sleepy"; A07 title בּוּם, אוֹמְרִים הַשָּׁמַיִם; A08 אַחֲרֵי הַשֵּׁנָה for "after the nap" and
   אֲרוּחַת עֶשֶׂר for the snack.
6. **Adult text:** גרביים treated as masculine (the Academy's gender; many speakers say "שתי גרביים"); "טיפת חלב".

**English**
1. "Wheee" (three e's); inverted lines for rhythm: "Down slides Papa", "Up go the pigeons".
2. A02 "Too squishy"; A05 "Bend, bend!" for knees; A06 "Night-night, Papa"; A08 "stripy sleeve".
3. Papa and Mama, as the outlines name them, rather than the guide's British Mum and Dad.
4. A07 "BOOM! says the sky" (a sound given to the sky, from the outline's title).

**Danish**
1. Sound words: "Wiii", "Plop", "Flap, flap, flap" (wings), "Vuuush", "Vift" (ears), "Vrik", "atju", "Fuuu",
   "Klirr", "Mums".
2. Names: Lille Kamel, Mor Kamel, Lille Flodhest, Far Flodhest; "far", "mor" and "bedstemor" in lower case (A07 does
   not say which side of the family Grandma is on).
3. Lines: A01 p6 "Far kommer ingen vegne"; A02 p11 "På det blå synger hun"; A06 p2 »Så skal der børstes tænder!« and
   p7 »Gab op!«; A07 "stille og stillere"; A08 "luren" for the nap and "mad" for the snack.
4. A06 names "sundhedsplejersken", a Danish role with no exact Israeli match.

## 5. Not done, and not checked

- No native speaker has read any language. The voice marks (Arabic full layer, Hebrew P1 to P3) are untested with
  the voice engine.
- No pictures, film or audio were made; film timings are estimates to check against a real voice read.
- The translated names are not yet in the name ledger (`outlines.md` was outside my brief).
