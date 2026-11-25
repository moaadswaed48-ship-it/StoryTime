# Arabic review of batches A and B (28 stories), 25 Nov 2026

**Result.** I read the Arabic of all 28 stories mark by mark: every `speech` line, every film line and all the
activity text of A01–A03, A05–A15 and B01, B03–B15. Pilots A04 and B02 were the standard. The grammar was in good
shape. I found **6 grammar or spelling errors** and **1 screen error** (a giggle that showed up as the pronoun هي).
I made **18 wording changes** where a line was stiff, copied English, or was unclear. I applied the conductor's
**four decisions** (A01 "Wheee", B13 yellow-and-green tiles, B13 red door, A15 snail). I changed **one check in the
tool**. I also made **16 titles pausal** for the voice; this changes nothing on screen.

After the changes the Arabic was rebuilt from the sources with `storytool.py build ar` and checked with
`storytool.py check` on the 28 stories and both pilots: **Errors: none**. Only the Arabic sources
(`docs/story-room/pilots/src/<id>.ar.json`), the generated `content/stories/<id>/ar.json`, the tool's Arabic marks
check, `style-ar.md` (new rule F13) and this report were changed. Nothing was committed by me.

This is a review by a language model, not by a native editor. Section 5 says what a person must still read.

**A working note.** The scratchpad is shared, and another agent overwrote my replacement helper partway through.
For a while my edits did not apply even though the run looked clean. I found this, moved my helpers to a private
folder (`scratchpad/arrev/`), re-applied every edit, and confirmed each one by its match count before the final
build and check.

---

## 1. Counts

| Type | Count |
|---|---|
| Grammar or spelling errors | 6 |
| Screen error (light layer showed a different word) | 1 |
| Wording (stiff, English calque, unclear) | 18 changes in 13 stories |
| Conductor decisions applied | 4 (A01, A15, B13 ×2) |
| Titles made pausal (voice only, screen unchanged) | 16 titles in 13 stories |
| Tool rule changed | 1 (stretched sound words), plus style-ar F13 |
| Stories with no change except the title | A02 (spelling only), A05, A08, A09, A10, A11, A15 (decision only), B01, B08, B11, B15 |

Checked and found correct, with no change needed:
- **Case endings**, including diptote names in every case: آدَمُ، إِلْيَاسُ، دَانْيَالُ، رَيَّانَ، يَاسْمِينَ، يُوسُفَ،
  إِيلَانَ، غَيْمَةَ، نُقْطَةُ، نُورَ.
- **Names that take tanwin:** كَرَمٌ، تَامِرٌ، زَكِيٌّ، أَمِينٌ، أَمِيرٌ، دُبْدُوبٌ.
- **Diptote plurals:** جَوَارِبَ، أَصَابِعَ، صَنَانِيرَ، شَرَاشِيبَ، أَمَاكِنَ.
- **لا of negation with diptote plurals:** لَا جَوَارِبَ صَغِيرَةً، لَا أَكْيَاسَ.
- **Compound numbers:** تَكْفِي خَمْسَ عَشْرَةَ دَقِيقَةً, which is built on fatha in every case.
- **Number agreement:** ثَلَاثُ دَرَجَاتٍ، ثَلَاثَةُ أَكْوَابٍ، سِتَّةُ وُجُوهٍ، ثَمَانِي قِطَعٍ، عَشْرُ عَنَزَاتٍ، أَرْبَعَةَ أَشْيَاءَ.
- **Jussive and subjunctive:** تَعَالَيْ نُصْلِحْهُ، تَعَالَ نَلْعَبْ، أَنْ يَبْكِيَ (pausal يَبْكِي)، قَبْلَ أَنْ تَبْنِيَ.
- **Hamza seats:** يَهْدَؤُوا، ابْدَؤُوا، مَلْآنْ، شَاطِئْ.
- **Hamzat al-wasl after prefixes:** لِابْنِ، الِاثْنَانِ، الِاسْتِئْذَانُ.
- **Pausal forms:** before every . ! ؟ : » … (machine-checked, and read by hand).
- **Mechanical scan:** no Latin letters or Latin punctuation, no tatweel, no ٱ, no invisible direction characters,
  no space before punctuation, all NFC. Every person ending is marked `^`.
- **The safety line:** every activity ends with the pilots' calm general line.

**Marks on screen (the light layer).** About 1.25 marks a word in group A and 1.34 in group B, against 3.5 in the
full layer. This is within the pilots' range of 1.0 to 1.4: enough to read each word correctly, not crowded.

---

## 2. Corrections, story by story

### 2.1 Errors

| # | Story | Was | Now | Rule |
|---|---|---|---|---|
| E1 | A12 p8, f11 | فُقَاعَاتٌ | فُقَّاعَاتٌ | Spelling: the word is فُقّاعة (B07 already writes فُقَّاعَتِي). On screen: فُقّاعات. |
| E2 | A14 inClass | وَيُرِيهِ لِلْمَجْمُوعَةِ | وَيُرِيهِ الْمَجْمُوعَةَ | أَرَى takes two objects, not لِ. |
| E3 | B06 p4 | لِيُرِيَهُ لِأَبِيهْ… | لِيُرِيَهُ أَبَاهْ… | As E2. |
| E4 | B06 forAdult | …عَنْ مُسَاعِدٍ (…)، وَيَقُولُ لَهَا اسْمَهُ | …وَيَقُولُ لِلْعَامِلَةِ اسْمَهُ | لَهَا had no feminine word before it to refer to (مُسَاعِد is masculine). |
| E5 | B13 safety | وَالْحِجَارَةِ الْأَكْبَرِ مِنْ فَتْحَةِ… | وَحِجَارَةٍ أَكْبَرَ مِنْ فَتْحَةِ… | A comparative (أَفْعَل) that carries ال cannot take مِنْ. |
| E6 | B12 activity title | يَتَدَحْرَجُ أَمْ يُرَصُّ؟ | …يُرَصّْ؟ | F7: pausal before ؟. Titles are not machine-checked, so the tool missed it. |
| S1 | A06 f10 | هِي هِي! | هِهِهْ! | On screen, هِي lost its marks under rule L8 and showed as the pronoun هي («هي هي!»). A13 already uses هِهِهْ. |

### 2.2 Wording

| # | Story | Was | Now | Why |
|---|---|---|---|---|
| W1 | A03 forAdult | لِيَرَى الصِّغَارُ كَيْفْ. | لِيَرَى الصِّغَارُ كَيْفَ يَكُونُ ذَلِكْ. | "so the children see how" is English; a bare كيف does not end an Arabic sentence. |
| W2 | A07 p5, f06 | صَوْتٌ كَبِيرْ | صَوْتٌ قَوِيّْ | "A big noise" is English. Arabic calls a loud sound قوي. |
| W3 | A07 p8, f10 | الصَّوْتُ التَّالِي صَغِيرْ / صَوْتٌ صَغِيرٌ، بَعِيدٌ بَعِيدْ | …خَفِيفْ / صَوْتٌ خَفِيفٌ… | Pairs with قوي, and is what a grandmother would say. |
| W4 | A12 forAdult, step 4 | «نُزُولًا… صُعُودًا!» | «إِلَى تَحْتْ… إِلَى فَوْقْ!» | Bookish; parents say "down… up" this way. Pausal at each … so no case question arises. |
| W5 | A12 inClass | يُرِي الْمُعَلِّمُ أَوِ الْمُعَلِّمَةْ: «…» | يُرِي الْمُعَلِّمُ أَوِ الْمُعَلِّمَةُ الْحَرَكَةَ عَلَى دُمْيَةْ: «…» | The verb "shows" had nothing to show. |
| W6 | B03 p5 | وَصَرَخَتْ بِمَا تَشْعُرُ بِهِ حَقًّا: | وَقَالَتْ بِصَوْتٍ عَالٍ مَا تَشْعُرُ بِهْ: | The writer's own doubt: the old line was stiff. |
| W7 | B03 p8, f13 | هَلْ أَسْتَطِيعُ الْمُسَاعَدَةْ؟ | هَلْ أُسَاعِدُكْ؟ | "Can I help?" copied from English; the new line is how a child asks. |
| W8 | B03 p11 | ابْتَعَدَتْ نِينَا وَرَامِي خُطْوَةً إِلَى الْوَرَاءْ | رَجَعَتْ نِينَا… | ابتعد خطوة إلى الوراء doubles the idea; رجع خطوة إلى الوراء is the everyday phrase. |
| W9 | B04 p2 | فِي الدَّاخِلِ، كَانَتْ رَائِحَةُ التُّرَابِ الْمُبْتَلّْ. | …كَانَتْ تَفُوحُ رَائِحَةُ… | The sentence had no predicate. |
| W10 | B04 p11, f20 | أُغْنِيَةً عَوْجَاءَ | أُغْنِيَةً مُضْحِكَةً | The writer's own doubt: a "crooked song" is not Arabic. A funny, happy song keeps the joke. |
| W11 | B05 forAdult | «اتِّجَاهَ الْبَابْ.» | «نَحْوَ الْبَابْ.» | Simpler, and closer to speech. |
| W12 | B05 forAdult, step 2; A13 step 5 | تَحْتَ، فَوْقَ، خَلْفَ… / عَبْرَ، فِي، حَوْلَ، فَوْقْ | تَحْتْ، فَوْقْ، خَلْفْ… / عَبْرْ، فِي، حَوْلْ، فَوْقْ | Place words recited as a list take the pause, like the pilots' counting (D6) and A13's own inClass «عَبْرْ! فِي! حَوْلْ! فَوْقْ!». Nothing changes on screen. |
| W13 | B07 p11 | …وَحَجَرَيْنِ مَكَانَ الْعَيْنَيْنْ. وَجَعَلَا لَهَا ذِرَاعَيْنِ… | …وَحَجَرَيْنِ مَكَانَ الْعَيْنَيْنِ، وَذِرَاعَيْنِ… | One dual verb fewer: B07 had the most dual verbs in group B, which the guide wants rare. |
| W14 | B07 p13 | وَصَفَّقَتْ: «يَا لَهَا…» | وَصَفَّقَتْ وَقَالَتْ: «…» | A clap does not say words. |
| W15 | B09 p3 | وَرَكَضَتْ أَسْرَعْ. | وَرَكَضَتْ أَسْرَعَ مِنْ قَبْلْ. | The writer's own doubt: a bare أسرع as an adverb is weak. |
| W16 | B10 inClass | يَنْتَبِهُ أَنَّ الرَّأْسَ مَسْنُودْ | يَتَأَكَّدُ أَنَّ… | انتبه needs إلى; يتأكّد is the right verb. |
| W17 | B14 inClass | ادْعُوا جَدًّا أَوْ جَدَّةً… لِيُعَلِّمَ | ادْعُوا إِلَى الصَّفِّ ضَيْفًا كَبِيرًا فِي السِّنِّ، جَدًّا أَوْ جَدَّةً، لِيُعَلِّمَ | The masculine pronoun now refers to ضيف, which the text already uses afterwards, so it assumes no gender. |
| W18 | A02 p5, f07 | بَنْدُورَةٌ | بَنَدُورَةٌ | One spelling for the library (B12 has بَنَدُورَة, the usual Levantine form). |

### 2.3 Decisions from the conductor, applied

| Story | Change |
|---|---|
| A01 | "Wheee": وِي, which can read as وَيْ ("woe"), became **وِييي** in all 10 places: the title, p2, p3, p6, p8, p11, f05, f06, f12 and f15. On screen it shows as «وييي!». |
| A15 | The crab became a snail. p5: «سَلْطَعُونٌ صَغِيرٌ يُطِلُّ مِنْ جُحْرِهْ» → **«حَلَزُونٌ صَغِيرٌ يُطِلُّ مِنْ قَوْقَعَتِهْ»**. p10 and f15: السَّلْطَعُونُ → **الْحَلَزُونُ**. |
| B13 | The tiles: زَرْقَاء → **صَفْرَاء** and بَيْضَاء → **خَضْرَاء**, in every form and place, including «خَضْرَاءُ بَعْدَ خَضْرَاءْ!» and «رَفَعَ الْبَلَاطَةَ الْخَضْرَاءَ». The order matches the English (yellow first; two greens is the mistake). The Arabic title «مَمَرُّ الْبَلَاطْ» was already neutral and stays. |
| B13 | The door: «بَابُ إِيلَانَ الْأَخْضَرْ» → **«…الْأَحْمَرْ»** (p1, p11, f13). |

### 2.4 Titles made pausal (voice only)

A title is spoken on its own, so its last word takes the pause, as F7 does before a full stop. Before, 16 titles
still ended in a case vowel (for example كِيسُ اللَّمْسِ). The light layer is the same either way: the tool asserted
this for each title. Changed: A09, A10, A11, A12, A13 and A14 activity titles; B09 (both titles), B10 (both), B11
(both), B12 (story title), B13 (both) and B14 (story title). The pilots' titles «إِطَارُ النَّظَرِ» and
«عَصَا الْكَلَامِ» could get the same change; that is a suggestion, because the pilots are outside this batch.

---

## 3. Decisions I took

**D1. Stretched sound words (tool and guide).** I added F13 to `style-ar.md`. A stretched sound word repeats one
letter three times or more: وِييي، مَاااءْ. The first letter carries its mark; the repeats stay bare.

The tool change is in `ar_fully_marked`, a few lines. A bare letter is accepted only inside a run of three or more
identical letters. No real Arabic word has that, so every other rule stays as strict as before (a run of two is
still an error). Tested: وِييي passes; وِيي and مدد still fail. The guide's worked examples are unaffected.

I chose letter repetition and **not tatweel**, for two reasons. Tatweel is stretching, which project rule 5 and
style-ar §7.3 ban. And a voice reads letters but ignores tatweel, so tatweel would not lengthen the sound.

**D2. The snail's shell is قَوْقَعَة.** It is the Standard word for a snail's shell, and the picture shows it.
صَدَفَة is a sea shell, and B02 uses it for one.

**D3. Kept on purpose:**
- «وَاحِدْ، اثْنَانْ…» counting forms with the sukun (pilot D6).
- The pauses at the rhymes inside B08's soap song (كَفّْ، ظَهْرْ…).
- «أَخَذْتِ وَقْتَكِ كُلَّهْ» (B15), which is natural Arabic too («خُذ وَقتَك»).
- «لَا أَصْفَرُ، وَلَا أَخْضَرُ، وَلَا أَحْمَرْ» (A02): a repeated لا that does not govern its noun takes the
  nominative, which is correct.
- يَحِيكُ (A02): حاكَ is recorded with both و and ي.
- رَقْم for the number word Rafi says, and عَدَد for the quantity (B01).
- The tanwin on أَمِيرٌ: correct for a name, though it may sound like "a prince".
- «هَيَّا نَلْعَبُ» followed by an indicative verb, as in the pilot.

---

## 4. Notes for the coordinator (not Arabic, not changed)

1. **Name ledger** (`outlines.md`). These characters still need ledger entries with their Arabic names:
   - A02: العُصفورة, and العَجوز الطَيِّب (the knitter)
   - A05: الجَمَل الصَغير, and ماما (Mother Camel)
   - A06: فَرَس النَهر الصَغيرة, and بابا (Papa Hippo)
   - A10: غَيْمة, the cat
   - A13: القُنْفُذ الصَغير and ماما قُنْفُذة
   - B01: نُقْطَة, the goat
   - B11: the boy (now only وَلَد) and أُمّ تالا. DECISIONS asks for real names in four languages here.
   - B15: the classmate (now only وَلَد مِن الرَوضة). DECISIONS asks for a real name here too.

   Every named lead and side character already matches the ledger letter for letter.
2. **B10 safe sleep, all languages.** The doll is laid down with "the blanket no higher than its shoulders". The
   AAP 2022 advice that DECISIONS cites says no soft bedding at all for babies, so this line half-teaches the
   opposite. Suggested wording: "on its back, with nothing over it".
3. **DECISIONS also lists a tool fix:** guard the `|` marker before « in the Arabic build. I did not make it,
   because it was not assigned to me and another reviewer uses the same tool.
4. **«في إسرائيل … وفي الدنمارك»** in the plant warning (B13) and in the hopscotch note (B14) follows pilot A04.
   It stays an open question for the community, as in the pilot review.

---

## 5. What a native Arabic editor should still read

1. **Sound words** (none has a written source):
   - **وِييي** (A01): is it the joyful slide sound a parent would read?
   - **Animals:** هِيهَا (donkey), مَاااءْ (goat), زَقْزَقْ (sparrow), خُرْ (purr), وَاءْ (baby).
   - **Things:** طَنّ (keys), تِكْ (needles and tiles), رِنْ (goat bells), قَرْشْ (snow), طَاخْ and طَشّْ, دُقْ
     (heart), فِيُو فِيوِي (clay whistle), دِنْ دُونْ (shop chime), زِيكْ زَاكْ (wipers), بِشْشْ (bus door).
   - **Actions:** فَرْكْ (brushing), وُوشْ (wind). On screen, وُوشْ shows as «ووش», with no mark.
2. **Word choices:**
   - Playground and home: الزَّلَّاقَة (slide), السُّكُوتَر, شِبْشِب, القَيْلُولَة, البَانْيُو, النُّونِيَّة, الجَزْمَة,
     الغُمَّيْضَة.
   - Animals and nature: أَبُو زُرَيْق (jay), تَبْرُكُ (a camel kneeling), قَوْقَعَة (new).
   - Food and people: بَنَدُورَة (now in both A02 and B12), عَنَزَات.
   - Places and things: المَتْجَرُ الكَبِير (supermarket), مَرْيَلَة, دُمْيَةُ ثَلْجٍ, طَائِرَة وَرَقِيَّة, الحَجْلَة,
     تَحْزِرُونَ.
3. **New lines of mine,** to hear aloud:
   - A07: صَوْتٌ قَوِيّْ / خَفِيفْ
   - A12: إِلَى تَحْتْ… إِلَى فَوْقْ
   - B03: هَلْ أُسَاعِدُكْ؟
   - B04: أُغْنِيَةً مُضْحِكَةً سَعِيدَةْ
   - A15: حَلَزُونٌ صَغِيرٌ يُطِلُّ مِنْ قَوْقَعَتِهْ
4. **Lines that are correct but may sound bookish:**
   - B05: «أَيْنَ تَظُنُّ يَاسْمِينُ أَنَّ سَلَّتَهَا مَوْجُودَةْ؟», the false-belief question
   - B10: the lullaby «فِي عَيْنِ الْقَمَرِ الْمُنِيرَةْ»
   - B12: «صِرْتِ عَامِلَةً فِي فَرِيقِي!» for "You're hired"
   - A10: يَدٌ نَاعِمَةٌ for a gentle hand. In speech it can mean a smooth-skinned hand.
5. **The dual verbs in group B** (B07, B08, B12; the guide wants them rare): do they read naturally?
6. **The light layer on a phone,** in the chosen font: 1.25 to 1.34 marks a word. The sun-letter question from
   pilot D7 is still open.
7. **The voice test:** does it read وِييي as one long "wiii"? Does it read the pausal ـةْ in titles correctly, and
   the counting forms with sukun before a comma?

---

## 6. Checks run

- `python3 docs/story-room/pilots/tools/storytool.py build ar <28 ids>`, then `… check <28 ids> a04 b02`:
  **Errors: none**.
- A mechanical scan of every Arabic source string: Latin letters, Latin punctuation, tatweel, ٱ, invisible
  characters, spacing, NFC, prefixes missing `|`, and person endings missing `^`. Nothing found. The safety line
  is identical in all 28 stories.
- Marks per word on the story pages, light and full layer (section 1).
- A spot check of the screen text (A01 p2, A06 f10, A12 p8, A15 p5, B03 p5, B05 p7, B13 p1 and p9, B13 safety):
  each reads as intended.
- Not checked: any real voice reading, and how the text looks set in the app's font.
