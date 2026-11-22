# Hebrew review of the three pilots (A04, B02, C01), 22 Nov 2026

**Result.** The Hebrew was in good shape. I found no wrong vowel, dagesh, hataf or mappiq in the text a reader sees,
and no wrong article or vav form. I made 36 corrections: 4 number-gender errors in the numbers story (C01), 7 missing
voice marks, 7 wording changes for register or naturalness, 15 fixes in the adult activity text, and 3 emergency lines
replaced at the coordinator's request. I corrected the sources in `docs/story-room/pilots/src/*.he.json` and
rebuilt only the Hebrew files, so the Arabic files were not touched. `storytool.py check` then reported no errors.
The rebuilt files are in Unicode NFC, with no invisible characters and no Latin letters.

Method: I checked every word of every page and film line, letter by letter. Checks included vowels, dagesh (lene and
forte), shva (whether it is pronounced and the voice mark it needs), hataf vowels, mappiq, the article before
gutturals, vav-conjunctive forms, construct state, binyan, agreement and number gender. A script listed every word
with a shva so the marking could be audited. I compared meaning against the English files.

## 1. Corrections by type

| Type | Count |
|---|---|
| Number and noun gender agreement (C01) | 4 |
| Voice layer: missing stress mark (P1) | 2 |
| Voice layer: missing vocal-shva mark (P2) | 5 |
| Register and natural wording in story and film text | 6 |
| Dialogue punctuation (guide §7.2) | 1 |
| Adult activity text: meaning, wording, gender-neutral address | 10 |
| Adult activity text: punctuation | 3 |
| Adult activity text: hard-to-read word (ספרות) | 1 |
| Adult activity text: brand word replaced | 1 |
| Safety line: emergency numbers replaced (coordinator's request) | 3 |
| **Total** | **36** |

Display-layer pointing errors (vowels, dagesh, hataf, mappiq, article, vav): **0 found.**

## 2. Every correction

### Story and film text (pointed)

| # | Where | Wrong | Right | Rule or reason |
|---|---|---|---|---|
| 1 | C01 p8 | תֵּשַׁע? הָיוּ עֶשֶׂר. אִבַּדְנוּ אֶחָד! | …הָיוּ **עֲשָׂרָה**… | "There were ten" counts pomegranates (רִמּוֹן, masculine), so the masculine form עֲשָׂרָה is needed. The next word, אֶחָד, is already masculine. |
| 2 | C01 f18 | the same line | the same fix | as 1 |
| 3 | C01 p11 | שִׁבְעָה, וּשְׁנַיִם, וְאֶחָד בַּיָּד שֶׁלִּי… זֶה שׁוּב עֶשֶׂר | …זֶה שׁוּב **עֲשָׂרָה** | The parts are masculine counts of pomegranates, so the total must be masculine too. Pure sums (שֶׁבַע וְשָׁלֹשׁ… עֶשֶׂר) stay feminine, per guide §6. |
| 4 | C01 f24 | …שׁוּב עֶשֶׂר | …שׁוּב **עֲשָׂרָה** | as 3 |
| 5 | C01 p15, f40 | כַּמָּה (unmarked) | כַּ֫מָּה | P1: כַּמָּה is stressed on the first syllable (KAma), so it needs the stress mark. 2 corrections. |
| 6 | C01 p13 | נוֹפְפוּ | נוֹפְ**ֽ**פוּ | P2: a shva under the first of two identical letters is pronounced (nofefu). |
| 7 | C01 p12 | נָצְצוּ | נָצְ**ֽ**צוּ | as 6 (natsetsu) |
| 8 | C01 p15 ×2, f40 | גַּרְגְּרִים, הַגַּרְגְּרִים | גַּרְגְּ**ֽ**רִים | P2: of two shvas in a row inside a word, the second is pronounced (gargerim). 3 corrections. |
| 9 | B02 p1 | הַיּוֹם כָּל הַיְּלָדִים הֵבִיאוּ… | **בְּאוֹתוֹ בֹּקֶר** כָּל הַיְּלָדִים הֵבִיאוּ… | הַיּוֹם ("today") reads oddly in past-tense narration. |
| 10 | B02 p10 | עַד מְהֵרָה נִשְׁאַר רַק קוֹל אֶחָד | **וּבְסוֹף** נִשְׁאַר רַק קוֹל אֶחָד | עַד מְהֵרָה is literary, above the 4-to-5 register. |
| 11 | C01 p12, f28 | אֵיךְ שֶׁלֹּא נְחַלֵּק אוֹתָם | **לֹא מְשַׁנֶּה** אֵיךְ נְחַלֵּק אוֹתָם | אֵיךְ שֶׁלֹּא is slangy. לֹא מְשַׁנֶּה אֵיךְ is just as natural and standard. 2 corrections. |
| 12 | C01 p4 | הָעֲבוֹדָה גְּמוּרָה. | הָעֲבוֹדָה **נִגְמְרָה**. | גְּמוּרָה sounds stiff and translated. The new word's second shva is marked as pronounced (nigmera). |
| 13 | C01 f09 | הָעֲבוֹדָה גְּמוּרָה. | **זֶהוּ. גָּמַ֫רְנוּ.** | Liam's smug line now sounds like a child talking. |
| 14 | A04 p4 | "בּוֹא, סַבָּא!" סַבָּא מְחַיֵּךְ… | **סָאמִי קוֹרֵא:** "בּוֹא, סַבָּא!"… | Guide §7.2 wants dialogue introduced with a colon. It also tells the reader who is calling. |

### Adult activity text (unpointed)

| # | Where | Change | Reason |
|---|---|---|---|
| 15 | A04 forAdult | מאט ללכת ← מאט והולך | The old wording was ungrammatical. |
| 16 | A04 forAdult | ונותנת למבוגרים רגע לתת לו שם ← ונותנת למבוגרים ולילדים רגע לומר יחד את שמו | The old wording repeated נותנת/לתת. The new one keeps the English "you both". |
| 17 | A04 forAdult | Plant list: the elliptical "אף פעם לא הרדוף…" became "יש צמחים רעילים: בישראל, למשל, הרדוף, לוף וקיקיון; בדנמרק, טקסוס ולבורנום" | Clearer, and closer to the English meaning. |
| 18 | A04 forAdult, A04 inClass | Removed the full stop after a quotation that ends in "!" | Hebrew punctuation (2 corrections). |
| 19 | B02 forAdult | The same full-stop fix after "זכרת בדיוק מה סבתא אמרה!" | Hebrew punctuation |
| 20 | B02 safety | דוקרים איתו ← דוקרים בו | Standard usage |
| 21 | B02 inClass | Rewrote the muddled order of who speaks and who repeats. It now matches the English: the adult speaks first, then repeats what the first child said, then the game goes round. | Meaning |
| 22 | C01 forAdult | שאיך שלא מחלקים… שני החלקים תמיד יוצאים עשר ← שלא משנה איך מחלקים… שני החלקים ביחד תמיד יוצאים עשר | Matches fix 11 |
| 23 | C01 forAdult | (כאן ספרות זה בסדר) ← (כאן אפשר לכתוב במספרים, כמו 3 או 7) | ספרות also means "literature", so the old wording was ambiguous. |
| 24 | C01 forAdult | סלוטייפ ← נייר דבק | Generic word instead of a brand |
| 25 | C01 forAdult | זה בדיוק ← זה הזמן המתאים | The old wording was unclear. |
| 26 | C01 forAdult | "Harder" option: "a target of exactly twenty" became "לשחק שלושה סבבים ולחבר את שלוש התוצאות" | Restores the meaning of the activity |
| 27 | C01 inClass | המורים עוברים ← המבוגרים עוברים | Guide §4.5: do not assume who the adult is or how many there are |
| 28 | C01 step 5 | שני סבבים? לחבר אותם. ← אחרי שני סבבים: לחבר את התוצאות. | "Add the rounds" became "add the scores", which is clearer. |
| 29 | All three safety lines | חירום: 101 בישראל, 112 בדנמרק. ← אם קורית תאונה, מתקשרים למספר החירום המקומי. | Coordinator's request, to match the English and Danish (3 corrections). It is impersonal, so no gender is assumed. |

## 3. Decisions

1. **Spelling in pointed text: traditional pointed spelling (כתיב חסר מנוקד), kept and applied consistently.**
   - The Academy's rules for full spelling (כללי הכתיב המלא, 2017) are written for unpointed text. Pointed text follows
     the traditional spelling.
   - Reference sources describe pointed spelling as the norm in children's books.
   - I could not find a published Academy rule that names children's books, and the Academy site blocked automatic
     downloads. I also could not survey current publishers' practice. Some modern picture books mix in full spelling.
   - So the decision stands on the Academy principle, and the editor should still confirm it.
   - The texts already follow it: שֻׁלְחָן, כֻּלָּם, אֲדֻמִּים, מְאֹד, זֹאת, אָדֹם, אָרֹךְ, שָׁלֹשׁ, לִצְחֹק, אֹזֶן, יֹפִי, אֵיפֹה.
2. **Participles are spelled with vav (אוֹמֵר, הוֹלֶכֶת, עוֹצֵר, מוֹכֶרֶת).** This is the standard modern pointed
   spelling used in dictionaries and school texts. The defective form (אֹמֵר) is biblical. This is consistent with
   decision 1, not an exception to it.
   - Other words with a vowel letter are also standard: גָּדוֹל, דְּבוֹרָה, קוֹנְכִיָּה, מַשְׁרוֹקִית, אֲגוּדָל,
     סָגוּר and סְדוּקָה (passive participles), שְׁמוֹנֶה.
3. **Stress mark placement.** The stress mark sits on the letter that carries the stressed vowel (שְׁתַּ֫יִם), as
   Phonikud places it.
   - The guide's speech layer exists to follow Phonikud's marks, so its wording "first letter of the stressed
     syllable" should be changed to match. Only words that begin with a cluster are affected.
   - I did not edit `style-he.md`, which is outside this review's scope.
   - Past-tense forms are left with the Academy's final stress (אָמְרָה, צָחֲקוּ, הָיוּ, נִגְמְרָה), as the writer had them.
4. **Vocal shva (P2).** The writer's convention is consistent, so I kept it. A shva is marked as pronounced in these
   cases:
   - on prefixes (וְ בְּ לְ מְ)
   - on a first letter י ל מ נ ר
   - before a guttural (תְּאֵנִים, תְּחַלְּקוּ)
   - after the article on י and מ (הַיְּלָדִים, הַמְּסֻדָּרִים)

   It is left silent:
   - in initial clusters (דְּבוֹרָה, קְטַנִּים, בְּשֵׁלִים)
   - under a doubled letter in everyday speech (חִיְּכָה, שִׁלְּמָה, חִפְּשָׂה, סַפְּרִי, הִסְתַּכְּלָה)

   I added the two cases that speech does not vary on: identical letters, and the second of two shvas in a row.
5. **Dagesh after the article in a letter with shva** (הַיְּלָדִים, הַסְּגוּרָה, הַשְּׂפָתַיִם) is kept, as in modern
   pointed texts. The Bible often omits it. The Academy's own niqqud rules were not readable online, so I am not sure
   of its exact ruling. This is listed for the editor.
6. **Numbers.** Counted pomegranates, seeds and customers are masculine. Pure sums and counting aloud are feminine.
   Within a sentence, all the numbers share one gender.
7. **The ladybird: kept as פָּרַת מֹשֶׁה רַבֵּנוּ.**
   - It is the only everyday name a two-year-old hears in every Israeli home. In daily speech it is a plain animal
     name, much like English "ladybird" (Our Lady) and Danish "mariehøne" (Mary's hen), which the sister files keep.
   - Moses is shared by Judaism, Christianity and Islam (Musa), which fits guide §5.3.
   - The alternative חִפּוּשִׁית means any beetle. It would sound odd and teach the toddler a vaguer word.
   - Pointing: פָּרַת (construct state), מֹ֫שֶׁה, רַבֵּ֫נוּ (stress on בֵּ, as in every ‑ֵנוּ suffix). All correct.
8. **Quotation marks** are straight double quotes, as in the guide's own example. Ellipsis is "…". There is no
   maqaf, as guide rule H8 requires.

## 4. What a native Hebrew editor should still read

I am a language model, not a native speaker. I can make mistakes in fine points of pointing and in how natural a line
sounds. Please read these first:

1. **The spelling policy**, which is decision 1. It also matters which way current children's publishers go.
2. **Vocal shva under a doubled letter** (חִיְּכָה, שִׁלְּמָה, נִגְּבָה, חִפְּשָׂה, תְּחַלְּקוּ) and **past-tense
   stress** (אָמְרָה, הָיוּ). Should the voice say the careful forms (chiyecha, amRA) or the everyday ones? Test both
   with the voice.
3. **Dagesh after the article in a letter with shva** (decision 5). Please check it against the Academy's niqqud rules.
4. **Stress of the name לִיאַם.** I left it with the default final stress (liAM). Some speakers say LIam.
5. **Lines to read aloud:**
   - B02 p5: עִם קְצָת וָרֹד
   - B02 p11: הִיא שָׁרָה אֶת הַיָּם
   - C01 p5: חִלַּקְנוּ בְּצֶדֶק (natural, or שָׁוֶה בְּשָׁוֶה?)
   - C01 p7: the narrator's יֹפִי
   - C01 p3: תְּחַלְּקוּ לָהֶם?
   - B02 sound words: טִיף, שְׁשְׁשׁ (with no marks, the voice should read it as a hush)
   - A04: טַק
6. **Plant names in A04's adult text:** please check that לבורנום and טקסוס are the names Israeli parents would
   recognise.
7. **My new wording** (fixes 9 to 14 and 21) was never read by a second Hebrew speaker.
