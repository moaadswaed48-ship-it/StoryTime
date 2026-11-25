# English review of stories C02 to C15 (ages 6-8), 25 Nov 2026

**Result.** The English of all fourteen stories was read aloud page by page, film line by line and activity by
activity, against `style-en.md`, `age-6-8.md`, the outlines, `DECISIONS.md` and the pilot review (C01). The writing
was already strong: about 30 corrections, most of them small. The one large change is **C07**: by the conductor's
decision, confirmed against Safe Kids Worldwide and Beterem, an adult (Noah's aunt) now walks with the children and
holds Noah's hand at every crossing. Two facts were checked and the adult texts extended (C10 storks, C15 poison
advice). The check tool reports **no English errors** for C02 to C15 (`storytool.py check c02 … c15`, run after the
last edit; the only errors in that run are Arabic light-layer errors, which belong to the Arabic reviewer).

Files changed: `content/stories/<id>/en.json` for C02 to C15 (C09 had no change); `content/stories/c07/story.json`
(art and film notes, the aunt); `docs/story-room/batches/C1-notes.md` §6 and `C2-notes.md` §6 (sources).
The C09 to C15 files keep their original one-line-per-entry layout.

---

## 1. Corrections per story

Important changes carry a full before and after; small ones are named.

| Story | Where | Before | After | Why |
|---|---|---|---|---|
| C02 | p1 | the jump-rope game | the skipping game | "Jump rope" is American; the book is British. "First-grader" is kept (see §3). |
| C03 | p1 | worked at the hospital all night, until morning | all night long | Said the same thing twice. |
| C03 | p6 | opened the bread basket to pack their bread | to pack bread for their lunch boxes | "pack their bread" is unclear. |
| C04 | p1, f03 | Lemons? No, the lemon tree isn’t ready yet! | Lemons? No, the lemons aren’t ripe yet! | What a grandfather actually says; the mishearing joke still works. |
| C05 | p5 | She remembered the tree and the ladder and her sticky hands. | the tree, the warm sun and her sticky hands. | p2 says they picked "on tiptoe"; a ladder also shows children climbing, which the brief keeps out. |
| C05 | p12, f19 | Next time, the snack’s on us. | Next time, we’ll share ours. | "On us" is an adult money idiom that a six-year-old will not get; the new line answers the story's sharing without a moral. |
| C05 | names | Julia's teacher, a boy in Julia's class | curly ’ | House style (also C11, C13, C14, C15 names). |
| C06 | p5 | On tired days she practised anyway | she still practised | "anyway" twice in two lines. |
| C06 | f19 | And now, Lily, with her grandmother’s flute. | And now, here is Lily, with her grandmother’s flute. | The comma made it sound as if the teacher spoke to Lily. |
| **C07** | p1 | Noah walked to school with his big cousin. She was ten… | Every morning, Noah’s aunt walked him and his big cousin to school. His cousin was ten… | Decision C07: an adult at every crossing (§2). |
| C07 | p2 | Noah stopped at the kerb. … so he waited. … Noah walked across. | Noah stopped at the kerb and took his aunt’s hand. … so they waited. … they walked across. Noah did not run. | Same. |
| C07 | p3 | His cousin smiled and said nothing. She just walked one step behind him. | His aunt held his hand and smiled. His cousin said nothing. She just walked one step behind. | Same. |
| C07 | p5, p6 | …and listened. / He lifted his foot to step off the kerb. His cousin put a hand on his shoulder. | …and took his aunt’s hand. He listened. / He lifted his foot to step off the kerb, but his aunt’s hand held him back. His cousin put a hand on his shoulder. “Look too,” … | The adult keeps him safe; the cousin still teaches the lesson. |
| C07 | p8, p9, p10 | His cousin kept her hand… neither of them / (none) / They crossed together | His aunt held his hand tight, and his cousin… nobody / His aunt nodded. / The three of them crossed together | Same. |
| C07 | p11 | from our door to this gate | from your front door to this gate | The cousin does not live with Noah. |
| C07 | p12, p14 | he stopped, looked… / Then he crossed, walking | he stopped, took his aunt’s hand, looked… / hand in hand with his aunt, walking | Same. |
| C07 | f01 | The first week of school. An autumn morning in the city. | The first week of school. Noah walked with his aunt and his big cousin. | The film must introduce the adult. |
| C07 | forAdult | Children of this age still need an adult beside them when they cross. | Child-safety organisations advise that children cross with an adult until they are about nine or ten. | Now sourced (§2). |
| C08 | f17 | You stayed on the sand and called your dad. That was the right thing to do. (16 words) | You stayed on the sand and called Dad. That was the right thing. (13) | The caption was at the limit and too long to read in one look. |
| C10 | forAdult | (ends) …without their parents. | + Most of them then stay in the south for their first summers and come back north only after a few years, when they are ready to nest. | Fact check (§2). |
| C11 | p12 | He thought of the big wheels inside the tower, each one pushing the next, all the way round to four. (20 words) | …inside the tower. Each one pushed the next, all the way round to four. | Two breaths for a beginning reader. |
| C12 | p8, f13 | the rabbit is laughing so much that he fell over | …that he’s fallen over | Tense, British usage. |
| C12 | p10 | her brother told the frog’s surprised face | her brother pulled the frog’s surprised face | "told a face" does not work; pulling the face is funnier and is what a four-year-old does. |
| C15 | forAdult | (ends) …poison information centre or emergency number at once. | + Do not wait for signs, do not try to make the child sick, and keep the product with you so you can read out its label. | Poison-centre advice (§2). |

**No change needed:** C09 (very clean; "pins and needles", the screen countdown and Max's own countdown all work),
C13 apart from the names apostrophe, C14 apart from the same.

## 2. Facts checked, with sources

1. **C07, children crossing roads.** Safe Kids Worldwide, *Pedestrian Safety Tips* (PDF on safekids.org, read in
   full): "Children under 10 need to cross the street with an adult… most kids are unable to judge the speed and
   distance of oncoming cars until age 10." Beterem, *תאונות כהולכי רגל* page on beterem.org: "ילד עד גיל 9 לא חוצה
   כביש לבד". Both confirm the conductor's decision. The ten-year-old cousin is not the adult. Recorded in `C1-notes.md` §6.
2. **C10, when young storks come back.** NABU, *Störche auf Reisen* (nabu.de): young storks "return to the breeding
   area only after some years". A study found in search (MDPI journal) gives first breeding usually at three,
   peaking at four [U: page refused access]. So the writer's softening was right: "One spring, Long-Legs would come
   back too" is true and stays; Grandpa's "In spring. Storks fly back north the same way" is true of the flock. Only
   the adult text gained a sentence. All other stork facts were already sourced in the outline (thermals, no sea
   crossing, day flight, August passage, fishpond valleys, first migration without parents).
3. **C15, the bottle that looks like juice.** Safe Kids Worldwide, *Poisoning Prevention Tips* (2015 PDF, read in
   full): store products out of sight and reach, locks on cabinets, original containers and never a drink bottle;
   many incidents happen when adults are distracted. Israel's National Poison Information Center (Rambam), quoted in
   the Israeli press: original bottles only, never in drink bottles or cups; a high or locked cupboard; do not make
   the child vomit; call the centre in any exposure [S, secondary]. The story matches this: Rose does not touch,
   thinks about where the bottle is, and calls Grandma; Grandma reads the label without lifting the bottle, moves
   every bottle up high and locks the cupboard; the tone stays calm. "A black picture inside a red-edged diamond" is
   true of EU labels; Israeli labelling stays [U].
4. **Other facts, judged and found right:** C04 hearing advice (outline's NHS/ASHA/Cleveland Clinic sources); C06
   bottle pitch (blowing: more water, higher note; tapping: lower) and the squeak from blowing too hard; C08
   drowning in little water (AAP via the brief) and the wide flat foil boat carrying most; C09 AAP on autoplay; C11
   clock: turning the long hand from straight up to straight down moves the short hand halfway; C13 the adult checks
   for fallen wires before children touch the branch; C14 folded paper is stiffer; C05 oranges in an Israeli spring
   [D, general knowledge].
5. **Arithmetic, all exact.** C05: 12 + 10 = 22 children, 11 × 2 = 22 halves, the last half is Julia's; activity: 12
   shares into 2, 3, 4 bowls, 5 bowls leaves 2. C06: day 20 leaves 10 empty boxes, day 25 leaves 5, concert night
   ticks the thirtieth. C10: tally gates of five, counting 5, 10, 15, 20. C11: three o'clock, half past three, four;
   Felix's mistake (reading the long hand at twelve as the hour when the short hand says ten). C12: two folded sheets
   make eight pages. C13: five children, the caller plus four lifting pairs of hands, five drawings. C15: seven bottles.

## 3. Decisions

1. **C07 adult: Noah's aunt, the cousin's mother.** She fits every language (Arabic خالته matches the cousin ابنة
   خالته; Hebrew הַדּוֹדָה; Danish moster). She holds Noah's hand at every crossing, holds him back on the kerb on p6,
   and nods on p9; she has no spoken line, so no cast sheet was needed (cast.json untouched). The art and film notes
   in `story.json` describe her on every crossing page and shot. **The Arabic and Hebrew reviewers must mirror** p1,
   p2, p3, p5, p6, p8, p9, p10, p11 ("from your front door"), p12, p14 and f01.
2. **"First-grader" kept** (C02). It is the Israeli school's own term in English, as "kindergarten" was in the pilot;
   British "Year 1" would be wrong for the setting.
3. **"Jumpers" kept** (C02). In British English a jumper is also a sweater, but beside a rope the meaning is clear.
4. **Kept on purpose:** "striped like a sweet" (C08, British), "the green man" (C07, the British name for the light),
   "Quiet, he thought, is not the same as empty" (Noah's own thought, earned by what just happened), "And you matter
   much more to me than any ball" (Dad's comfort in the moment, not a moral to the reader), "A deck?" (C04), "Deal"
   (C12), "Long-Legs" hyphenated as a name, "Two hands, twelve marks, and no idea" (C11 refrain).
5. **Sentences at 19 to 20 words** (C08 p9, C11 p5, C12 p10 and p13, C13 p6, C14 p8): within the limit, each with a
   natural pause at a comma; left as written.

## 4. New names for the ledger

No new personal names. To record: **C10 Long-Legs** (the stork) as translated: طَوِيلُ السَّاقَيْنِ, אֲרֹךְ רַגְלַיִם,
Long-Legs, Langben. **C07 Noah's aunt** (role only, no name), as a background adult.

## 5. What a native English editor should still read

- Read C07 aloud from start to finish: is the aunt present without taking the game away from the children?
- C05 "Next time, we’ll share ours": warm enough, or too neat?
- C12 "pulled the frog’s surprised face".
- C06 "Fweeee!" and C02 "Slap, slap" / "Swish… thump… hop" with the voice engine.
- The forAdult texts are correct but long for a phone screen, as in the pilot.
