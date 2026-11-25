# Hebrew review of batches A and B (A01–A03, A05–A15, B01, B03–B15), 25 Nov 2026

**Result.** The Hebrew was in good shape. I found few real pointing errors. Most fixes were missing voice marks, a
few stiff or bookish lines, and adult text that spoke to one adult or used slang. I also applied the coordinator's four
decisions: B13 tiles are now yellow and green, B13's door is red, A15's crab is now a snail, and B14 already had its
seagull. I corrected only the Hebrew sources (`docs/story-room/pilots/src/<id>.he.json`) and rebuilt only the Hebrew
files with `storytool.py build he <ids>`. `storytool.py check` on all 28 stories reports **no errors**. The rebuilt
files are in Unicode NFC, with no invisible characters, no maqaf and no Latin letters in Hebrew text.
A01 and B05 needed no change. The pilots A04 and B02 were not touched. Nothing was committed.

I am a language model, not a native speaker. Section 4 lists what a native editor must still read.

Method: I read every page, film line and activity text of the 28 stories against `style-he.md`, the pilot review
(`pilots/REVIEW-he.md`) and the writers' notes. Scripts helped with five checks:
- every word whose first letter is one of בגדכפת, to check the dagesh;
- vav-conjunctive forms and the article before gutturals;
- the same word spelled two ways across the library;
- the same word with different voice marks in different stories;
- a list of every unmarked word of two or more syllables, read by eye for missing stress marks.

## 1. Corrections by type

| Type | Count |
|---|---|
| Display pointing and spelling (vav form, article, mappiq, pointed spelling) | 8 |
| Kamatz katan missing (P3) | 4 |
| Vocal shva missing (P2) | 2 |
| Stress marks added (P1); most are names and אִמָּא/אַבָּא/סַבְתָּא used across a story | about 154 marks in 25 stories |
| Stress marks removed for consistency (אֲבָל ×2, הִנֵּה ×1) | 3 |
| Story and film wording: register, natural speech, grammar, ambiguity | 27 |
| Coordinator decisions (B13 colours and door, A15 snail) | 3 stories |
| Adult activity text: wording, gender-neutral address, spelling, typography | 30 |

### 1.1 Pointing and spelling (shown text)

| Story | Before | After | Reason |
|---|---|---|---|
| A05 p1, f02 | וּוּשׁ | ווּשׁ | The first letter is a consonant v. As written, the voice would read "u-ush". Now matches B09. |
| B03 f17 | וְמִשְׁקְפֵי שֶׁמֶשׁ | **וּ**מִשְׁקְפֵי שֶׁמֶשׁ | The "and" becomes וּ before a letter with shva. |
| B03 p9 | וּבְסוֹף | וּ**בַסּוֹף** | "In the end" takes the article: ba-sof. |
| B14 f08 | אָהּ… | אָה… | A sigh; the mappiq made the final ה a consonant. Now matches pilot A04. |
| A12 p2 | פִּתְאוֹם | פִּתְאֹם | Traditional pointed spelling, as decided in the pilot and as B03 already wrote it. |
| A12 p10, f16 | גָּבוֹהַּ | גָּבֹהַּ | One spelling across the library (B09 has גָּבֹהַּ). |

### 1.2 Voice layer

- **Kamatz katan (P3):**
  - A03 f01: הַצָּ$הֳרַיִם (tsohorayim).
  - B08 p4, p8, f11: צִפָּ$רְנַיִם (tsipornayim), 3 places.
- **Vocal shva (P2):**
  - A13 p10: מְ%כֻדָּר (prefix מְ).
  - B06 f15: קוֹרְ%אִים (before a guttural, as in A15).
- **Stress marks on names (P1).** Names stressed on the first syllable now carry the mark everywhere, as SAmi, YAra,
  DIna and the others already did: לִ@ינָה (A03), רָ@פִי (B01), נִ@ינָה and רָ@מִי (B03), לָ@ארָה (B04),
  אַ@לְמָה (B07), הִ@יפּוֹ (A06).
- **Stress marks on common words (P1).** Some stories marked these words and others did not. They are now marked in
  every story:
  - אִמָּא, אַבָּא, סַבְתָּא (B03, B04, B06, B07, B08)
  - הַכּוֹ@בַע, אֶ@צְבַּע, אַ@רְבַּע, אֵ@יזֶה, רֵ@יחַ, יַ@חַד, מִתַּ@חַת
  - בּוֹ@אִי, בּוֹ@אוּ, הַחוּ@צָה, אֵ@לֶּה, לָקַ@חַת, כְּמוֹ@הוּ, פִּיגָ@׳מָה
- **Stress on past-tense verbs (P1):**
  - Hifil verbs stressed on the hiriq-yod: שֶׁהִרְגִּ@ישָׁה, הֵכִ@ינוּ.
  - Hollow verbs in the past: זָ@זוּ, שָׁ@רָה, שָׁ@רוּ. These are the stories' own convention (רָ@צָה, עָ@פוּ, בָּ@אוּ).
    Where the same word is present tense or means "wanted", it keeps final stress (רָצָה "wanted", שָׁרָה "she sings").
- **Removed:** the stress mark on אֲבָל (A14) and on הִנֵּה (B15). Every other story, and the pilots, leave these words
  with the Academy's final stress.

### 1.3 Story and film wording

| Story | Before | After | Reason |
|---|---|---|---|
| A03 p1 | "אִמָּא!" לִינָה רָצָה אֵלֶיהָ. | לִינָה קוֹרֵאת: "אִמָּא!" וְרָצָה אֵלֶיהָ. | Guide §7.2 and the pilot fix: the speaker comes first, then a colon. |
| A03 f08 | אוּף! הַיָּדַיִם שֶׁלִּי מְלֵאוֹת. | **אוֹהוֹ!** … | אוּף means annoyance; the direction says "not complaining". |
| A06 p2 | אַבָּא הִיפּוֹ פּוֹתֵחַ פֶּה גָּדוֹל. "זְמַן…" | … פֶּה גָּדוֹל. **הוּא אוֹמֵר:** "זְמַן…" | Says who speaks; each sentence stays within 8 words. |
| A08 p1 | אַבָּא מִתְכּוֹפֵף אֵלָיו. | … **אֶל אֵלִיאָס.** | "To him" came before the child had been named. |
| A10 p10 | אֶל הַפִּנָּה הַשְּׁמֻשָׁה | אֶל **פִּנַּת הַשֶּׁמֶשׁ** | שְׁמֻשָׁה is rare and bookish. |
| B03 p10 | וְכִי הָיָה כָּל כָּךְ חַם | **וּבִגְלַל שֶׁ**הָיָה כָּל כָּךְ חַם | וְכִי is archaic, and today means "is it that…?". |
| B04 p4 | הִסְתַּכְּלָה עַל כַּדִּים | … עַל **הַ**כַּדִּים | Natural Hebrew needs the article here. |
| B06 p9 | וְכָרְעָה לְיָדוֹ | **וְהִתְכּוֹפְפָה אֵלָיו** | Everyday verb; כָּרְעָה is formal. |
| B09 p1, f01 | הִגִּיעַ יוֹם הָרוּחַ הָרִאשׁוֹן שֶׁל הַסְּתָו | **בַּסְּתָו הִגִּיעָה הָרוּחַ הַחֲזָקָה הָרִאשׁוֹנָה** | יוֹם הָרוּחַ is not a Hebrew phrase. The writer flagged it as stiff. |
| B09 p7, f09 | נָטָה הַרְחֵק מִן הַיָּם | נָטָה **לַצַּד הֶהָפוּךְ מֵהַיָּם** | Literary; the new form is plain. Article הֶ before an unstressed הָ. |
| B09 p8 | קָפְצָה עַל הָרַגְלַיִם | **קָמָה בִּקְפִיצָה** | The idiom in Hebrew. |
| B09 p9 | הַשְּׂעָרוֹת | **הַשֵּׂעָר** | שְׂעָרוֹת means single hairs. |
| B10 p8 | הוּא לָקַח נְשִׁימָה | **הוּא נָשַׁם עָמֹק** | Calque of the English "took a breath". |
| B11 p5, B13 p3, B14 p9 | הֵנִיד בְּרֹאשׁוֹ | **הִנְהֵן** (B13: **הֵזִיז אֶת הָרֹאשׁ לְפִי הַקֶּצֶב**) | Literary. In B13 the head moves to the beat; it is not a "yes". |
| B11 p6, p8, p10 | תִּפֵּף | **תּוֹפֵף** | One verb pattern, matching מְתוֹפֵף and לְתוֹפֵף in the same story. |
| B11 p11 | לְשֵׁמוֹת אֲחָדִים | **לְכַמָּה שֵׁמוֹת** | אֲחָדִים is literary. |
| B12 p1 | סָחֲבוּ עֲרֵמָה שֶׁל חֲלָקִים שֶׁנִּשְׁאֲרוּ אֶל קְצֵה הַגִּנָּה | סָחֲבוּ **אֶל קְצֵה הַגִּנָּה** עֲרֵמָה … | As written, it read as "left over to the edge". |
| B12 p4 | מְקוֹמוֹ לְמַעְלָה | **הַמָּקוֹם שֶׁלּוֹ** לְמַעְלָה | Spoken register for a mother. |
| B12 p11, f13; B13 p11 | גָּמוּר | **מוּכָן** | גָּמוּר sounds stiff (the same fix as pilot C01). |
| B15 p6 | אֶל מֵאֲחוֹרֵי הַוִּילוֹן | מֵאֲחוֹרֵי הַוִּילוֹן | Plain form. |

### 1.4 Coordinator decisions

- **B13 tiles: yellow and green.**
  - The colour words changed: כָּחֹל→צָהֹב, לָבָן→יָרֹק, כְּחֻלָּה→צְהֻבָּה, לְבָנָה→יְרֻקָּה.
  - The chant is now "צָהֹב, יָרֹק, צָהֹב, יָרֹק". Both words are two syllables stressed on the last, so it still keeps the beat.
  - The odd tile is "יָרֹק אַחֲרֵי יָרֹק", as in the English.
  - The Hebrew title stays neutral: שְׁבִיל הַמַּרְצָפוֹת.
- **B13 door: red.** הַדֶּלֶת הַיְּרֻקָּה became הַדֶּלֶת **הָאֲדֻמָּה**, 3 times. The article is הָ before the guttural.
- **A15 crab: now a snail.**
  - p5: חִלָּזוֹן קָטָן מֵצִיץ מֵהַבַּיִת שֶׁלּוֹ. "Its house" is how Hebrew toddler songs name a snail's shell.
  - p10 and f15: הַחִלָּזוֹן מְטַפֵּס עַד לְמַעְלָה.
- **B14: seagull.** It was already in place (שַׁחַף, שְׁחָפִים); nothing to change.

### 1.5 Adult activity text (unpointed)

- **Speaking to the adult without imperatives** (guide §4.3). Commands to the adult alone became impersonal forms:
  - B10: שבו… הראו → יושבים… ומראים
  - B11: הפכו… התחילו… תופפו → הופכים… המבוגרים מתחילים… מתופפים
  - B14: שאלו… עזרו → שואלים… עוזרים
- **No assumed single adult or single child:**
  - B15: "המבוגר" became "המבוגרים" (3 places).
  - B13 step 3: "בשביל המבוגרים".
  - B09: "בגובה של הילדים".
  - A14: "בשביל ילדים קטנים".
  - A07: "נושף הילד השני" became "נושפים בחזרה".
  - B08: "ילד אחד או ילדה אחת".
- **Clarity:**
  - B01: the adult takes the pinecone, not the child with closed eyes.
  - B06: "אומר לה" became "אומר לעובדת".
  - A12: "המותניים" became "הגומי של המכנסיים".
  - A13: "הדובי" became "הבובה", the toy the text had just named.
  - A15: "תורות" (also "Torahs") became "שלהתחלף עובד יותר טוב מלמשוך".
  - A11: "להתאמן בגדול" became "בתנועות גדולות".
- **Register:**
  - A10: "לאיך שדברים מרגישים" became "למה שהידיים מרגישות".
  - B08: "בכאילו" became "של משחק".
  - B10: "חיתול בכאילו" became "לשחק בהחלפת חיתול".
- **Spelling and typography:**
  - A02: "צפור" became "ציפור".
  - A11: "לעתים" became "לעיתים" (Academy full spelling).
  - B12: "גדול מדי מכדי" became "גדול מכדי".
  - B13: "..." became "…".
  - A05: step 4 is now in the infinitive.
- **Noun gender:** גרב is masculine everywhere (A14, B14), to match A02. The Academy allowed both genders in 2021, but
  one form across the library is clearer.

## 2. Decisions

1. **Pilot conventions kept:**
   - traditional pointed spelling, with vav in participles;
   - Academy final stress on regular past-tense verbs;
   - vocal shva on prefixes, on initial י ל מ נ ר, before gutturals, on identical letters, and on the second of two shvas;
   - straight quotation marks and "…";
   - no maqaf.
2. **Hollow-verb past forms are marked first-syllable** (רָ@צָה, שָׁ@רָה, זָ@זוּ, קָ@מָה), as most writers already did,
   because speech never varies on them. Present-tense and "wanted" forms keep final stress.
3. **One form per word across the library:**
   - spellings פִּתְאֹם and גָּבֹהַּ;
   - stress on אִמָּא, אַבָּא, סַבְתָּא, יַחַד, מִתַּחַת and the names;
   - no stress mark on אֲבָל and הִנֵּה.
4. **A15 crab:** Hebrew has no neutral word for crab, so the snail is the right fix. A13 also has a snail; the two
   stories do not clash.
5. **Safety line:** all 28 activities end with "אם קורית תאונה, מתקשרים למספר החירום המקומי." Unchanged.
6. **Content:** I found no religious, political or national content, no excluded food and no shaming label. The B13
   colour change removes the one national echo ("כחול-לבן").

## 3. Names for the ledger (`outlines.md`, not edited by me)

All lead names match the ledger letter for letter. Hebrew names that need adding:

| Story | Character | Hebrew |
|---|---|---|
| A02 | the sparrow; the old knitter | צִפּוֹר הַדְּרוֹר; הָאִישׁ הַזָּקֵן |
| A05 | Little Camel; Mother Camel | הַגָּמָל הַקָּטָן; אִמָּא |
| A06 | Little Hippo; Papa Hippo | הִיפּוֹ הַקְּטַנָּה; אַבָּא הִיפּוֹ |
| A10 | Cloud the cat | עֲנָנָה (feminine, chosen over the suggested עָנָן) |
| A12 | Teddy | דֻּבִּי |
| A13 | Little Hedgehog; Mama Hedgehog | קִפּוֹד קָטָן; אִמָּא קִפּוֹדָה |
| B01 | Speckle the goat | נְקֻדָּה |
| B11 | the boy; Tala's mother | יֶלֶד; אִמָּא שֶׁל טָלָה |
| B15 | the classmate | יֶלֶד מֵהַגַּן |

**Suggestion:** add the stress to the ledger for names stressed on the first syllable, so every writer marks them the
same way: לִ@ינָה, סָ@אמִי, יָ@ארָה, דִּ@ינָה, אֵ@לָה, נַ@דְיָה, מָ@איָה, רָ@פִי, דַּ@לְיָה, נִ@ינָה, רָ@מִי, לָ@ארָה, כֶּ@רֶם,
אַ@לְמָה, רִ@יטָה, זַ@כִּי, טָ@לָה, דָּ@נָה.

## 4. What a native Hebrew editor should still read

1. **Stress of three names:**
   - אֵלָה (A10, marked ELa). The Hebrew word אֵלָה is eLA.
   - אֵלִיאָס (A08, left unmarked).
   - הִיפּוֹ (marked HIpo).
2. **The careful forms the voice will say** need a test with the real voice:
   - past tense with final stress (אָמְרָה, הָיְתָה);
   - הִנֵּה and אֲבָל left with final stress;
   - a doubled letter left silent (חִיְּכָה).
3. **Sound words:**
   - שְׁפְּרִיץ (A06, colloquial)
   - הַם, הַם (A08)
   - רַחְרַח (A10, A13)
   - אִנְגֶּה (B10, and where its stress falls)
   - דִּינְג for goat bells (B01)
   - אוֹהוֹ (A03, new)
   - חְרַק, טְרַח, פְּלַאק (B07)
4. **Lines to read aloud:**
   - A05 הַגַּבְשׁוּשִׁיּוֹת and the participle refrain
   - A09 refrain יָדַיִם אָחוֹרָה
   - A15 new line: מֵצִיץ מֵהַבַּיִת שֶׁלּוֹ
   - B01 p1: habitual past with בְּכָל עֶרֶב
   - B07 בֻּבַּת שֶׁלֶג
   - B09 new p1, p7, p8
   - B11 syllable claps אֲ, בַ, טִּי, חַ (four beats for אבטיח)
   - B13 the new yellow-green chant
   - B15 "לָקַחְתָּ אֶת הַזְּמַן שֶׁלְּךָ" (a calque from English, but common in speech)
5. **All my new wording** (sections 1.3 to 1.5) has not been read by a second Hebrew speaker.
6. **Spelling policy** (pilot decision 1) is still open for the editor. Words that depend on it include שַׁרְווּל,
   אֲגוּדָל, וָוִים and קוֹרְקִינֶט.
