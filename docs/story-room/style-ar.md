# Style guide: Arabic (العربية) for StoryTime read-aloud text

For writers and reviewers of StoryTime's own Arabic stories. Tags: [S] sourced (file and section named), [D] our
judgement, [U] unverified, [P] proposal to test. Research files: `ages` = `docs/research/ages-raw.md`, `vowels` =
`docs/research/vowel-marks-raw.md`.

**This guide never applies to the author's story.** Her Arabic text is hers: we do not edit, shorten, translate or
add vowel marks to it without her written consent (project rule 3).

**Status:** the vowel-mark convention in section 2 is **our own convention**. No publisher rule or style guide for
vowel marks by age was found [S that it is missing, vowels §1 and §"Could not verify"]. It must be confirmed by a
native Arabic children's-book editor before Stage 6 writing begins.

---

## 1. Register: simple Modern Standard Arabic, close to everyday speech

The owner chose Modern Standard Arabic (فصحى) for all stories (master plan §3.7). The best evidence we have, one
study of 139 Arab kindergarten children in Israel, found that stories in spoken Arabic were understood best and
stories entirely in Standard Arabic worst, and that a gradual move toward Standard Arabic, with Standard-only words
taught on purpose, worked [S, ages §E; one study, not causal by its authors' own account]. So:

1. **Grammar is Standard; the word choice leans toward speech.** When Standard Arabic offers two words for the same
   thing, choose the one that is also used in everyday spoken Arabic [D, ages §E].

   | Choose | Not | Why |
   |---|---|---|
   | بَيْت | مَنْزِل | both Standard; بيت is also spoken |
   | شُبّاك | نافِذَة | both Standard; شبّاك is also spoken |
   | أَكَلَ | تَناوَلَ | تناول is formal-only |
   | رَجَعَ | عادَ | both Standard; رجع is also spoken |
   | رَكَضَ | عَدا | عدا is rare and also means "except" |
   | وَلَد، بِنْت | فَتًى، فَتاة | for young children |

2. **No dialect words** in the text (no هلّق، شو، بدّي، كتير). Where no shared word exists, use the Standard word.
   Whether to allow dialogue lines in a light spoken register is an open question for the editor (README).
3. **A Standard-only word that matters to the story** is shown in the picture, repeated at least twice, and used in a
   sentence that explains it [S, ages §E: the study recommends explicit teaching of Standard-only words].
4. **Grammar to avoid in group A (2 to 3):** the dual verb (يَلْعَبانِ), the passive, relative clauses, كانَ with a
   participle, conditional sentences. In group B use them rarely; in group C freely [D].
5. **Parents' names for themselves:** ماما and بابا in dialogue and in group-A narration (they are the child's own
   words); أُمُّه، أَبوه، جَدُّه، جَدَّتُه in narration for groups B and C [D]. Grandparents in dialogue: جَدّي، جَدَّتي
   (never the dialect تيتا، سيدو).

---

## 2. Vowel marks (تشكيل) in two layers

Every sentence of our Arabic text is stored twice (master plan §13: `display` and `speech` forms):

- **The full layer (`speech`)** is written first, by grammar. It feeds the future narrator voice and the "read it
  myself" view. It is never shortened.
- **The light layer (`display`)** is what the parent and child see. It is **made from the full layer by deleting
  marks under fixed rules, never by adding or choosing**. Two writers who agree on the full layer therefore always
  produce the same light layer.

Why two layers: the owner asked for enough marks to read and pronounce correctly but not so many that "every word
looks covered in mosquitoes" (owner F3, F4), and for marks that help the voice (owner F5). Research says full marks
help beginners and slow skilled readers; when to drop them is "largely anecdotal" [S, vowels §1]. Whether marks
improve ElevenLabs pronunciation is unknown and must be tested [S that it is unknown, vowels §4.2].

### 2.1 The full layer: twelve rules

| # | Rule | Example |
|---|---|---|
| F1 | Every pronounced short vowel is written: fatha, damma, kasra. | كَتَبَ |
| F2 | Every consonant without a vowel carries sukun, including the lam of the article before a moon letter, and و or ي that close a syllable (diphthong). | الْقَمَرُ، بَيْتٌ، يَوْمٌ |
| F3 | Every doubled consonant carries shadda **with** its vowel. The sun letter after ال carries shadda; that lam carries nothing. | مُعَلِّمَةٌ، الشَّمْسُ |
| F4 | Long-vowel letters (ا، ى، و and ي when they lengthen a vowel) carry no mark; the letter before them carries the matching short vowel. | كِتابٌ، نُورٌ، كَبِيرٌ |
| F5 | Hamzat al-wasl is a plain ا with no mark (never ٱ). Hamzat al-qat' is always written with its hamza and its vowel. | اِسْمٌ is written اسْمٌ; أَكَلَ، إِلَى، أُمٌّ |
| F6 | Every word carries its case or mood ending (إعراب), by the grammar of the sentence, in connected speech. | رَأَتِ الْبِنْتُ قِطَّةً صَغِيرَةً |
| F7 | **Pausal form:** the last word before . ! ? : or a closing » takes the pause. A final short vowel, or tanwin with damma or kasra, becomes sukun. Tanwin with fatha stays written ـًا. Ta marbuta takes sukun (ـةْ). A comma does not cause a pause. | ذَهَبَتْ إِلَى السُّوقْ. / أَنْتِ لَطِيفَةْ! / قالَتْ: «شُكْرًا.» |
| F8 | Tanwin with fatha sits on the letter before the alif, not on the alif. | شُكْرًا (not شكراً) |
| F9 | Alif maqsura is ى (no dots); final ya is ي (two dots). Ta marbuta is ة, never ه. | مُسْتَشْفَى، كُرْسِيٌّ، شَجَرَةٌ |
| F10 | Numbers are written as words, with full agreement (3 to 10 take the opposite gender of the singular noun; the noun follows in the genitive plural). | ثَلاثَةُ قَوارِبَ (قارِب is masculine) |
| F11 | When a word could be read two ways, the writer chooses by meaning and marks every letter; no letter of the full layer is left bare except those F4 and F5 name. | كُسِرَ (was broken) not كَسَرَ |
| F12 | No tatweel (ـ) anywhere; text stored in Unicode NFC, with each mark typed directly after its letter. | |

**Open point for the voice test [P]:** F7 writes the pausal tanwin fatha as ـًا. If the voice reads it as "-an"
instead of "-ā", the speech layer may switch to a plain alif with fatha (ـَا) at pauses only. Decide in the Stage 10
pronunciation test (master plan §10).

### 2.2 The light layer: eight deletion rules

Start from the full layer and delete, in this order:

| # | Delete | Keep |
|---|---|---|
| L1 | Every sukun. | |
| L2 | Every mark on the **last letter** of every word. | Tanwin with fatha (ـًا، ـةً، ـءً). The final vowel of these person and gender endings: the past-tense subject endings ـتُ ـتَ ـتِ, the endings ـكَ ـكِ, and the pronouns أنتَ أنتِ. |
| L3 | The short vowel right before a long-vowel letter: fatha before ا or ى, damma before lengthening و, kasra before lengthening ي. | |
| L4 | The fatha right before ة. | |
| L5 | All marks on the article ال, and the shadda on the sun letter right after it. | |
| L6 | The vowel that sits on a shadda. | The shadda itself (everywhere except L5). |
| L7 | The kasra under إ. | The fatha or damma on أ (it tells أَ from أُ). |
| L8 | All marks on these function words and on one-letter prefixes (وَ فَ بِ لِ كَ): في، على، إلى، عن، مع، هو، هي، هم، هما، أنا، نحن، أنتَ، أنتِ، أنتم، هذا، هذه، ذلك، تلك، هنا، هناك، كان، كانت، قال، قالت، يا، لا، ما، لم، لن، أن، إن، ثم، أو، كل، الذي، التي، قد، حتى | A shadda (ثمّ، كلّ، أنّ، إنّ) and the L2 gender endings (أنتِ). **من is not on the list:** it keeps its first vowel, because مِن (from) and مَن (who) differ. |

Everything else stays: the short vowels inside each word, every other shadda, and every hamza with its seat.

**Worked example 1**
- Full: ذَهَبَتْ لِينَا مَعَ جَدَّتِهَا إِلَى السُّوقْ.
- Light: ذَهَبَت لينا مع جَدّتِها إلى السوق.

(ذَهَبَتْ: L1 deletes the final sukun. لِينَا: L3 deletes both vowels. مَعَ: L8. جَدَّتِهَا: L6 deletes the fatha on
the shadda, L3 deletes the fatha before ا. إِلَى: L8. السُّوقْ: L5, L3, L1.)

**Worked example 2**
- Full: قَالَتْ لِينَا: «شُكْرًا يَا جَدَّتِي، أَنْتِ لَطِيفَةْ!»
- Light: قالت لينا: «شُكرًا يا جَدّتي، أنتِ لَطيفة!»

**Worked example 3 (an activity step, see section 4)**
- Full: وَضْعُ الْحَجَرِ فِي الْكُوبْ. (F7: the last word before the full stop is pausal.)
- Light: وَضع الحَجَر في الكوب.

### 2.3 Which layer each age sees [D, flagged]

| Group | On screen | Why |
|---|---|---|
| A (2 to 3) | light | an adult reads aloud; the child does not read [S, ages §H inference by the researcher] |
| B (4 to 5) | light | the same |
| C (6 to 8) | light by default, plus an "I read by myself" switch (أَقْرَأُ وَحْدي) that shows the full layer | children begin to read at 6 and full marks help beginners [S, vowels §1]; the owner does not want mosquito-covered pages [owner F4]. **This default is one of the decisions most in need of the native editor's view.** The research's own working convention recommends the full layer for beginning readers in grades 1 and 2 (vowels §1; ages §H), so this default departs from it on purpose, for the owner's request (F4). If the editor sides with the research, flip the default to the full layer; nothing else changes. |

The voice always reads the full layer (master plan §6, Stage 6).

**Adult-facing text** (activity explanations, step captions, notes for the parent or teacher) uses the light layer
too, made by the same rules, so that one system covers everything an Arabic reader sees [D].

### 2.4 Tools

Automatic vowelling tools (CATT, Sadeed, Mishkal and others) are a second opinion only; a human writes and checks
every mark (owner F, master plan §8). Licences differ: Farasa and likely Sadeed are research-only; Mishkal is GPL [S,
vowels §3]. Every line is checked by reading, never trusted blindly.

---

## 3. Sentence rhythm for reading aloud

1. One idea per sentence. Group A: 2 to 6 words; group B: 5 to 10; group C: 8 to 14, varied [D, from the age briefs].
2. Put the important word at the end of the sentence, where the voice lands.
3. A refrain keeps the same words and the same marks every time it returns, so the child can join in [S, ages §G].
4. Prefer verb-first sentences in narration (ذَهَبَت لينا), which is the natural Standard order, and noun-first in
   short dialogue lines when it sounds more natural (لينا هنا!) [D].
5. Read every sentence aloud before saving it. If you stumble, the parent will too.
6. Rhyme is written in Arabic from the start, never translated from another language [S that rhyme transfer is
   unverified, ages §H]. Short saj' (rhymed prose endings) suits Arabic read-aloud better than metred verse [D].
7. Pauses for the voice come from punctuation: the newest voice model has no break tags and uses punctuation and the
   ellipsis instead [S, vowels §4.2]. Use … sparingly, for a real pause.

---

## 4. Speaking to parents and teachers without assuming gender

Arabic marks gender in "you". Project rule 5 requires that we never assume the reader is a man or a woman.

1. **Activity steps and captions:** use the verbal noun (مصدر): «وَضع الحَجَر في الكوب»، «جَمع الأوراق الكبيرة» [D].
2. **Speaking to the adult and child together:** use the plural, addressed to the household: «اقرَؤوا القِصّة مَعًا»
   [D; the plural is grammatically masculine but addresses a mixed group, which is the established usage].
3. **Notes to the adult alone:** prefer impersonal forms: «يُستحسَن أن...», «من المفيد أن...», «على الكِبار...».
4. **Never** use slash forms (اقرأ/ي), and never a singular masculine or feminine imperative to the reader.
5. **Never** assume who the adult is: not «الأمّ» by default; use «الأهل» or «الكِبار» or «المُعلِّم أو المُعلِّمة» only
   when both are written out.

---

## 5. Names

1. **One name per character in all four languages**, chosen from names that sound natural in both Arabic- and
   Hebrew-speaking homes and are easy to say in English and Danish. The fixed spellings are in the name ledger at
   the end of `outlines.md` [D].
2. **Keep** a proper name: the same name in every language, spelled for each script. **Adapt** only the spelling
   (never the name) when a language would misread it. **Translate** a name that is an ordinary word (a cat called
   "Cloud" becomes غَيْمة). **Change** a name only if it means something rude or silly in one language; record the
   change in the ledger.
3. Names carry their marks once in the ledger; in the light layer they follow the deletion rules like any word.
4. Names shared by all the Abrahamic traditions (Adam, Yousef, Elias) are welcome. Avoid names tied to only one
   community's religious figures, names of public figures, and the names of the owner's family (for example Sari) [D].
5. Avoid names that sound like a common word in Arabic: "Tom" is close to ثوم (garlic) in spoken Arabic, so it is not
   used [D].

---

## 6. Numerals

1. In story text, numbers are words, fully marked (F10). This helps the voice and teaches the number words [D].
2. Digits never appear in story text or inside any picture or film (master plan §7): clock faces carry twelve marks,
   charts carry ticks, countdowns are shrinking dots. Digits appear only in adult-facing activity text ("10 to 20
   cups"). Which digit shapes that text uses, Eastern Arabic (٣) or Western (3), is an open question for the native
   editor.
3. Counting aloud in a refrain uses the counting forms: واحِد، اثْنان، ثَلاثَة... [D, editor to confirm].

---

## 7. Punctuation and typesetting

1. Arabic comma ، ; semicolon ؛ ; question mark ؟ ; full stop . ; exclamation ! . No space before a mark, one space
   after.
2. Dialogue: «...» guillemets, introduced by a colon: قالت لينا: «...».
3. **Never letter-space, stretch or split an Arabic word**: no tracking, no tatweel, no hyphenation, no line break
   inside a word, no justification by stretching (project rule 5). Keep the lam-alif ligature.
4. Text is real text (never an image), right-to-left, with logical CSS (start and end), set with the rtl-typesetting
   skill and a font whose marks sit clearly above and below the letters.
5. Never insert anything between a letter and its marks.
6. Exclamation marks: at most one exclamation mark per spread in groups B and C. In group A, sound words and short calls may each carry
   one (Splash! Found you!), never more than one per sentence [D].

---

## 8. Words and content to avoid

- Dialect words (section 1) and slang.
- Religious formulas in narration or dialogue (إن شاء الله، الحمد لله، بسم الله): common to Muslim and Christian
  speakers alike, but the library stays neutral for every family [D].
- Political or contested words: وطن in a political sense, شهيد، احتلال، حدود، حاجز، names of contested places [D].
- Archaic or Quranic-sounding forms where an everyday Standard word exists.
- Words that shame: غَبيّ، كَسول، شَقيّ as labels for a child; teasing about bodies, skin, accent [D].
- Food that only some families eat: pork, wine; meat served together with milk in one meal (it excludes families who
  keep kosher) [D].
- Gender rules as morals ("girls don't...", "boys don't cry") [D].

---

## 9. Cultural neutrality for every family in Israel

The stories serve Arab families (Muslim, Christian, Druze), Jewish families (secular and religious) and others,
in Arabic, Hebrew, English and Danish (master plan §3.7).

1. **No holidays** as the subject of a story, and no religious symbols in text or pictures [D].
2. **Places are types, not named places:** the sea, the market, the desert, the hills, a city, a village. No real
   town names, no maps of the country, no flags, no uniforms of army or police; a lifeguard, a bus driver, a crossing
   helper and a nurse are fine [D].
3. **Food everyone shares:** bread, pita, olives, oranges, watermelon, pomegranates, cucumbers, tomatoes, dates, figs,
   rice, lentil soup.
4. **Clothes** are everyday and modest enough for any family (relevant for the Studio's drawings) [D].
5. **Families** are mother and father, single parent, grandparents raising a child, big families, small families [S,
   ages §J2 item 34 for "families that look different"; the limits of what to show are our judgement, D].
6. **Animals:** no pigs; dogs appear outdoors and are not shown licking faces [D].
7. **No weekday names** (الجمعة، السبت، الأحد mark a day of rest for one community or another); write "one morning" [D].
8. **Nature and seasons** follow the local year: rain in winter, anemones in spring, sea and heat in summer, first
   rain and migrating birds in autumn. Snow only in the hills, rarely.

---

## 10. Reviewer's checklist (tick all ten)

- [ ] 1. The text is Standard Arabic grammar with everyday wording; no dialect words; Standard-only key words are pictured and repeated.
- [ ] 2. The full layer follows F1 to F12: every letter marked, case endings present, pausal form before . ! ? : and », tanwin fatha on the letter before the alif.
- [ ] 3. The light layer was made only by applying L1 to L8 to the full layer; regenerating it gives the identical text.
- [ ] 4. Hamza seats, ة and ه, ى and ي are correct in both layers.
- [ ] 5. Numbers are words with correct agreement; no digits in the story text.
- [ ] 6. Sentence lengths fit the age brief; refrains repeat word for word and mark for mark.
- [ ] 7. Every instruction to adults uses the verbal noun, the household plural or an impersonal form; no slash forms; no assumed gender.
- [ ] 8. Character names match the ledger exactly.
- [ ] 9. Punctuation is Arabic (، ؛ ؟ «»); no tatweel, letter-spacing or split words.
- [ ] 10. Nothing in section 8 or 9 is broken: no religious formula, no politics, no excluded food, no shaming word.
