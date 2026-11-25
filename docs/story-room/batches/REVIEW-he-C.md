# Hebrew review of stories C02 to C15 (ages 6-8), 25 Nov 2026

**Result.** The Hebrew of all fourteen stories was read word by word: every page, film line, title, name and activity
text, against `style-he.md`, the pilot review `pilots/REVIEW-he.md` (C01 as the standard), `age-6-8.md`, the writers'
notes and `DECISIONS.md`. The writing was already good: the display pointing had very few real errors. I made about
120 targeted corrections and about 90 voice-mark harmonisations. The large change is **C07**: Noah's aunt now walks
with the children and holds his hand at every crossing, mirroring the English. The coordinator's three fact changes
(C07, C10, C15) are applied. Sources were corrected in `docs/story-room/pilots/src/<id>.he.json` and the Hebrew
files rebuilt with `storytool.py build he c02 … c15`. `storytool.py check c02 … c15` reports **no Hebrew errors**. The
errors it does list are Arabic light-layer errors, and those belong to the Arabic reviewer, who is still working. No
other language's file was touched, and nothing is committed.

Method:
- I read every line against the English for meaning.
- A script checked every word for:
  - the article and prepositions before gutturals;
  - dagesh after the article;
  - word-initial begadkefat;
  - vav forms;
  - final kaf;
  - Latin letters, invisible characters, maqaf, gershayim and spacing before punctuation.
- A second script listed past forms that should carry the stress mark and do not:
  - hollow verbs: עָפָה, רָצוּ;
  - hif'il 3rd person: הֵרִימוּ, הִנִּיחוּ.
- After the rebuild I confirmed three things for every story:
  - the source and the built file agree;
  - no voice mark leaks into the display text or the names;
  - no spread has more than one exclamation mark.

## 1. Corrections by type (all stories)

| Type | About | Examples |
|---|---|---|
| Real pointing / grammar errors in the display text | 4 | C05 וְמִלְמֵל → **וּמִלְמֵל** (vav before מ); C06 חָלִיל עֵץ → **חֲלִיל עֵץ** (construct state); C11 מַסְפִּ֫יקָה had a wrong stress mark (the participle is final-stressed; sentence rewritten); C13 אִצְטְ֯רֻבָּלִים vocal-shva mark removed (said *itstrubalim*) |
| Missing stress marks on past forms stressed on the first syllable | 30 | עָ֫פָה, עָ֫פוּ, רָ֫צָה (ran), רָ֫צוּ, חָ֫גוּ, טָ֫סוּ; hif'il הֵרִ֫ימוּ, הֵרִ֫יעוּ, הִנִּ֫יחוּ, הֶאְדִּ֫ימוּ, הִקִּ֫ישׁוּ, הִרְגִּ֫ישׁוּ, הִתִּ֫יזוּ, הֶחְשִׁ֫יכוּ, הֵבִ֫יאוּ, הוֹרִ֫ידוּ, הִדְבִּ֫יקוּ |
| Voice marks made consistent across the batch (the two writers differed) | ~90 | stress on אִ֫מָּא, אַ֫בָּא, סַ֫בָּא, סַ֫בְתָּא, אֲנַ֫חְנוּ, מִתַּ֫חַת, אֲפִ֫לּוּ, כְּאִ֫לּוּ, בּ֫וֹאוּ/בּ֫וֹאִי, מַ֫שֶּׁהוּ (C06, C07 had it on the second syllable); כְּאִלּוּ always with the vocal-shva mark (before א); בְּלִי without it (said *bli*, as in C02-C08); קָדִ֫ימָה (C04 had *KAdima*; the standard form is *kaDIma*, as C14 had); מִשְׁמְ֯רוֹת (second of two shvas) |
| Spelling made consistent | 11 | גָּבוֹהַּ → **גָּבֹהַּ** (pointed spelling, as in C07, C08 and the pilots) |
| Natural Hebrew instead of a calque or a stiff form | ~45 | see each story |
| Meaning brought back to the story or the art | ~12 | C05 ladder removed; C04 lemons; C12 the frog face; C15 juice in cups, not mugs |
| Coordinator's fact changes | 3 stories | C07 aunt; C10 young storks; C15 poison-centre advice |
| Adult activity text (unpointed) | 14 | gender-neutral wording, clearer sentences, matching the English |

## 2. Per story

### C02 The Slow Round
- p1 הִסְתּוֹבֵב מַהֵר וְיוֹתֵר מַהֵר → **מַהֵר יוֹתֵר וְיוֹתֵר** (the Hebrew idiom for "faster and faster").
- p7 and the name: יַלְדָּה מִכִּתָּה רִאשׁוֹנָה → **יַלְדָּה מִכִּתָּה אָלֶף** (decision 3).
- p8 לֹא עָצַר לְהַרְבֵּה זְמַן → **לֹא עָצַר לִזְמַן רַב**.
- Activity goal shortened (it said "together", "shared" and "in the group" in one line).
- Checked as correct: שְׁתֵּים עֶשְׂרֵה פְּעָמִים (פַּעַם is feminine), נֶאֶנְחוּ, הֶאְדִּים, קִפְצִי, וַעֲגֻלָּה, the חֶבֶל forms.

### C03 The Quiet Morning
- p1: "all night, until morning" → **כָּל הַלַּיְלָה**, as the English now has it.
- p4 and f07, the cereal: רִשְׁרְשׁוּ כְּמוֹ תֹּף ("rustled like a drum") → **הִרְעִ֫ישׁוּ כְּמוֹ תֹּף**.
- p5 אֵין גֶּרֶב בְּשׁוּם מָקוֹם (present tense inside past narration) → **הַגֶּרֶב לֹא הָיָה בְּשׁוּם מָקוֹם**.
- p7 עַכְשָׁו הַתִּיקִים → **עַכְשָׁו הִגִּיעַ תּוֹר הַתִּיקִים**.
- p11 הִסְתַּכֵּל בַּמִּטְבָּח עוֹד פַּעַם אַחַת → **הֵעִיף מַבָּט אַחֲרוֹן בַּמִּטְבָּח** ("one last time").
- p12 and f18 בִּנְקִישָׁה הֲכִי קְטַנָּה → **בִּנְקִישָׁה קְטַנְטַנָּה**.
- f17 בֹּקֶר טוֹב, שְׁנֵיכֶם → **בֹּקֶר טוֹב לִשְׁנֵיכֶם**.
- Adult text: "what do they like… אצלו או אצלה" → "מה הוא או היא אוהבים"; "ילד אחד… וילד אחד" → "אחד… והשני".
- Checked as correct: שְׁלֹשָׁה לְבָבוֹת (לֵב is masculine), אוֹתָךְ, בַּאֲרוּחַת, לִוְּתָה, חִוֶּרֶת.

### C04 Face to Face
- p1 and f03: עֵץ הַלִּימוֹן עוֹד לֹא מוּכָן → **הַלִּימוֹנִים עוֹד לֹא בְּשֵׁלִים**, as the English now has it.
- p4 סִפְּרָה חִידָה → **שָׁאֲלָה חִידָה**.
- p5 and f10 הַלְּחָיַיִם הִתְחַמְּמוּ → **הַלְּחָיַיִם בָּעֲרוּ** (the Hebrew image for shame; also used in C06).
- p5 וּמֵעַל הַשִּׁירָה שֶׁל הַצִּיקָדוֹת ("over the cicadas", a calque) → **מֵהַצַּד הַשֵּׁנִי שֶׁל הֶחָצֵר, כְּשֶׁהַצִּיקָדוֹת שָׁרוֹת מִסָּבִיב**.
- p8 and f16 צַוָּאר. כְּמוֹ זֶה → **צַוָּאר. פֹּה.**
- p9 אָמַר לְאַט, וְחָשַׁב → **אָמַר לְאַט, מְהַרְהֵר**.
- p11:
  - added אֶל סַבָּא, so the reader knows where the chair goes;
  - וְאַף אֶחָד לֹא דִּבֵּר יוֹתֵר בְּבַת אַחַת (ambiguous: it can mean "nobody spoke more") → **וְהֵם כְּבָר לֹא דִּבְּרוּ כֻּלָּם בְּבַת אַחַת**.
- p12 and f20 יֵשׁ לִי אַחַת בִּשְׁבִילְכֶם (one what?) → **יֵשׁ לִי סִפּוּר בִּשְׁבִילְכֶם**.
- p14 בְּדִיּוּק בַּמָּקוֹם → **בְּדִיּוּק שָׁם**.
- Checked as correct: שְׁלֹשִׁים הָעִזִּים, מִמֶּנּוּ (the voice) and מִמֶּנָּה (the shape), צַוָּאר/צַבָּר.

### C05 Oranges for Everyone (numbers)
- p2 בִּזְמַן הָאֲרוּחָה הַקְּטַנָּה → **בְּהַפְסָקַת הָאֹכֶל** (as in f03).
- p2 הַתַּפּוּזִים הֵרִיחוּ כְּמוֹ שֶׁמֶשׁ (הֵרִיחַ means "sniffed") → **לַתַּפּוּזִים הָיָה רֵיחַ שֶׁל שֶׁמֶשׁ**.
- p5 וְמִלְמֵל → **וּמִלְמֵל**.
- p5 the ladder → **הַשֶּׁמֶשׁ הַחַמָּה**, as the English has it. p2 says the children picked on tiptoe.
- p11 בִּפְלִיאָה → **בְּבִלְבּוּל** ("puzzled").
- p12 and f19 הָאֹכֶל עָלֵינוּ ("the food's on us", an adult money idiom) → **אֲנַחְנוּ נְחַלֵּק אִתְּכֶם**, as the English now has it.
- Adult text: "שתי אבנים מיותרות" → "נשארות בחוץ שתי אבנים".
- Numbers checked: all correct. Counted children, oranges and halves are masculine: שְׁנֵים עָשָׂר, עֲשָׂרָה, עֶשְׂרִים וּשְׁנַיִם, אַחַד עָשָׂר, שְׁנֵי חֲצָאִים. The activity uses feminine forms with אבנים and קערות. 11 × 2 = 22 is right.

### C06 One Note at a Time (numbers)
- p1 הֵרִיחַ כְּמוֹ גֶּשֶׁם → **הָיָה רֵיחַ שֶׁל גֶּשֶׁם**.
- p2 חָלִיל עֵץ → **חֲלִיל עֵץ** (construct state).
- p5 בְּיָמִים עֲיֵפִים ("on tired days" is not Hebrew) → **גַּם כְּשֶׁהָיְתָה עֲיֵפָה**.
- p9 הָאֶצְבָּעוֹת הִרְגִּישׁוּ נֻקְשׁוֹת → **הָיוּ נֻקְשׁוֹת**.
- f19 → **וְעַכְשָׁו, לִפְנֵיכֶם: לִילִי…**, so the line is an announcement, as the English now has it.
- p1 מַשֶּׁהוּ: stress moved to the first syllable.
- Numbers checked:
  - ordinal days are masculine: הַיּוֹם הַשְּׁנֵים עָשָׂר, הָעֶשְׂרִים וַחֲמִשָּׁה;
  - עֶשֶׂר דַּקּוֹת and חָמֵשׁ מִשְׁבָּצוֹת are feminine;
  - שְׁלֹשִׁים יוֹם (singular noun after a number above ten) is accepted;
  - 30 − 25 = 5 empty boxes.
- The physics is right: blowing across a bottle, more water gives a higher note.

### C07 The Crossing Leader (road-safety decision)
Rewritten to match the English and `DECISIONS.md`. Noah's aunt (**הַדּוֹדָה**, the cousin's mother) walks the
children and holds Noah's hand at every crossing. She stops him at the kerb on p6 and nods on p9. The cousin stays the
one who teaches "look too". Pages changed:
- p1: "every morning Noah's aunt walked him to school, together with his big cousin";
- p2, p5, p12: **וְנָתַן יָד לַדּוֹדָה**;
- p2: **אָז הֵם חִכּוּ… הֵם חָצוּ**;
- p3: **הַדּוֹדָה הֶחְזִיקָה לוֹ אֶת הַיָּד וְחִיְּכָה**;
- p6: **אֲבָל הַיָּד שֶׁל הַדּוֹדָה עָצְרָה אוֹתוֹ**;
- p8: the aunt holds his hand tight;
- p9: **הַדּוֹדָה הֵנִידָה בְּרֹאשָׁהּ**;
- p10: **שְׁלָשְׁתָּם חָצוּ יַחַד** (kamatz katan marked);
- p11: **מֵהַדֶּלֶת שֶׁל הַבַּיִת שֶׁלְּךָ**;
- p14: **יָד בְּיָד עִם הַדּוֹדָה**;
- f01: **נֹחַ הָלַךְ עִם הַדּוֹדָה וְעִם בַּת הַדּוֹדָה הַגְּדוֹלָה**.

Language fixes:
- p3: imperatives and infinitives were mixed in the narration (לְחַכּוֹת לַיָּרֹק. לָלֶכֶת.) → past tense: **חִכָּה לַיָּרֹק וְחָצָה**.
- p3 הִרְגִּישׁ גָּבֹהַּ ("felt tall", a calque) → **הִרְגִּישׁ גָּדוֹל**.
- p6 and f09 גַּם לְהִסְתַּכֵּל → **צָרִיךְ גַּם לְהִסְתַּכֵּל**.
- p7:
  - אֵיפֹה שֶׁ → **בַּמָּקוֹם שֶׁבּוֹ**;
  - הַלֵּב קָפַץ לַגָּרוֹן (a calque) → **הַלֵּב שֶׁל נֹחַ הִתְחִיל לִדְפֹּק חָזָק**.
- p8 קָרְאָה מֵעֵבֶר לַכָּתֵף ("over her shoulder", a calque) → **קָרְאָה לְעֶבְרָם**.
- p9 and f12 שֶׁהֵם מְאֹד שְׁקֵטִים → **שְׁקֵטִים מְאֹד**.
- p9 שָׁקֵט… זֶה לֹא אוֹתוֹ דָּבָר כְּמוֹ רֵיק (a calque) → **שָׁקֵט וְרֵיק, הוּא חָשַׁב, זֶה לֹא אוֹתוֹ דָּבָר**.
- p10 עַל יַד הָרֵיחַ → **דֶּרֶךְ הָרֵיחַ הַחַם**.
- p14 and f20 תּוֹדָה, מוֹבִיל → **תּוֹדָה, אֲדוֹנִי הַמּוֹבִיל**. This goes with the knight's bow; a bare מוֹבִיל used to address someone is not Hebrew.

Adult text:
- steps 1 and 2 now use the same verb forms (infinitives);
- e-scooters added, as in the English;
- the age guidance is now stated as advice from child-safety organisations: "עד גיל תשע או עשר בערך".
- Checked: Israel's Ministry of Education road-safety booklets and Beterem both say that children up to 9 cross only
  with an adult (meyda.education.gov.il, `summer-zahav.pdf` and `betichut2.pdf`). Safe Kids (under 10) is from the
  English reviewer.

### C08 The Ball the Sea Took
- p4 and f05 נָשָׂא אוֹתוֹ פְּנִימָה ("inside", unclear at sea) → **אֶל תּוֹךְ הַיָּם**.
- p4 and f05 עוֹד קְצָת רָחוֹק → **עוֹד קְצָת הָלְאָה**.
- p4 רָחוֹק וְעוֹד יוֹתֵר רָחוֹק (a calque) → **וְהָלַךְ וְהִתְרַחֵק מֵהַחוֹף**.
- p6 the same phrase → **הִתְרַחֵק עוֹד וָעוֹד**.
- p7 and f09 תַּנִּיחִי לוֹ ("leave him alone") → **תְּוַתְּרִי עָלָיו** ("let it go", said gently).
- p9 נֶהְיָה נְקֻדָּה → **הָפַךְ לִנְקֻדָּה**.
- p14 אֵיפֹה שֶׁ → **בַּמָּקוֹם שֶׁבּוֹ**. It now repeats p13 word for word as a motif.
- Checked as correct: נִשְׁאַרְתְּ, קָרָאת, the female lifeguard, and the adult-text rule on swimming only with a lifeguard.

### C09 Next Episode in Five, Four, Three…
- p9 הִזִּיז אֶת הָאֶצְבָּעוֹת בָּרַגְלַיִם → **אֶת אֶצְבְּעוֹת הָרַגְלַיִם**.
- p9 זֶה הִרְגִּישׁ טוֹב (a calque of "it felt good") → **הָיָה לוֹ טוֹב**.
- Stress added on עָ֫פוּ and on every אִמָּא.
- The countdown is counted aloud, so it is feminine (חָמֵשׁ, אַרְבַּע, שָׁלֹשׁ… אַחַת). That is correct.

### C10 Long-Legs Flies South (numbers, facts)
- p1 עַל קֵן גָּדוֹל עַל גַּג → **עַל קֵן גָּדוֹל בְּרֹאשׁ הַגַּג**.
- p7 הֵנִיעָה בְּרֹאשָׁהּ לִשְׁלִילָה (bookish) → **הֵנִיעָה אֶת הָרֹאשׁ מִצַּד לְצַד**.
- p10 נָחֲתוּ… בְּסִבּוּב / הֵן עָמְדוּ לְיַד הַמַּיִם → **יָרְדוּ יַחַד בְּסִבּוּבִים… הֵן נָחֲתוּ לְיַד הַמַּיִם**, which matches "spiralled down… landed".
- p13 וְנִכְנַס → **וְנִכְנַס לָאֲוִיר הָעוֹלֶה**.
- p14 מֵעַל הַגִּבְעָה ("above the hill", which was wrong) → **לְמַעְלָה עַל הַגִּבְעָה**.
- p14 נַעֲשׂוֹת לְמִגְדָּל → **הוֹפְכוֹת לְמִגְדָּל**.
- Stress added: חָ֫גוּ, עָ֫פָה ×2, עָ֫פוּ, הִקִּ֫ישׁוּ, הִרְגִּ֫ישׁוּ, every סַבָּא, אֲנַחְנוּ, בּוֹאוּ.
- Adult text:
  - the coordinator's sentence was added: young storks stay south for their first summers and come back only
    after a few years, when ready to nest (NABU, via the English reviewer);
  - step 1 "who will win" → "which column will win".
- Numbers checked: אַרְבָּעָה קַוִּים (קַו is masculine); counting aloud is feminine (חָמֵשׁ… חֲמֵשׁ עֶשְׂרֵה… עֶשְׂרִים); בֶּן
  שְׁלֹשָׁה חֳדָשִׁים.

### C11 Meet Me at Four (clock)
- p1 אִחֵר לַכַּדּוּרֶגֶל → **לְמִשְׂחַק הַכַּדּוּרֶגֶל**.
- p1 the party: now a result clause, **אִחֵר כָּל כָּךְ… שֶׁהָעוּגָה כְּבָר נִגְמְרָה**, as in the English "so late that".
- p9 and f15 הוּא יָכוֹל לַעֲשׂוֹת אֶת זֶה (a calque) → **הוּא יַצְלִיחַ / אֲנִי אַצְלִיחַ**.
- p11 חֲצִי שָׁעָה מַסְפִּ֫יקָה (wrong stress, and present tense inside past narration) → **בַּחֲצִי שָׁעָה אֶפְשָׁר הָיָה לְשַׂחֵק עוֹד מִשְׂחָק אֶחָד**.
- p14 טַחֲנַת רוּחַ מִנְּיָר → **שַׁבְשֶׁ֫בֶת מִנְּיָר** (the Israeli child's word for a paper windmill).
- Hours checked:
  - feminine throughout: שָׁלֹשׁ, שָׁלֹשׁ וָחֵצִי, בְּאַרְבַּע, שְׁתֵּים עֶשְׂרֵה, עֶשֶׂר;
  - Felix's mistake (calling ten o'clock "twelve") is consistent with the pictures;
  - שְׁנֵי מְחוֹגִים, שְׁתֵּים עֶשְׂרֵה שְׁנָתוֹת.

### C12 Words and Pictures
- p10 אָחִיהָ סִפֵּר עַל הַפָּנִים הַמֻּפְתָּעוֹת → **אָחִיהָ עָשָׂה פַּרְצוּף מֻפְתָּע, בְּדִיּוּק כְּמוֹ הַצְּפַרְדֵּעַ**. This is the joke the English now has: he pulls the face.
- Stress added: עָ֫פָה, הֶחְשִׁ֫יכוּ, every אִמָּא.
- Checked as correct: "הָיֹה… הָיָה…" for "once upon a time", the syllables "הַ… חֲ… גִי… גָה", and שְׁלֹשָׁה מַקְשִׁיבִים (a mixed group).

### C13 After the Storm (numbers)
- p1 וְהַכְּפָר נִהְיָה שָׁקֵט → **וְהַכְּפָר שָׁקַט**.
- p7 הַחוּטִים → **חוּטֵי הַחַשְׁמַל** (the safety point needs to be clear).
- p8 נִשְׁאַר בְּדִיּוּק בַּמָּקוֹם → **בְּאוֹתוֹ מָקוֹם**.
- p8 the twins נָשְׁפוּ ("blew") → **אָמְרוּ יַחַד, מִתְנַשְּׁפִים**.
- p10 עָמְדוּ בַּמְּקוֹמוֹת → **תָּפְסוּ אֶת הַמְּקוֹמוֹת שֶׁלָּהֶם**.
- p12 the vocal-shva mark was removed from אִצְטְרֻבָּלִים.
- Stress added: רָ֫צָה ×2, הֶאְדִּ֫ימוּ, הֵרִ֫ימוּ, הִנִּ֫יחוּ, הֵרִ֫יעוּ.
- Adult text: "איך הוא ירגיש" assumed the helper is a man → "איך העוזר או העוזרת ירגישו".
- Numbers checked: חֲמִשָּׁה יְלָדִים, אַרְבָּעָה זוּגוֹת יָדַיִם (four lifting pairs and the caller make five), חֲמִשָּׁה צִיּוּרִים; the lifting call is feminine (אַחַת, שְׁתַּיִם, שָׁלֹשׁ).

### C14 Two Ideas, One Raft
- p7 the dragonflies זִמְזְמוּ ("buzzed") → **טָ֫סוּ הָלוֹךְ וָשׁוֹב**.
- p11 הֶחְזִיק… יַצִּיב → **בְּיַצִּיבוּת**.
- p14 הַגֶּשֶׁר הַקָּטָן מֵעֵץ → **גֶּשֶׁר הָעֵץ הַקָּטָן**.
- Stress added: הֵבִ֫יאוּ, הוֹרִ֫ידוּ, עָ֫פוּ, הֵרִ֫יעוּ, רָ֫צוּ; גָּבוֹהַּ → גָּבֹהַּ ×7.
- Adult text: the word order of "each has a good idea" was fixed.
- Checked as correct: שִׁשָּׁה מַקְלוֹת, רַבֵּי חוֹבְלִים, and the father watching the water.

### C15 The Bottle That Looked Like Juice (numbers)
- Name sheet: **בֶּן הַדּוֹד הַקָּטָן שֶׁל רוֹז**, as in the English "little cousin".
- p6 "held her hand tight" → **הֶחְזִיק לָהּ חָזָק אֶת הַיָּד**.
- p12 רָצָה לְצַיֵּר גַּם → **גַּם בֶּן הַדּוֹד הַקָּטָן רָצָה לְצַיֵּר יָד**.
- p13 juice in שְׁלֹשָׁה סְפָלִים ("mugs") → **שָׁלֹשׁ כּוֹסוֹת**. p14 now has **הַכּוֹס** to match.
- p14 and f23 הוּא הָיָה טָעִים כְּמוֹ תַּפּוּזִים ("tasty like oranges") → **הָיָה לוֹ טַעַם שֶׁל תַּפּוּזִים וְשֶׁמֶשׁ** ("tasted of").
- Adult text: the coordinator's sentence was added: do not wait for signs, do not make the child sick, keep the product to hand to read out its label.
- Numbers checked: counting aloud is feminine and ends in **שִׁבְעָה בַּקְבּוּקִים**; שָׁלֹשׁ רַגְלַיִם, אַרְבַּע אֶצְבָּעוֹת and חָמֵשׁ הָאֶצְבָּעוֹת are feminine.

## 3. Decisions

1. **Stress marks on past forms.** Hollow-verb past forms in the 3rd person feminine singular and the plural (עָ֫פָה, רָ֫צוּ, קָ֫דָה) are stressed on the first syllable. So are hif'il forms in the 3rd person feminine singular and the plural (הֵרִ֫ימוּ, הִנִּ֫יחָה). Both now always carry the mark, as the writers already did in most places.
   - רָצָה meaning "wanted" is stressed on the last syllable and stays unmarked (C09, C15).
   - Present-tense participles such as מַסְפִּיקָה and מַתְחִילָה also stress the last syllable, so they get no mark.
2. **Batch-wide consistency.** The two writer batches marked differently. I unified the marks to the majority form
   and to the pilot (section 1, row 3). Family words (אִמָּא, אַבָּא, סַבָּא, סַבְתָּא) now always carry the stress mark.
3. **C02 "first-grader": כִּתָּה אָלֶף, written out as a word.** It is what every Israeli says; "כִּתָּה רִאשׁוֹנָה" is not used.
   The guide's ban is on letters used as numerals (כיתה א'); a letter's name written in full is a word. **For the editor
   to confirm.** If refused, the fallback is "יַלְדָּה קְטַנָּה מֵהַכִּתָּה הֲכִי צְעִירָה".
4. **C07 vocabulary.**
   - The aunt is **הַדּוֹדָה**; the cousin stays **בַּת הַדּוֹדָה**, so their relationship is clear without a name.
   - The chant keeps the boy's own imperatives (עֲצֹר, הִסְתַּכֵּל… לֵךְ), because it is Noah's voice.
   - The cousin's bow line is **תּוֹדָה, אֲדוֹנִי הַמּוֹבִיל**.
5. **הֵרִיחַ for "smelled of"** was replaced in C05 and C06 by "הָיָה רֵיחַ שֶׁל". In standard Hebrew הֵרִיחַ means
   "sniffed"; "הדיף ריח" is too literary for this age.
6. **No new names.** For the ledger: C07 **הַדּוֹדָה** (Noah's aunt, a background adult with no name); C10
   **אֲרֹךְ רַגְלַיִם** (Long-Legs).
7. **Content.** I found no religious, political or national content. C10's adult text keeps "מעל ישראל" for the
   stork route, as the pilot did; it is a fact about migration, not a national symbol.

## 4. What a native Hebrew editor should still read

I am a language model, not a native speaker. Please read first:

1. **C07 in full, aloud.** Is the aunt there without taking the game away from the children? Is "אֲדוֹנִי הַמּוֹבִיל"
   natural from a ten-year-old girl?
2. **C02 כִּתָּה אָלֶף** (decision 3).
3. **Stress where speech varies.**
   - קָדִ֫ימָה: I chose *kaDIma*; *KAdima* is common in speech.
   - אֲפִ֫לּוּ, כְּאִ֫לּוּ, מִתַּ֫חַת, מַ֫שֶּׁהוּ.
   - Past forms such as הָיוּ, אָמְרָה, which I left with final stress as the pilot did.
4. **Vocal shva in clusters.**
   - אִצְטְרֻבָּלִים: I removed the mark.
   - תְּוַתְּרִי: I left it unmarked.
   - בְּלִי: I made it silent everywhere.
   - כְּשֶׁ, כְּבָר: silent.
5. **Words.**
   - צִיקָדוֹת (C04).
   - שַׂקִּיּוֹת for beanbags (C05).
   - גּוֹזָל for a three-month-old stork that already flies (C10).
   - שְׁנָתוֹת for the clock's marks (C11).
   - דּוֹנְג, the clock's bong (C11).
   - סָגוּר for "deal" (C12).
   - רַבֵּי חוֹבְלִים (C14).
   - שַׁרְווּל, pointed with two vavs (C06).
   - הַשָּׁלוֹם שֶׁלָּנוּ for "our goodbye" (C03 p9).
   - "זֶה אַתָּה, וְזֹאת אֲנִי", said of two hearts (C03 p10).
   - "כָּל הַפָּנִים שֶׁלָּהּ חִיְּכוּ" (C02 p7).
   - "הַלְּחָיַיִם בָּעֲרוּ" (C04, C06).
6. **My new wording.** None of the lines quoted in bold in section 2 has been read by a second Hebrew speaker.
7. **Facts carried from the other reviews** (not mine to verify further):
   - C10: young storks return only after some years (NABU).
   - C15: the "red-edged diamond" warning picture is EU labelling; Israeli labels are unverified.

## 5. Checks run

- `python3 docs/story-room/pilots/tools/storytool.py build he c02 … c15`: built 14 files.
- `python3 docs/story-room/pilots/tools/storytool.py check c02 … c15`: no Hebrew errors. The Arabic light-layer errors
  in the same run come from the Arabic review in progress.
- My own scripts, run after the rebuild:
  - **Sources against built files:** every built file equals its source.
  - **Voice marks:** no voice mark appears in any display text, title or name.
  - **Exclamation marks:** no spread has more than one.
  - **Characters:** no Latin letters, invisible characters, maqaf or gershayim.
- **Lengths:**
  - Hebrew stories run 426 to 571 words.
  - The longest sentence has 19 words (C04 p13), under the 20-word limit.
  - The longest caption has 12 words (C07 f01), under the 16-word limit.
