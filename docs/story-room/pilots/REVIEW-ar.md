# Arabic review of the three pilot stories (A04, B02, C01), 22 Nov 2026

**Result.** I read every `speech` string, every film line and all activity text of the three Arabic stories, mark by
mark. The grammar was in very good shape: I found **6 real errors** (3 missing pauses, 2 agreement slips, 1 missing
writer's marker), made **19 wording changes**, and, at the coordinator's request, replaced the emergency numbers in the three safety lines with one general line, so the text sounds closer to how children and parents actually speak.
I also changed **one deletion rule in the tool**: a word's last doubled letter now keeps its shadda on screen. After
the fixes the Arabic files were rebuilt from the sources and `storytool.py check` passes with no errors.

This is a review by a language model, not by a native editor. Section 5 says what a person must still read.

How the files were changed: only the fully marked sources (`docs/story-room/pilots/src/*.ar.json`) were edited; the
three `content/stories/*/ar.json` were regenerated with `storytool.py build ar` (a new option that rebuilds Arabic
only, so the Hebrew files another reviewer is editing were never touched). Nothing was committed by me.

---

## 1. Counts

| Type | Count |
|---|---|
| Pausal form missing (last word before `).`) | 3 |
| Agreement (gender of السوق; number word with its noun) | 2 |
| Missing `^` marker, so the light layer would have lost a person ending | 1 |
| **Errors, total** | **6** |
| Wording for the age (more natural, closer to speech) | 8 changes in 6 places (story and film) |
| Word choice (rattle, duck sound) | 2 choices, 4 places |
| Adult activity text (clearer, less stiff) | 7 |
| **Wording, total** | **19** |
| Safety line: emergency numbers replaced by one general line (coordinator's request, all three stories) | 3 |
| Tool rule changed (L2 keeps a final shadda) | 1 rule, which affects about 45 word places on screen (25 different word forms) |

Checked and found correct (no change): every case ending, tanwin, shadda and sukun; every hamza seat; hamzat
al-wasl after a verb, a pronoun or a preposition (helping vowels such as مِنَ الْ، عَنِ الْ، أَوِ الْ، كَمِ الْ،
لَكُمُ الْ، أَحْضَرْتُمُ الْ); the duals (يَعُدَّانْ، سَلَّتَيْهِ الْمُرَتَّبَتَيْنِ، مُسَاعِدَيَّ الصَّغِيرَيْنْ، كِلْتَا
يَدَيْهَا); verb moods (لَمْ يَبْقَ، لِنَقِفْ وَنَنْظُرْ، اِبْقَيْ، اِحْكِي to a girl); diptotes (حَمْرَاءُ، أَشْيَاءَ،
مَصَابِيحَ، أَنَابِيبَ but أَنَابِيبِ كَرْتُونٍ in a construct, إِسْرَائِيلَ، لِيَامَ in the genitive). Every number in C01
agrees with its noun: عَشْرُ رُمَّانَاتٍ، سَبْعَ رُمَّانَاتٍ، ثَمَانِيَ رُمَّانَاتٍ، بِثَمَانِي رُمَّانَاتٍ، ثَمَانٍ،
ثَمَانِيًا، اثْنَتَانِ، عَشَرَةُ أَنَابِيبَ، ثَلَاثَةُ أَنَابِيبَ، كَمْ أُنْبُوبًا، كَمْ حَبَّةً، عِشْرُونَ إِلَى ثَلَاثِينَ
دَقِيقَةً، خَمْسُ دَقَائِقَ إِلَى عَشْرٍ، مِتْرَيْنِ أَوْ ثَلَاثَةٍ.

---

## 2. Every correction

### 2.1 Errors

| # | Where | Was | Now | Rule |
|---|---|---|---|---|
| E1 | A04 activity, forAdult | لَابُورْنُومَ). | لَابُورْنُومْ). | F7: the last word of a sentence takes the pause even when a closing bracket comes before the full stop. |
| E2 | B02 activity, forAdult | ثَلَاثَةٌ أَوْ أَرْبَعَةٌ). | ثَلَاثَةٌ أَوْ أَرْبَعَةْ). | F7, as E1 (pausal ta marbuta). |
| E3 | C01 activity, forAdult | لَا بَأْسَ بِالْأَرْقَامِ). | لَا بَأْسَ بِالْأَرْقَامْ). | F7, as E1. |
| E4 | C01 page 1 | كَانَ سُوقُ الْخَرِيفِ … فِي السُّوقِ كُلِّهَا. | … فِي السُّوقِ كُلِّهْ. | السوق was masculine at the start of the page (كَانَ … فَارِغْ) and feminine at the end. One gender per text; masculine is also how it is said aloud. |
| E5 | C01 film f18 | تِسْعَةْ؟ كَانَتْ عَشْرًا. | تِسْعْ؟ كَانَتْ عَشْرًا. | Number agreement: the line is about the pomegranates (feminine), as the next words كَانَتْ عَشْرًا show, so the feminine-noun form تِسْعٌ, as on book page 8. (The abstract sums سَبْعَةٌ وَاثْنَانِ… تِسْعَةٌ stay masculine; see D5.) |
| E6 | B02 activity, forAdult | «سَمِعْتُ أَنّْ…» | «سَمِعْتُ^ أَنّْ…» | L2 keeps the subject ending ـتُ only when the word carries `^`. Without it the screen showed سَمِعت, which can be read sami'ta or sami'ti. |

### 2.2 Wording for the age (story pages and film)

| # | Where | Was | Now | Why |
|---|---|---|---|---|
| W1 | A04 p1 | يَقُولُ الْجَدّْ: «انْظُرْ يَا سَامِي! زُهُورٌ…» | «انْظُرْ يَا سَامِي!» يَقُولُ جَدُّهْ. «زُهُورٌ…» | Every other page says جَدُّه; الجدّ was the only exception. Opening with the call puts Sami's name before "his grandpa", so the pronoun is clear. |
| W2 | A04 f09 (Sami) | لِنَمْشِ مَعًا يَا جَدِّي. | هَيَّا نَمْشِي مَعًا يَا جَدِّي. | لِنَمْشِ is textbook Arabic; no toddler says it. هيّا is shared by Standard and spoken Arabic. The indicative after هيّا is accepted usage. |
| W3 | A04 f12 (Grandpa) | انْظُرْ بِهُدُوءْ… دُعْسُوقَةْ. | شْشْشْ… انْظُرْ… دُعْسُوقَةْ. | "Look quietly" sounds like an instruction; a whispered hush sounds like a grandfather sharing a secret, and matches the English and B02's spelling of the hush. |
| W4 | B02 p3, p6, p13 | زِيقْ (3 times) | وَاكْ | See D4. |
| W5 | B02 p6 | لَكِنَّ صَوْتَهَا كَانَ صَغِيرًا جِدًّا | … كَانَ هَادِئًا جِدًّا | "A small voice" is an English image; Arabic says a voice is quiet (هادئ, also everyday speech). It still pairs with صَاخِبَةً جِدًّا. |
| W6 | B02 p11 and film f18 | تُغَنِّي لَكُمُ الْبَحْرْ | تُغَنِّي لَكُمْ أُغْنِيَةَ الْبَحْرْ | "Sings you the sea" is not idiomatic Arabic. "Sings you the song of the sea" stays Dalia's own magical phrase and still avoids the false claim that the shell holds the sea. |
| W7 | B02 names | صاحِب الخَشخاشة | صاحِب الخَشخيشة | See D3. (The name appears only in the names list.) |
| W8 | C01 f36 (doctor) | شُكْرًا. هَذَا تَمَامًا مَا أَحْتَاجْ. | شُكْرًا. هَذَا مَا أَحْتَاجُهُ بِالضَّبْطْ. | The old order copies English "exactly what I need". بالضبط is the word people say. |

### 2.3 Adult activity text

| # | Where | Was | Now | Why |
|---|---|---|---|---|
| A1 | A04 forAdult | وَيَمْشِي عَلَى مَهْلِ جَدِّهْ | وَيَمْشِي عَلَى مَهْلٍ مَعَ جَدِّهْ | "At his grandpa's slowness" is odd; the new phrase also echoes the refrain. |
| A2 | A04 forAdult | ضَعُوا قُبَّعَةً فِي الشَّمْسْ. | وَفِي الشَّمْسِ، قُبَّعَةٌ عَلَى الرَّأْسْ. | The old sentence literally says "put a hat in the sun". The new one is short, rhymes, and names no gender. |
| A3 | A04 inClass | يَتَبَادَلُ الْفَرِيقَانِ الدَّوْرْ | … الْأَدْوَارْ | The idiom for swapping roles is تبادل الأدوار. |
| A4 | C01 materials | مِنْ لَفَائِفِ الْمَطْبَخِ | مِنْ لَفَائِفِ وَرَقِ الْمَطْبَخِ | "Kitchen rolls" alone is unclear; "kitchen-paper rolls", parallel to وَرَقِ الْحَمَّامِ. |
| A5 | C01 forAdult | the same phrase | the same fix | As A4. |
| A6 | C01 forAdult | مَا وَقَعَ وَمَا بَقِيَ وَاقِفًا يَصِيرُ عَشَرَةً دَائِمًا | مَجْمُوعُ مَا وَقَعَ وَمَا بَقِيَ وَاقِفًا عَشَرَةٌ دَائِمًا | Two subjects with a singular "becomes" was loose; "the total of … is always ten" is exact and uses the story's maths word. |
| A8 | A04, B02, C01 safety (coordinator's request, to match the English and Danish) | لِلطَّوَارِئْ: 101 فِي إِسْرَائِيلَ، وَ112 فِي الدِّنْمَارْكْ. | إِذَا وَقَعَ حَادِثٌ، اتَّصِلُوا بِرَقْمِ الطَّوَارِئِ فِي بَلَدِكُمْ. | One calm line that is right in any country. It speaks to the household in the plural (style-ar §4.2), so it assumes no gender. On screen: «إذا وَقَع حادِث، اتّصِلوا برَقم الطَوارِئ في بَلَدِكُم.» |
| A7 | C01 forAdult | أَوْ هَدَفٌ أَنْ يَصِلَ الْمَجْمُوعُ إِلَى عِشْرِينَ تَمَامًا | أَوْ مُحَاوَلَةُ الْوُصُولِ بِالْمَجْمُوعِ إِلَى عِشْرِينَ تَمَامًا | The old phrase did not read as a sentence; now it is a verbal noun like the items around it (style-ar §4.1). |

---

## 3. Decisions

**D1. A word's final shadda stays in the light layer (tool changed).** Rule L2 deleted every mark on a word's last
letter, so a final doubled letter lost its shadda on screen: عَدّ showed as عَد, ظَلّ as ظَل (which reads as "shade"),
لَكِنّ as لَكِن (a different word, with different grammar after it), يَعُدّ, أَيّ, سِنّ, مَمَرّ, تَطِنّ, مُسَاعِدَيّ and
others. A shadda is not a vowel: it is a doubled consonant, part of the word's spelling, and removing it changes the
reading. So L2 now keeps a final shadda (its vowel still goes). This adds about 45 marks across the three stories,
and none of them is a "mosquito": each one changes how the word is read. Change in
`docs/story-room/pilots/tools/storytool.py`, one line in `ar_light_word`. The guide's three worked examples still come
out exactly the same.
**The guide needs the matching line, which I was not asked to edit:** in `style-ar.md` §2.2, L2's Keep column, add
"A shadda on the last letter (its vowel is still deleted)."

**D2. Is the light layer right? Yes, keep it (no other rule change).** Measured on the story pages: the light layer
has 1.0 marks a word (A04), 1.4 (B02) and 1.4 (C01), against 3.1 to 3.8 in the full layer, so roughly two marks in
three are gone. What stays is what the eye needs to read the word correctly: the vowels inside words (which tell
قُسِمَت from قَسَمَت, صَدَفة from صُدفة), every shadda, and every hamza. Case endings, sukun and the article go, and a
reader who knows Arabic supplies those from the grammar. I would not trim further by rule. Any further trimming (for
example dropping a fatha on a verb's first letter) needs judgement word by word, which the rule-based system was
built to avoid. One open point for the editor is L5 (D7).

**D3. Rattle: خَشخيشة, not خَشخاشة.** خشخيشة is the everyday word for a baby's rattle in Levantine Arabic, and it is
the word Arabic baby-shop listings use today ([Mumzworld](https://www.mumzworld.com/ar/tumama-musical-rattle-toy-red),
[Nahdi](https://www.nahdionline.com/ar-sa/playgro-clip-clop-rattel/pdp/100621525)). خشخاشة is listed as a synonym in an
old dictionary (Dozy, under شخشخ, [arabiclexicon](https://arabiclexicon.hawramani.com/%d8%b4%d8%ae%d8%b4%d8%ae/?book=34)),
but it is rare today and it sounds like خَشخاش, the poppy.

**D4. The duck's sound: وَاكْ، وَاكْ, not زِيقْ.** زيق is not a recognised squeak word in Arabic, and in Levantine
speech زيق is the hem of a garment, so a parent may stumble on it. Arab children learn that a duck says واك واك in
nursery play, and it keeps the joke of the line "my duck sings!". It is a quack rather than a rubber squeak; I judge
that recognition matters more here. [U] I could not find a written source for واك; this is from my knowledge of
spoken Arabic, so a native editor must confirm it.

**D5. Ladybird: keep دُعْسُوقَة.** It is the Standard name used in Arabic reference works and school science
([Marefa](https://www.marefa.org/دعسوقة)). Spoken names for the insect vary by village and family, and I found no
single spoken name that I could verify for the Arab community in Israel. The story follows style-ar §1.3 for a
Standard-only word: it is pictured, and it is repeated (A04 p7, p11, film f12) in a sentence that shows what it is.

**D6. Numbers in C01 (confirmed, no change).** (a) Counting aloud, وَاحِدْ، اثْنَانْ، ثَلَاثَةْ… with sukun even before
a comma, is not an exception to F7. In Standard grammar, number words recited in a list have no case ending and end
in sukun. (b) When the speaker counts the pomegranates themselves, the feminine-noun forms are used (عَشْرٌ، سَبْعٌ،
اثْنَتَانِ، ثَمَانٍ). When the speaker states a sum as pure numbers, the abstract school forms are used (سَبْعَةٌ
وَثَلَاثَةٌ… عَشَرَةٌ), as Arab schools teach arithmetic. Both are correct. E5 fixed the one line that mixed them.
(c) سَآخُذُ ثَمَانِيًا (f25) is correct: ثماني with no noun after it, in the accusative, takes tanwin.

**D7. Sun letters in the light layer (left as the guide says, flagged).** L5 removes the shadda on a sun letter after
ال but leaves its vowel: الصَدَفة، التَلّة، الطَبيبة. That is the literal rule, and the vowel can help (الصَّدَفة, the
shell, against الصُّدْفة, chance). Some editors find a vowel on a sun letter without its shadda unusual. The native
editor should rule on it: keep it as it is, or keep the shadda whenever the vowel stays.

**D8. Kept as written.** «لَا، لَا، اثْنَتَانِ لِي!» (C01 p12, f33) is correct and sounds natural. Dalia's
«نَعَمْ، نَعَمْ… احْكِي لَنَا!» is the correct feminine imperative. B02's addresses to the child reader in the plural
(وَأَنْتُمْ، مَاذَا كُنْتُمْ سَتَفْعَلُونْ؟) are correct. زَبُونَانِ for a man and a woman is correct (a mixed pair takes the
masculine). بَسْطَة (stall) is shared by speech and modern Standard. طَقْ for rain matches the verb يَطْرُقُ (knocks).
The hush شْشْشْ is written with sukuns, which is fine for the voice. The Western digits in C01's adult text
(3 + 7 = 10) were left for the editor (§5). The emergency numbers, and with them the «في إسرائيل» question, are gone
from the safety lines (A8).

**D9. Tool option.** `storytool.py build ar` (or `build he`) rebuilds one language only. Plain `build` still rebuilds
both, as before.

---

## 4. Checks run

- `python3 docs/story-room/pilots/tools/storytool.py build ar`, then `… check`: **Errors: none** (all four languages,
  all three stories).
- The guide's three worked examples, run through `storytool.py light`, still give exactly the guide's light text.
- A scan of every Arabic source string found: no Latin letters or Latin punctuation, no tatweel (ـ), no alif wasla sign
  (ٱ), no invisible direction or joining characters, no space before ، . ؛ ؟ ! :, and all text in Unicode NFC.
- A list of every word ending in ـتُ ـتَ ـتِ ـكَ ـكِ without `^`. All of them were reviewed; only سَمِعْتُ was a real
  person ending (E6). The rest are the feminine ـتِ with a helping vowel (قَالَتِ الْ…) or ordinary nouns (ذَلِكَ، تَحْتَ).

Not checked: how a real voice reads any line (no voice test was run), and how the text looks set in the app's font.

---

## 5. What a native Arabic editor should still read

I am a language model. I know Standard Arabic grammar well, but I do not hear how a child in Nazareth, Rahat or
Haifa actually speaks, and I can be confidently wrong about a mark. Please have a native children's-book editor read:

1. **The spoken-word choices:** وَاكْ for the duck (D4, unverified by any source), خَشخيشة (D3), دُعْسُوقَة (D5), طَقْ for
   rain, بُمْ for the drum (an Arab child may expect دُمْ), هَيَّا نَمْشِي (W2).
2. **The light layer on real pages,** on a phone, in the chosen font: is 1 to 1.4 marks a word right for parents
   reading aloud (D2)? And the sun-letter question (D7).
3. **The age 6 to 8 default** of showing the light layer (style-ar §2.3). This is the guide's own most-open question.
4. **Lines that are correct but may sound bookish:** «أَحْسَنْتُمَا، يَا مُسَاعِدَيَّ الصَّغِيرَيْنْ» (C01 p14); عَقَدَ
   لِيَامُ ذِرَاعَيْهِ عَلَى صَدْرِهْ (C01 p4); يَجْثُو الصِّغَارُ (C01 activity); سَأَصْعَدُ أَوَّلًا (A04 f03).
5. **A community question, not grammar:** whether adult text should use Western digits (3) or Eastern Arabic digits
   (٣). Also, whether the equation 3 + 7 = 10 (C01 activity) displays in the intended order inside right-to-left text:
   this needs checking on screen. And whether the new safety line (A8) reads naturally.
6. **لَابُورْنُوم** in A04's plant warning. I found no settled Arabic name for laburnum. The warning is meant for
   Danish readers, and an Arabic-reading parent in Denmark may know it only by its Danish or English name.
7. **A spot check of the full layer** of at least one page per story against the voice, once the voice test (style-ar
   §2.1 open point) is run. For example, whether the voice reads لِي الْيَوْمَ (C01 p7) as "li l-yawm", and the pausal
   ـًا as "-ā".
