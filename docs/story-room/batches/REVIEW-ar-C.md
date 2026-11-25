# Arabic review of stories C02 to C15 (ages 6 to 8), 25 Nov 2026

**Result.** I read every `speech` line, every film line and all activity text of the fourteen Arabic stories, mark by
mark, against `style-ar.md`, the pilot review (`pilots/REVIEW-ar.md`, C01 as the standard), `age-6-8.md` and
`DECISIONS.md`. The writers' grammar was strong: case endings, tanwin, duals, diptotes and almost every number were
right. I made **about 140 changes**: one grammar error repeated in all 14 safety lines, about 20 other real errors,
about 30 fixes of ambiguity or meaning, about 45 wording changes toward natural speech, and the three fact changes the
English reviewer made (C07 in full, C10 and C15 adult text). After the last edit: `storytool.py build ar c02 … c15`,
then `storytool.py check c02 … c15`: **Errors: none**.

This is a review by a language model, not by a native editor. Section 5 lists what a person must still read.

Files: only `docs/story-room/pilots/src/c02.ar.json` … `c15.ar.json` were edited; `content/stories/c02/ar.json` …
`c15/ar.json` were regenerated with `storytool.py build ar`. No Hebrew, English or Danish file and no tool was touched.
Note: other sessions' commits (4aaaee5, 6a7e20c) picked up some of my in-progress Arabic files; the working tree holds
the final state. I committed nothing.

---

## 1. Corrections that apply to many stories

| # | What | Before | After | Where |
|---|---|---|---|---|
| G1 | **Grammar: the answer to إذا is an imperative, so it needs فَـ** | إِذَا وَقَعَ حَادِثٌ، اتَّصِلُوا بِرَقْمِ الطَّوَارِئِ… | إِذَا وَقَعَ حَادِثٌ، **فَ**اتَّصِلُوا بِرَقْمِ الطَّوَارِئِ… | safety line, all 14 stories. **The same line in A01–A15, B01–B15 and C01 has the same error** (it came from the pilot review); the A/B reviewer or the coordinator should apply it there, so the library stays one line. On screen: «إذا وَقَع حادِث، فاتّصِلوا برَقم الطَوارِئ في بَلَدِكُم.» |
| G2 | Same rule inside adult text | وَإِذَا لَمْ تَكُنْ نَغَمَةٌ صَحِيحَةً، أَضِيفُوا… / وَإِذَا أَحَبَّ الصِّغَارُ ذَلِكَ، أَعْطُوهُمْ | فَأَضِيفُوا / فَأَعْطُوهُمْ | C06 forAdult (2) |
| G3 | "To make it harder" pointed at nothing (لِجَعْلِهِ: "to make **it**") | وَلِجَعْلِهِ أَصْعَبْ | وَلِجَعْلِ النَّشَاطِ أَصْعَبْ | C02, C03, C05, C06, C07, C08, C09, C11, C12, C13, C14 (C04 and C10 kept: "it" there is the game, named just before) |
| G4 | The writer's prefix marker missing on لِأَنَّ, so the light layer showed لِأنّ in some places and لأنّ in others | لِأَنَّ، لِأَنِّي، لِأَنَّهُ، لِأَنَّكِ، لِأَنَّكَ | لِ\|أَنَّ… | C09 (2), C14, C15 (4) |

## 2. Per story

Types: **E** error (grammar, spelling, mark), **M** meaning or ambiguity, **W** wording for the age and for speech,
**A** adult activity text, **F** fact change.

### C02 The Slow Round
- M p6: ثُمَّ نَزَلَ بِدَقَّةٍ نَاعِمَةْ (reads "came down with soft *precision*") → ثُمَّ نَزَلَ وَطَرَقَ الْأَرْضَ بِخِفَّةْ.
- W p7: وَابْتَسَمَ وَجْهُهَا كُلُّهْ (English "her whole face smiled") → وَأَشْرَقَ وَجْهُهَا بِابْتِسَامَةٍ كَبِيرَةْ.
- W p12: «لِنَتَنَاوَبْ: …» (textbook) → «تَعَالَوْا نَتَنَاوَبْ: …».
- A step 4: السَّرِيعُ أَصْعَبُ أَمِ الْبَطِيءْ؟ (question with no question word) → أَيُّهُمَا أَصْعَبُ، السَّرِيعُ أَمِ الْبَطِيءْ؟
- A forAdult: «عَلِّمُوا الصِّغَارَ أُنْشُودَةً… يَعْرِفُونَهَا» ("teach them a song they already know") → اخْتَارُوا أُنْشُودَةً قَصِيرَةً يَعْرِفُهَا الصِّغَارُ.
- Checked and kept: اثْنَتَيْ عَشْرَةَ مَرَّةً، يَبْدَآنِ، قَفَزَات، تَعَالَ نُدِيرُهُ (indicative after تعال, as هيّا نمشي in the pilot).

### C03 The Quiet Morning
- E p3: وَالْحَنَفِيَّةُ تُقَطِّرُ (transitive "distils, lets drip") → تَقْطُرُ (also C09 p9).
- W p9 and f13: «لِنَكْتُبْ لَهَا رِسَالَةْ. فَتَقْرَأُ وَدَاعَنَا…» → «تَعَالَيْ نَكْتُبْ لَهَا رِسَالَةْ. هَكَذَا تَقْرَأُ وَدَاعَنَا…» (also removes a فاء السببية that wanted the subjunctive).
- W p11: نَظَرَ فِي الْمَطْبَخِ نَظْرَةً أَخِيرَةْ → أَلْقَى عَلَى الْمَطْبَخِ نَظْرَةً أَخِيرَةْ (the idiom).
- W p12: فَإِذَا هِيَ الْجَارَةُ (writer flagged as bookish) → فَتَحَ إِمِيلُ الْبَابَ، فَوَجَدَ جَارَتَهُمْ…
- Kept: «نُحِبُّكِ^ كَثِيرًا» (gender kept by word order), the recited list الْحَقِيبَةْ، الْقِنِّينَةْ… (pause on each word, as decided for A13), ثَلَاثَةُ قُلُوبْ، يَطْوُونَ، تَتَثَاءَبْ.

### C04 Face to Face
- E p13, f21: الْعَنْزَاتُ → **الْعَنَزَاتُ** (sound plural of the noun فَعْلَة takes fatha on the second letter, like قَفَزَات، هَمَسَات، نَغَمَات, which the writers had right).
- E forAdult: «كَمْ يَسْتَطِيعُ الْوَجْهُ وَالشَّفَتَانِ وَالْيَدَانِ أَنْ تَقُولْ» (يستطيع … تقول disagree) → «كَمْ يُمْكِنُ أَنْ يَقُولَ الْوَجْهُ وَالشَّفَتَانِ وَالْيَدَانِ دُونَ صَوْتْ».
- E forAdult: «وَإِذَا شَارَكَ جَدٌّ أَوْ جَدَّةٌ، فَلْيَخْتَارَا…» (أو takes a singular, and a singular would assume a gender) → «وَإِذَا شَارَكَ الْأَجْدَادُ، فَلْيَخْتَارُوا هُمُ الْكَلِمَاتْ».
- M materials: لِتَعْلِيمِ الْكَلِمَاتِ السَّهْلَةِ (reads "for *teaching* the easy words") → لِوَضْعِ إِشَارَةٍ بِجَانِبِ الْكَلِمَاتِ السَّهْلَةِ. Step 3: تَخْمِينُ الشَّرِيكِ ("guessing the partner") → تَخْمِينٌ مِنَ الشَّرِيكِ.
- W p2: رَنَّتْ مُكَعَّبَاتُ الثَّلْجِ… عَالِيًا جِدًّا → بِصَوْتٍ عَالٍ جِدًّا. p12: قَفَزَ قَلْبُ لِيُو مِنَ الْفَرَحْ → طَارَ قَلْبُ لِيُو مِنَ الْفَرَحْ (the Arabic idiom).
- W p5 (writer flagged «كُلُّ مَا فِي الْأَمْرِ…» and «فَوْقَ غِنَاءِ الزِّيزَانِ», an English "over the noise"): → «لَقَدْ نَادَاهُ لِيُو مِنْ بَعِيدٍ، عَبْرَ السَّاحَةِ، وَالزِّيزَانُ تُغَنِّي، فَلَمْ يَسْمَعْهُ جَيِّدًا.»
- Kept: the mishearing رَقَبَة / رُكْبَة (works aloud: q and k, and the light layer shows رَقَبة against رُكبة); the riddle "what has a neck and no head? a bottle" exists in Arabic; «لَا يَهُمّْ!»; «مِنْ فَضْلِكْ» (Leo is a boy, nothing lost); كَرَاسِيِّهِمْ; حَتَّى كَادَتْ رُكَبُهُمَا تَتَلَامَسْ (correct; it also echoes the riddle).

### C05 Oranges for Everyone (numbers)
- Numbers, all checked and correct: إِحْدَى عَشْرَةَ بُرْتُقَالَةً، نَحْنُ اثْنَا عَشَرَ، هُمْ عَشَرَةٌ، اثْنَانِ وَعِشْرُونَ طِفْلًا / نِصْفًا، اثْنَتَا عَشْرَةَ حَصَاةً، خَمْسَةُ أَوْعِيَةٍ، حَصَاتَانِ زَائِدَتَانِ، سِتُّ حَصَيَاتٍ، أَرْبَعٌ وَعِشْرُونَ حَصَاةً، خَمْسٌ… The sum 12 + 10 = 22 children, 11 × 2 = 22 halves and 12 ÷ 5 = 2 rest 2 are right on the page.
- M p5 and f08: وَفَكَّرَتْ: كَانَ لَنَا ("it *used to* be ours", the English back-shift) → وَفَكَّرَتْ: هُوَ لَنَا فِعْلًا (f08: «هُوَ لَنَا فِعْلًا…»).
- E p12: ذَقْنَهُ اللَّزِجَةَ → ذَقْنَهُ اللَّزِجَ (ذقن is masculine).
- W f15 (writer flagged): «أَحْسَنْتِ الْعَدَّ يَا جُولْيَا» → «أَحْسَنْتِ يَا جُولْيَا، عَدَدْتِ بِدِقَّةْ» (praise for the careful work, as the brief asks).
- A materials: الْمَعْكَرُونَةِ النَّاشِفَةِ → الْجَافَّةِ.
- Kept: «نَسِيتِ^ نَفْسَكْ!» (the verb keeps the feminine); أَلِكْسَ in the genitive (diptote foreign name); قَرْقَرَ بَطْنُ أَلِكْسَ (the right verb for a rumbling stomach).

### C06 One Note at a Time
- W p2 and f03: «حِينَ كُنْتُ فِي عُمْرِكْ» (pause erased the feminine) → «حِينَ كُنْتُ فِي مِثْلِ عُمْرِكِ يَا لِيلِي» (gender kept, as the pilot did with دَالْيَا).
- M p7, p13, f10: النَّغَمَةُ مُسْتَدِيرَةً (English "a round note") → نَاعِمَةً; p7 مِثْلَ عُصْفُورٍ صَغِيرٍ → مِثْلَ زَقْزَقَةِ عُصْفُورٍ صَغِيرٍ.
- M p8, f11: السَّطْرَ الْأَوَّلَ مِنَ الْأُغْنِيَةِ (a line of text) → الْمَقْطَعَ الْأَوَّلَ.
- M p12: «حِينَ نَادَتِ الْمُعَلِّمَةُ اسْمَهَا» (just after the grandmother: whose name?) → «اسْمَ لِيلِي، ارْتَجَفَتْ يَدَاهَا».
- W p2: فَتَحَتْ جَدَّتُهَا قِطْعَةَ قُمَاشٍ → فَكَّتْ. p12: بِالْكَرَاسِي → بِالْكَرَاسِيِّ (one spelling with C04).
- A title مُوسِيقَى الْقَنَانِي → مُوسِيقَى الْقِنِّينَاتِ (the word the materials use); «أَيُّ قِنِّينَةٍ عَزَفَتْ» → «أَعْطَتْ».
- Kept: فِي الْيَوْمِ الثَّانِيَ عَشَرَ، الْخَامِسِ وَالْعِشْرِينَ، عِشْرُونَ مُرَبَّعًا… وَعَشَرَةٌ، خَمْسَةُ مُرَبَّعَاتٍ، ثَلَاثَةِ أَرْبَاعِهَا، أَرْبَعِ نَغَمَاتٍ: all correct.

### C07 The Crossing Leader (rewritten for the road-safety decision)
- **F (DECISIONS, and the English and Danish text):** Noah's aunt, خَالَتُهُ (the cousin's mother, so ابْنَةُ خَالَتِهِ stays right), walks both children every morning and holds Noah's hand at every crossing. Pages 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14 and film lines f01, f15, f17, f18 changed. Examples: p1 «كُلَّ صَبَاحٍ، كَانَتْ خَالَةُ نُوحٍ تُرَافِقُهُ وَابْنَتَهَا الْكَبِيرَةَ إِلَى الْمَدْرَسَةْ»; p2 «وَقَفَ نُوحٌ عَلَى حَافَّةِ الرَّصِيفِ، وَأَمْسَكَ يَدَ خَالَتِهْ… فَانْتَظَرُوا… عَبَرُوا مَاشِينَ»; p6 «لَكِنَّ يَدَ خَالَتِهِ أَبْقَتْهُ فِي مَكَانِهْ»; p9 «وَهَزَّتْ خَالَتُهُ رَأْسَهَا مُوَافِقَةْ»; p11 «مِنْ بَابِ بَيْتِكَ» (the cousin does not live with him); p13 «وَرَأَتْهُمُ الرَّاكِبَةُ… تَفَضَّلُوا»; p14 «ثُمَّ عَبَرَ مَاشِيًا، وَيَدُهُ فِي يَدِ خَالَتِهِ»; f01 «مَشَى نُوحٌ مَعَ خَالَتِهِ وَابْنَةِ خَالَتِهِ الْكَبِيرَةْ». Duals that meant Noah and his cousin became plurals (هُمَا يَمْشِيَانِ → هُمْ يَمْشُونَ، عَبَرَا → عَبَرَ الثَّلَاثَةُ، تَفَضَّلَا → تَفَضَّلُوا).
- **F forAdult:** «فَالْأَطْفَالُ فِي هَذَا الْعُمْرِ مَا زَالُوا يَحْتَاجُونَ…» → «تَنْصَحُ هَيْئَاتُ سَلَامَةِ الْأَطْفَالِ بِأَنْ يَعْبُرَ الْأَطْفَالُ الشَّارِعَ مَعَ شَخْصٍ كَبِيرٍ حَتَّى سِنِّ التَّاسِعَةِ أَوِ الْعَاشِرَةِ تَقْرِيبًا.» (sources in `REVIEW-en-C.md` §2: Safe Kids, Beterem).
- W title and the phrase "lead the way": يَقُودُ الطَّرِيقَ (one leads people, not a road) → title **نُوحٌ يَدُلُّ عَلَى الطَّرِيقِ** (as the Danish *Noah viser vej*); غَدًا تَقُودُ الطَّرِيقَ كُلَّهُ → غَدًا تَقُودُنَا فِي الطَّرِيقِ كُلِّهِ; قَادَ نُوحٌ الطَّرِيقَ → قَادَهُمْ نُوحٌ فِي الطَّرِيقِ.
- W calques: صَاحَتْ… مِنْ فَوْقِ كَتِفِهَا → وَهِيَ تَلْتَفِتُ إِلَى الْوَرَاءْ; بِصَوْتٍ صَغِيرْ → بِصَوْتٍ خَافِتْ (as pilot W5); قَفَزَ قَلْبُ نُوحٍ إِلَى حَلْقِهْ → كَادَ قَلْبُ نُوحٍ يَقْفِزُ مِنْ صَدْرِهْ; الْهُدُوءُ لَيْسَ مِثْلَ الْفَرَاغْ → الشَّارِعُ الْهَادِئُ لَيْسَ دَائِمًا فَارِغًا (concrete, still Noah's own thought); عَبَرَا… بِجَانِبِ رَائِحَةِ الْخُبْزِ → وَرَائِحَةُ الْخُبْزِ الدَّافِئِ حَوْلَهُمْ; p7 «فِي الْمَكَانِ الَّذِي كَانَتْ سَتَكُونُ فِيهِ قَدَمُهُ» → «فِي الْمَكَانِ نَفْسِهِ الَّذِي كَادَتْ قَدَمُهُ تَنْزِلُ فِيهْ».
- M adult text: يُعَلِّمُونَ الْفَرْقَ / تُعَلِّمُ كُلَّ مَمَرٍّ ("teach" or "mark"?) → يُبَيِّنُونَ الْفَرْقَ بِعَلَامَةٍ… / تَضَعُ عَلَامَةً عِنْدَ كُلِّ مَمَرّْ.

### C08 The Ball the Sea Took
- M p4, f05: حَمَلَتْهَا إِلَى الدَّاخِلْ (الداخل reads "inland") → سَحَبَتْهَا نَحْوَ الْعُمْقْ.
- W p1: كَانَ الرَّمْلُ بَارِدًا بَعْدْ (affirmative بَعْدُ is dialect) → وَمَا زَالَ الرَّمْلُ بَارِدًا.
- Kept: «دَعِيهَا تَذْهَبْ»، «وَأَنْتِ عِنْدِي أَغْلَى مِنْ كُلِّ الْكُرَاتْ»، يَرَيَانِهَا، اطْوُوا، اثْنُوا، ثَمَانِيَةِ أَطْفَالٍ.

### C09 Next Episode in Five, Four, Three…
- W p4, p11: الطَّمَاطِم → الْبَنَدُورَة (the word Arab families in Israel say; it is the spelling the A/B reviewer fixed for the library in A02 and B12).
- E p9: تُقَطِّرُ → تَقْطُرُ (as C03).
- W p1: وَالسَّتَائِرُ مُغْلَقَةٌ إِلَى النِّصْفْ → وَالسَّتَائِرُ شِبْهُ مُغْلَقَةْ.
- M inClass: «يَرْسُمُ كُلُّ طِفْلٍ وَجْهًا وَاحِدًا» (reads "draws a face") → «لُعْبَةً وَاحِدَةً». forAdult «وَمَعْرِفَةُ أَيِّ وَجْهٍ يَفُوزْ» → «وَاكْتِشَافُ الْوَجْهِ الَّذِي ظَهَرَ أَكْثَرَ مِنْ غَيْرِهْ».
- Kept: the countdown خَمْسَةْ، أَرْبَعَةْ، ثَلَاثَةْ… (abstract counting forms, pause on each, as C01); مَاكْسُ as a diptote; رِجْلَايَ نَامَتَا (a spoken image every child knows; see §5).

### C10 Long-Legs Flies South
- **F forAdult (NABU, via the English reviewer):** added «وَبَعْدَ ذَلِكَ تَبْقَى فِي الْجَنُوبِ غَالِبًا، وَلَا تَرْجِعُ إِلَى الشَّمَالِ إِلَّا بَعْدَ بِضْعِ سَنَوَاتٍ، حِينَ تَصِيرُ جَاهِزَةً لِبِنَاءِ أَعْشَاشِهَا.»
- M p7: «هَزَّتِ اللَّقْلَقَةُ رَأْسَهَا» (in Arabic usually a nod, "yes"; here she refuses) → «رَأْسَهَا رَافِضَةً».
- W p3: الْمَسَافَةُ بَعِيدَةٌ → طَوِيلَةٌ (the collocation). p7: كَانَ الْمَاءُ أَزْرَقَ مُسْتَوِيًا، حَتَّى السَّمَاءْ → كَانَ الْمَاءُ الْأَزْرَقُ يَمْتَدُّ حَتَّى السَّمَاءْ.
- A safety and forAdult: وَقْتٍ بَارِدٍ ("a cold time", meant "cool") → سَاعَةٍ غَيْرِ حَارَّةٍ / وَقْتًا غَيْرَ حَارٍّ; step 1 labels صَغِيرٌ، وَسَطٌ، كَبِيرْ → صَغِيرْ، وَسَطْ، كَبِيرْ and «(خَمْسَةٌ، عَشَرَةٌ، خَمْسَةَ عَشَرَ)» → «(خَمْسَةْ، عَشَرَةْ، خَمْسَةَ عَشَرْ)» (recited words pause, as in f19 and the A13 decision); inClass «تَجْمَعُ الْمَجْمُوعَةُ خُطُوطَهَا الْأَرْبَعَةَ» → «خُطُوطَ أَفْرَادِهَا الْأَرْبَعَةِ».
- Facts checked against the outline and kept: thermals, no sea crossing, flying by day, bill clattering, fishpond valleys, first journey without parents, autumn passage from about August. The name طَوِيلُ السَّاقَيْنِ is declined as a construct (طَوِيلَ، طَوِيلِ), which is right for a descriptive name.

### C11 Meet Me at Four (time)
- M p4, p12: عَجَلَاتٌ كَبِيرَةٌ (gears) → عَجَلَاتٌ مُسَنَّنَةٌ كَبِيرَةٌ; p5: مِقْبَضًا حَدِيدِيًّا (the winding crank) → مِفْتَاحًا حَدِيدِيًّا.
- W p3: بِنَوَافِذَ → بِشَبَابِيكَ (style-ar §1.1).
- A step 5: «كَمْ فَاكِهَةً نُسَمِّي؟» → «… نُسَمِّي فِي دَقِيقَةْ؟»; forAdult «مَاذَا يَتَّسِعُ فِي دَقِيقَةٍ» → «مَا يُمْكِنُ فِعْلُهُ فِي دَقِيقَةٍ».
- Kept: hours الثَّالِثَةُ تَمَامًا، الثَّالِثَةُ وَالنِّصْفُ، الرَّابِعَةُ، الْعَاشِرَةُ، الثَّانِيَةَ عَشْرَةَ (compound ordinal built on fatha, right in the nominative too); the hour count وَاحِدَةْ، اثْنَتَانْ، ثَلَاثْ (feminine, the hours); اثْنَتَا عَشْرَةَ عَلَامَةً / الْعَلَامَاتُ الِاثْنَتَا عَشْرَةَ; the pun حَانَ الْوَقْتُ لِتَتَعَرَّفَ إِلَى السَّاعَةِ (works in Arabic too). Felix's mistake (long hand at twelve read as the hour while the short hand is at ten) reads correctly.

### C12 Words and Pictures
- E (light layer) p12 and f19: the long word read in pieces «احْ، تِ، فَا، لًا» showed on screen as «اح، ت، فا، لا»: the bare ت loses its vowel (rule L2) and لًا is stripped as the function word لا "no" (rule L8). → «احْ، تِ^، فَالًا… احْتِفَالًا!» On screen: «اح، تِ، فالًا… احتِفالًا!»
- M p10: «وَوَصَفَ أَخُوهَا وَجْهَ الضِّفْدَعِ» → «وَقَلَّدَ» (the English reviewer changed "told" to "pulled the frog's face"); p10 «ضَحِكَ… كَثِيرًا حَتَّى رَجَعَتْ أُمُّهُمَا» → «ضَحِكَ… بِصَوْتٍ عَالٍ جِدًّا، فَرَجَعَتْ أُمُّهُمَا».
- W p8, f13: «الْأَرْنَبُ يَضْحَكُ كَثِيرًا حَتَّى وَقَعْ» (tense jump) → «… يَضْحَكُ كَثِيرًا، حَتَّى إِنَّهُ وَقَعْ».
- A forAdult: «تَتَعَلَّمُ تَمَارَا الْقِرَاءَةَ لِلتَّوِّ» → «بَدَأَتْ تَمَارَا تَتَعَلَّمُ الْقِرَاءَةَ»; «وَهُوَ «يَقْرَأْ» الصُّوَرَ» (the pause rule forced a jussive-looking يَقْرَأْ inside the quotes) → «وَهُوَ يَقْرَأُ الصُّوَرَ عَلَى طَرِيقَتِهِ»; «لِأَحَدْ:» → «لِمُسْتَمِعْ:»; فُقَاعَات → فُقَّاعَات (library spelling, A12).
- Kept: ثَمَانِي صَفَحَاتٍ (two folded sheets: right); ثَلَاثَةُ مُسْتَمِعِينَ (mixed group).

### C13 After the Storm
- W p4, p5, f07, f08 (writer flagged): كَبِيرٌ عَلَى وَاحِدْ → **ثَقِيلٌ عَلَى وَاحِدْ** (the natural "too heavy for one"; the refrain changed in all four places).
- W p4: «لَمْ يَتَحَرَّكِ الْغُصْنُ وَلَا قَلِيلًا» → «وَلَوْ قَلِيلًا» (Diana's own line f06 keeps the spoken «وَلَا قَلِيلًا»); p6 وَفِي الْآخِرِ → وَأَخِيرًا; p13 «انْفَتَحَتِ الْبَوَّابَةُ عَلَى مِصْرَاعَيْهَا» (writer flagged) → «دَفَعَتْ دِيَانَا الْبَوَّابَةَ، فَانْفَتَحَتْ وَاسِعَةً»; p1 «وَأَخِيرًا، فِي آخِرِ اللَّيْلِ» → «وَقُرْبَ الْفَجْرِ… أَخِيرًا»; p2 السَّمَاءُ نَظِيفَةً → صَافِيَةً; p5 وَطَرَقَتْ → وَطَرَقَتِ الْبَابْ.
- A forAdult: «هَذَا النَّشَاطُ يَقْلِبُ الشُّكْرْ» → «يَصِيرُ الصِّغَارُ هُمُ الَّذِينَ يَشْكُرُونْ»; «وَالْمُشَارَكَةُ فِي مَجْمُوعَةٍ مِنَ الْأَهْدَافِ» (read as "taking part in a group of goals") → «وَالِانْضِمَامُ إِلَى الْمَجْمُوعَاتِ هُمَا مِنَ الْأَهْدَافِ»; inClass «عَامِلَ النَّظَافَةِ… السِّكْرِتِيرَ، أَوِ الطَّبَّاخْ» (all masculine) → «مَنْ يُنَظِّفُ، أَوْ مَنْ يَحْرُسُ الْبَوَّابَةَ، أَوْ مَنْ يَعْمَلُ فِي الْمَكْتَبِ، أَوْ مَنْ يَطْبُخْ» (as C03).
- Kept: خَمْسَةُ أَطْفَالٍ، ثَمَانِي أَيْدٍ، خَمْسُ رُسُومَاتٍ، أَيْدِيَ التَّوْأَمَيْنِ، ثَنَوْا رُكَبَهُمْ.

### C14 Two Ideas, One Raft
- W p1 (water safety, to match the English): «يَرْفَعُ عَيْنَيْهِ إِلَى الْمَاءِ بَيْنَ حِينٍ وَآخَرْ» (now and then) → «كُلَّ بِضْعَةِ أَسْطُرْ».
- M p8: «وَرَاحَ رَانِي يَنْظُرُ إِلَيْهِ وَهُوَ يَشُدُّ أَصَابِعَهَا» (هو could be Rani) → «وَنَظَرَ رَانِي إِلَى الْمِنْدِيلِ الصَّغِيرِ يَشُدُّ أَصَابِعَهَا»; forAdult «حَتَّى يَنْحَنِيَ الْجِسْرُ وَتَنْزَلِقْ» (what slides?) → «وَتَنْزَلِقَ الْوَرَقَةْ».
- E (light layer) p9, f17: «احْكِ لِي» (masculine) showed as احك, losing the vowel that tells it from احكي → «احْكِ^» (screen: احكِ).
- W p14 (writer flagged): «تَبَادَلَتْ سِيلِينُ وَرَانِي النَّظَرَاتْ» → «نَظَرَتْ سِيلِينُ إِلَى رَانِي، وَنَظَرَ رَانِي إِلَى سِيلِينْ».
- Kept: سِتَّةَ أَعْوَادٍ، بِضْعُ أَوْرَاقٍ، الْفِكْرَتَيْنِ كِلْتَيْهِمَا، «أَرَأَيْتْ؟» (Rani is a boy; nothing lost), طَوْف (Standard-only, pictured and repeated), يَعْسُوب.

### C15 The Bottle That Looked Like Juice
- **F forAdult (poison-centre advice, via the English reviewer):** added «لَا تَنْتَظِرُوا ظُهُورَ أَعْرَاضٍ، وَلَا تُحَاوِلُوا أَنْ تَجْعَلُوا الطِّفْلَ يَتَقَيَّأُ، وَأَبْقُوا الْمُنْتَجَ مَعَكُمْ لِتَقْرَؤُوا مُلْصَقَهُ عِنْدَ الِاتِّصَالْ.»
- M p12: «كَانَتِ الصَّغِيرَةُ مَائِلَةً قَلِيلًا» (reads "the little girl was crooked") → «كَانَتْ يَدُ الصَّغِيرِ مَائِلَةً قَلِيلًا».
- W p8: الرَّفِّ الْوَاطِئْ → الْمُنْخَفِضْ; p9: عَلَى دَرَجَةٍ مَتِينَةٍ (a stair) → عَلَى سُلَّمٍ صَغِيرٍ مَتِينٍ; p14, f23: «كَانَ طَعْمُهُ طَعْمَ الْبُرْتُقَالِ وَالشَّمْسْ» (writer flagged) → «مِثْلَ طَعْمِ…».
- A inClass: «يَعُدُّونَهَا اثْنَيْنِ اثْنَيْنِ» (reads "count them in twos") → «يَعُدُّونَهَا، كُلُّ اثْنَيْنِ مَعًا» (children in pairs, as the English).
- Kept: the count وَاحِدَةْ… سَبْعْ and سَبْعُ زُجَاجَاتٍ (feminine forms for the bottles themselves, pilot D6); ثَلَاثِ أَرْجُلٍ، أَرْبَعُ أَصَابِعَ (إصبع feminine)، ثَلَاثَةَ أَكْوَابٍ، جَلَسُوا ثَلَاثَتُهُمْ؛ «جَدَّتِي، مِنْ فَضْلِكِ^».

## 3. Decisions

1. **G1, the safety line.** I corrected the grammar in C02–C15 rather than keep a known error for uniformity. The
   other 31 stories need the same one-word fix (فَ). Until then the library has two forms of the line.
2. **The `^` marker on a final vowel that is not a person ending** (احْكِ^ in C14, تِ^ in C12). The tool keeps any
   final short vowel marked `^`. Here it keeps the vowel that tells a masculine imperative from a feminine one, and a
   syllable the child must read. I suggest the style guide say so (§2.2, L2 Keep column): "and a final vowel the
   writer marks with ^ because without it the word is misread."
3. **Light-layer density: right, no change.** Measured on the book pages with the same count for all: C01 0.61
   marks per word on screen (1.64 in the full layer); C02–C15 0.57 to 0.63 (1.52 to 1.65). The batch matches the
   reviewed pilot.
4. **Spoken-word choices made library-wide:** بَنَدُورَة (C09, as A02/B12), فُقَّاعَات (C12, as A12). ثَقِيلٌ عَلَى وَاحِدٍ
   (C13) and دَلَّ عَلَى الطَّرِيقِ (C07 title) are new.
5. **No tool change made.** No `|` before « occurs in C02–C15, so no build crashed. Two tool notes for the
   coordinator: (a) rule L8 strips every mark from any word whose letters spell a function word, so a syllable such
   as لًا or a counting fragment shows as لا "no" (C12 worked around); a guard could skip L8 when the word carries
   tanwin. (b) The stretched-sound rule (F13) was not needed in C02–C15.

## 4. Names and facts

**Names:** every name in text matches the ledger: مِيرا، أَدْرِيان، إِمِيل، لِيو (full layer لِيُو)، جُولْيا، أَلِكْس، لِيلِي،
نُوح، مَرْيَم، ماكْس، فِيلِكْس، تَمارا، دِيانا، سِيلِين، رانِي، رُوز. Foreign names of four letters or more decline as
diptotes (أَدْرِيَانَ، أَلِكْسَ، فِيلِكْسَ، سِيلِينَ، رُوزَ in the genitive); نُوحٌ takes tanwin (three letters, middle
sukun), as the writer did. **To add to the ledger** (roles, no new personal names): C07 Noah's aunt **خَالَتُهُ** (the
cousin's mother; no cast sheet, no spoken line); C10 the stork **طَوِيلُ السَّاقَيْنِ** and the big stork
**اللَّقْلَقَةُ الْكَبِيرَةُ**.

**Facts I would still flag** (content, all four languages; not changed by me):
- **C08 p11:** the lifeguard climbs down and walks over with the ball soon after starting her shift, on a beach that is
  filling up. A safety story should not show the chair empty again; better that Dad fetches the ball from the foot of
  the tower, or she hands it down.
- **C13 p7–p11:** five children lift a heavy pine branch while the mother only watches. She checks for fallen wires,
  which is right; consider her lifting too, or a smaller branch, so no child strains or pinches a hand.
- **C06 forAdult:** tapping a *plastic* bottle gives a dull, weak note (the effect is clear on glass, which the
  activity rightly bans). The bracketed sentence may disappoint; suggest "the notes may be faint".
- **C15:** "a black picture inside a red-edged diamond" is the EU and UN (GHS) label; the Israeli rule was not checked
  [U, as the writer said]. An oven cleaner that looks like orange juice is the story's premise; fine.
- **C10:** «ابْتِدَاءً مِنْ شَهْرِ آبَ» and «فَوْقَ إِسْرَائِيلَ» in the adult text (see §5).
- C07, C10, C15 facts are now sourced in `REVIEW-en-C.md` §2.

## 5. What a native Arabic editor should still read

1. **The C07 rewrite, aloud, start to finish:** does the aunt sit naturally in the story without taking the game from
   the children? Is «نُوحٌ يَدُلُّ عَلَى الطَّرِيقِ» a good title?
2. **Spoken-word choices:** أُوهْ، وُوشْ… طَقْ… هُوبْ (C02); زِيزَان (C04); صَحّْ as the tick (C06); مِزْمَار for the
   grandmother's wooden recorder (C06); الْكُرَاتُ الزُّجَاجِيَّةُ for marbles (C11; local words are قُلُول، بَنانير،
   بِلْي); مِرْوَحَةٌ وَرَقِيَّةٌ (C11); تِكْ… تَاكْ and دَنْ (C11); يَمْلَأُ السَّاعَةَ for winding (C11); رِجْلَايَ نَامَتَا
   (C09); حِذَاءَهَا الطَّوِيلَ for rain boots (C13); لَقْلَقَة for the female stork (C10); بَنَدُورَة (C09).
3. **Pausal forms that drop the gender of "you":** «فِي عُمْرِكِ» is now kept by «يَا لِيلِي» (C06); still open:
   «بِفَضْلِكْ» (C13 adult example, deliberately either gender).
4. **Recited lists with a pause on every word** (C03 bags, C05 green-blue, C07 the crossing rule, C10 small-medium-big,
   C15 count of bottles): right for a chant and for the voice?
5. **Month and country in adult text:** «شَهْرِ آبَ» (C10). I am not sure آب should be a diptote; «آبٍ» or rewording
   («مِنْ آخِرِ الصَّيْفِ») may be better. «فَوْقَ إِسْرَائِيلَ» follows the English.
6. **Lines that are correct but may sound bookish:** «عَقَدَ أَسْرَعُهُمْ ذِرَاعَيْهِ» (C02); «حَتَّى كَادَتْ رُكَبُهُمَا
   تَتَلَامَسْ» (C04); «وَسَمَّوْهَا: الدَّوْرَةَ الْبَطِيئَةْ» (C02); «صَبَاحَاتُ الْخَرِيفِ» (C07); «حَانَ الْوَقْتُ
   لِتَتَعَرَّفَ إِلَى السَّاعَةْ» (C11, kept for the pun); «تَعَالَ نُدِيرُهُ» (C02, indicative after تعال).
7. **The two `^` uses in §3.2 and the G1 safety line** before they spread to the rest of the library.
8. **A voice spot check** of one page per story once the voice test runs (pilot review §5.7), especially the
   syllables «احْ، تِ، فَالًا» (C12) and the pausal tanwin ـًا.

## 6. Checks run

- `python3 docs/story-room/pilots/tools/storytool.py build ar c02 … c15`, then `check c02 … c15`: **Errors: none**
  (every speech fully marked, pauses before . ! ؟ : » …, no sukun before hamzat al-wasl, the light layer regenerates
  identically). Arabic words 381–541 a book, longest sentence 16 words, longest caption 12 words.
- Scripted scans of every C02–C15 source: Unicode NFC; no tatweel, no alif wasla sign, no Latin, no invisible
  direction marks, no space before Arabic punctuation; every word ending in ـتُ ـتَ ـتِ ـكَ ـكِ without `^` listed and
  read (all case endings, nouns or feminine past with a helping vowel); at most one exclamation mark per spread; every
  name occurrence compared with the ledger; the فَعْلات plural pattern searched (one error, C04).
- Not checked: how the voice reads any line; how the pages look in the app's font on a phone.
