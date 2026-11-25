# Danish review of the A and B batches (25 Nov 2026)

**Result.** The Danish of 28 stories (A01 to A03, A05 to A15, B01, B03 to B15) was read as Danish, not against the
English, and corrected: about 100 changes, none to a plot. The main fixes: lines that sounded translated ("mister
hinanden", "med en lille stemme", "Jeg gjorde det!", "tro på noget der ikke er sandt", "Hendes øjne er store"), a
passive in a toddler book ("Så skal der børstes tænder"), "gemmeleg" where every Danish child says "lege skjul",
"pikkede" for pigeons (a word with a rude neighbour), "Splat" for the Danish "Klask", the B13 colours (yellow and green),
and the same content fix as in English ("rene og lyserøde" hands assume a skin colour).
The check tool reports no Danish errors (all 28 ids, run after the last edit). **A native Danish editor must still read
every story:** this is the language where my ear is least reliable (last section).

Files changed: `content/stories/<id>/da.json` for the 28 ids (and `b13/story.json`, see `REVIEW-en-AB.md`).

---

## 1. Corrections per story

### Group A (ages 2-3)

| Story | Where | Before | After | Why |
|---|---|---|---|---|
| A01 | f10 | Jeg skubber, far! | Jeg skubber dig, far! | "skubbe" needs its object in Danish. |
| A01 | safety, inClass | Intet kommer i munden. / Én voksen med højst fire børn, der sidder i en rundkreds… | Ikke noget i munden. / Én voksen og højst fire børn sidder i en rundkreds… | "intet" is bookish (pilot rule); the comma before "der" broke our no-start-comma rule. |
| A02 | p7 | hen til den sidste bod | hen til den allersidste bod | Matches f09 and the English "very last"; better rhythm. |
| A02 | p11 | På det blå synger hun: pip, pip! | Hun sidder på det blå og synger. Pip, pip! | "På det blå synger hun" is unclear (the writer flagged it). |
| A03 | p10 | Mor åbner armene. | Mor breder armene ud. | The Danish idiom for opening your arms to a hug. |
| A03 | step 4, safety | Byt roller, og leg igen. / Gå, og løb ikke, med fulde hænder. | Byt roller og leg igen. / Gå langsomt, og løb ikke med noget i hænderne. | Comma; the old safety line did not parse. |
| A05 | p3 to p7 | Sand i hans ører / på hans næse / på hans ryg / på hans knudrede knæ / på hans store, flade fødder | Sand i ørerne / på næsen / på ryggen / på de knudrede knæ / på de store, flade fødder | Danish uses the definite form for body parts, as the film already did; "hans" five times sounds like English. |
| A05 | f20 | Nu skal vi hvile i skyggen. | Nu hviler de i skyggen. | The narrator is not resting. |
| A06 | p1 | Natten kommer til floden. | Natten falder på ved floden. | The Danish phrase. |
| A06 | p2, f03 | »Så skal der børstes tænder!« | »Nu skal vi børste tænder!« | A passive, which group A avoids; the new line is what a Danish parent says. |
| A06 | f02 | Nu skal vi gøre klar til at sove. | Nu er det snart sengetid. | Narrator line, not a parent's "we". |
| A06 | activity | "en sang som ur"; "Syng, og børst foroven."; "Spyt, og smil!"; "et ur som et lille barn kan høre" | "sangen er æggeuret"; "Syng og børst de øverste tænder."; "Spyt ud og smil!"; "et æggeur som et lille barn kan høre" | "æggeur" is the Danish timer word; "foroven/forneden" sounded odd for teeth. |
| A07 | p4 | Hendes øjne er store. | Hun får store øjne. | The Danish idiom (as in the pilot). |
| A07 | p5 | Hun krammer Jara. | Hun holder om Jara. | Calmer, fits the night. |
| A07 | p11, f14 | stille og stillere | stillere og stillere | The natural doubled comparative. |
| A07 | activity | two semicolons; "to bøger som en port som kuglen skal igennem"; "Par ligger … per par" | full stops; "ved at stille to bøger op som en port kuglen skal igennem"; "Børnene ligger to og to … Hvert par har én papirkugle" | Readability; "per" and the double "som" were clumsy. |
| A08 | p1 | sætter far sig på knæ | sætter far sig på hug | How a Danish adult gets down to a child. |
| A08 | f09 | Efter sandet kommer luren. | Efter sandkassen kommer luren. | Same word as the refrain. |
| A09 | goal | Styrk de små hænder… | At styrke de små hænder… | Every other goal starts with "At". |
| A09 | forAdult | de samme hænder der snart skal holde en ske og et farvekridt | de samme muskler som barnet bruger når det holder en ske eller et farvekridt | Same factual fix as in English. |
| A09 | safety, forAdult | …et lille fladt stykke, siddende | …når barnet sidder ned | "siddende" is stiff. |
| A10 | p1 | Det her er Sky. | Her er Sky. | A natural opening. |
| A10 | p11, f16 | Sky vasker sit ansigt i solen. | Sky vasker sig i solen. | A Danish cat "vasker sig". |
| A11 | p4 | Knapper på hans skjorte! | Knapper på skjorten! | Definite form. |
| A11 | p11, f16 | Den største runde ting af alle | Den allerstørste runde ting | "af alle" is English word order. |
| A11 | activity | "Nu dig! Også en cirkel."; "Se den tørre."; "så der bliver ingen »fejl« stående"; "tilbage til hvor den startede" | "Nu dig! Mal en cirkel."; "Se den forsvinde."; "så der ikke bliver nogen »fejl« stående"; "tilbage til der hvor den startede" | Word order in the "så" clause; clearer captions. |
| A12 | p7, f09 | »Jeg gjorde det!« | »Jeg har tisset!« | "Jeg gjorde det" is the English "I did it"; a Danish child announces what happened. Mor's "Du klarede det!" is kept. |
| A12 | p8 | Tør. Op med trusserne. | Tør dig. Op med trusserne. | "Tør" alone reads as the adjective "dry". |
| A13 | p2, f03 | Skal vi lege gemmeleg? | Skal vi lege skjul? | "lege skjul" is what Danish children say. |
| A13 | p7, f10 | Mor Pindsvin snuser den her vej … den anden vej / Den her vej … den vej | Mor Pindsvin snuser herhen … Hun snuser derhen / Herhen … og derhen | "den her vej" is translated English. |
| A14 | p5 | »Tæppet skal hjem …« Storesøster ruller det sammen. | »Tæppet skal hjem …« siger storesøster. Hun ruller det sammen. | Clear speaker. |
| A14 | p6 | Rayan ruller sig ind i det med! | Rayan ruller sig også ind i det! | Word order. |
| A14 | p10, f16 | Alting er i sit hjem. / Alting i sit hjem. | Alting er kommet hjem. / Alting er hjemme. | Natural; keeps the "hjem" refrain. |
| A14 | inClass | »Lille!«. | »Lille!« | No stop after "!". |
| A15 | p5 | kigger op af sit hul | kigger frem fra sit hul | "op af" means "out of" only in some regions and reads as a slip. |

### Group B (ages 4-5)

| Story | Where | Before | After | Why |
|---|---|---|---|---|
| B01 | p11 | Rafi holdt godt fast og løftede hende op. | Rafi løftede hende op og holdt godt fast. | Order of actions. |
| B01 | f17 | Hun sidder fast og spiser stadig! | Hun sidder fast og spiser bare videre! | Funnier, and what an aunt would say. |
| B01 | activity | grankogler; "Intet i munden"; "Grupper på fire børn med én kridtfold og ti kogler i hver gruppe og en voksen tæt på." | kogler; "Ikke noget i munden"; "Grupper på fire børn, hver med én kridtfold og ti kogler, og med en voksen tæt på." | Simpler; the old sentence had three "med/og" in a row. |
| B03 | p4, f07 | Hun knyttede hænderne (hårdt). | Hun knyttede næverne. | The Danish idiom. |
| B04 | p4, f08 | Lara tog den mindste fugl. | Lara tog den mindste fugl op. | "tage" alone is "take"; "tage op" is "pick up". |
| B04 | p8 | Drejeskiven gik langsommere og stoppede. »Jeg tabte den,« sagde Lara med en lille stemme. | Drejeskiven snurrede langsommere og langsommere og stoppede så. »Jeg tabte den,« sagde Lara stille. | "med en lille stemme" is English; the longer first sentence keeps the spread at the 15-word minimum. |
| B04 | f18 | Kan den synge? | Kan den stadig synge? | She asks whether the mended bird still sings. |
| B05 | p5 | løb han hen for at lege | løb han hen og legede | Natural. |
| B05 | p7, p8 | Hvor tror Jasmin at kurven er? / Hun tror at den stadig står… | Hvor tror Jasmin kurven er? / Hun tror den stadig står… | Danish drops "at" here; the question must read smoothly, it is the story's key moment. |
| B05 | p10 | dér stod kurven, trygt i skyggen | dér stod kurven i den kølige skygge | "trygt" belongs to people, not baskets. |
| B05 | activity | et blødt legetøjsdyr; "en anden kan tro på noget der ikke er sandt" | et tøjdyr; "kan tro noget der ikke er sandt" | "tøjdyr" is the Danish word; "tro på" means "believe in". |
| B06 | p1, f02 | »Hvad er vores regel, hvis vi mister hinanden?« | »Hvad er vores regel hvis vi bliver væk fra hinanden?« | "miste hinanden" sounds like bereavement; "blive væk fra hinanden" is the everyday phrase. No start comma (our rule). |
| B06 | inClass | går ned i knæ | sætter sig på hug | As in A08. |
| B07 | p3 | Sneen sprang ud i hvidt støv. | Sneen blev til en sky af hvidt støv. | The old line did not make a picture. |
| B07 | p4, p5 | Splat | Klask | The Danish sound for a wet hit; "splat" is English. |
| B07 | p9 | Josef nikkede. »Kun på træet.« | Josef nikkede. »Kun på træet,« sagde han. | Clear speaker. |
| B07 | p11 | Hun så vældig kold ud. | Hun så ud til at fryse. | "vældig" is old-fashioned; matches f19. |
| B07 | p13 | »Sikke en flot snedame!« Josef… | »Sikke en flot snedame!« råbte hun. Josef… | Clear speaker. |
| B07 | forAdult | uden surhed og uden skub | uden at nogen bliver sure eller skubber | "surhed" is not used about people. |
| B08 | p8, f10, forAdult | Fingrene i knude | Fingrene flettet | "i knude" means tied in a knot; "flettet" is the interlaced hand-washing grip. |
| B08 | p9 | De var rene og lyserøde. | De var rene og duftede af sæbe. | Skin colour, as in English. |
| B08 | p10 | Han var vældig, vældig sulten. | Han var rigtig, rigtig sulten. | Everyday word. |
| B08 | goal, forAdult | et (første) retfærdigt forsøg | et første forsøg hvor kun én ting er forskellig / et rigtigt forsøg | "retfærdigt forsøg" is a calque of "fair test" and means "a just attempt". |
| B09 | p4 | Hendes onkel tog den forsigtigt ud. | Hendes onkel fik den forsigtigt fri. | From a thorn bush. |
| B09 | p5, f06 | Det er en dårlig drage. | Det er en dum drage. | What a cross Danish child says about a thing (the style rule bans "dum" about a child, not a kite). |
| B09 | p11 | »Den flyver rigtigt.« | »Den flyver for alvor.« | "rigtigt" means "correctly". |
| B09 | f14 | Den vippede hid … og did. | Den vippede til den ene side … og til den anden. | "hid og did" is old-fashioned; now matches p10. |
| B09 | inClass | Efter hvert fald bliver gruppen enige… før de bygger | Hver gang tårnet vælter, bliver gruppen enig… før den bygger | Agreement with "gruppen". |
| B10 | p1, f01 | Siden hun kom hjem, kiggede alle… | Nu hvor hun var kommet hjem, kiggede alle… | Tense. |
| B10 | p2 | Babyen græd til morgenmad. … Hun græd til frokost. | Babyen græd ved morgenmaden. … Hun græd ved frokosten. | "græde til morgenmad" reads as crying for breakfast. |
| B10 | p6 | gik rundt med hende, op og ned, op og ned | gik rundt i stuen med hende, rundt og rundt | "op og ned" is vertical in Danish. |
| B11 | p2 | og pikkede krummer | og hakkede efter krummer | "pikke" is correct but sits next to a rude word; a børnehave would giggle (our "bum" case). |
| B12 | p1 | en bunke rester | en bunke rester fra arbejdet | "rester" alone means food leftovers. |
| B12 | p9, f11 | »Du er ansat!« | »Du er en rigtig bygmester!« | Same reason as in English; "bygmester" is a word Danish children know and love. |
| B13 | title and text | Den blå og hvide sti; Blå, hvid, blå, hvid … hvid! | Den gule og grønne sti; Gul, grøn, gul, grøn … grøn! | `DECISIONS.md`. All colour lines changed together; the logic of the mistake and the last two tiles holds (grøn, so gul, then grøn). "Gul, grøn" chants well: two short words, the same first sound. |
| B13 | activity | "og intet kommer i munden"; "Saml kun planter du kender: Oleander, … er giftige." | "og ikke noget i munden"; "Saml kun blade du kender. Nogle planter er giftige: oleander, …" | The old sentence did not parse. |
| B14 | p2, p3, p5 | Ruden var helt dugget. / Pssst. / Bussen kørte. | Ruden var helt dugget til. / Psssj. / Bussen kørte videre. | Idiom; "Pssst" is the Danish call for attention, not a bus door; "kørte" alone was flat. |
| B14 | goal, steps | "ved at lytte til deres regler og lege den på deres måde"; "Tegn deres hinkerude"; "Hink på deres måde" | "og lege den efter den ældres regler"; "Tegn hinkeruden"; "Hink på den gamle måde" | Singular "deres" after "en ældre" is not yet standard Danish. |
| B15 | safety | Tjek først for allergi | Spørg først om allergi | Loanword (pilot rule). |

## 2. Decisions

1. **Commas.** No start comma before a subordinate clause, end comma after it (style-da §6.2, as in the pilots). Start
   commas removed in A01 (inClass) and B06 (p1, f02); other stray commas removed in A03 and A08 steps.
2. **Kept on purpose:** "Wiii" (A01), "Plop" (A01 p8), "Flap" (wings), "Vift", "Vrik", "atju", "Fuuu", "Klirr",
   "Trip", "Prrr", "Plip", "Tuuut", "Uhu", "Mæh", "I-a", "Uææ", "Visk, visk", "Bonk", "Fiu"; "luren" for the nap
   (A08); "Lille Kamel", "Mor Kamel", "Lille Flodhest", "Far Flodhest", "Lille Pindsvin", "Mor Pindsvin" with capitals
   as names; "far", "mor", "bedstemor", "onkel", "storesøster" in lower case as family words; "moster" (B01) and
   "farbror" (B05), which match the side of the family the Arabic needs; "Sky" for the cat (it is "cloud", and the
   adjective "sky" means "shy": both fit); "Prik" for Speckle; "Bamse"; "snedame"; "Storebrorsangen"; the B10
   lullaby; "Man kan få dem i den gale hals" (B15, the right idiom); "hinkerude"; "fliselægger"; "et fif"; "Kom, så
   laver vi den sammen" (B04, "lave" = mend, everyday Danish).
3. **"du" to the old woman (B14)** is kept: modern Danish says "du" to everyone.
4. **Numbers.** Counting aloud uses "en, to, tre"; written amounts agree with the noun ("Et, to, tre" for the neuter
   "bæger" in B15). The B01 count (nine, then ten) and the B11 syllables (due 2, ap-pel-si-ner 4, Ta-la 2, må-ne 2,
   træ 1, far 1, mor-mor 2, ba-na-ner 3) are right.

## 3. Names

All names match the ledger with the Danish adaptations (Jara, Nadja, Maja, Jasmin, Josef). For the ledger keeper, the
Danish names of the translated characters: Lille Kamel, Mor Kamel (A05); Lille Flodhest, Far Flodhest (A06); Sky
(A10, the cat Cloud); Bamse (A12); Lille Pindsvin, Mor Pindsvin (A13); Prik (B01, Speckle).

## 4. Age fit after the edits (check tool)

All 28 stories are inside the limits. Group A: 85 to 131 words, 4 to 15 words a spread, longest sentence 8, longest
caption 8. Group B: 255 to 327 words, 15 to 39 a spread, longest sentence 14, longest caption 12.

## 5. What a native Danish editor must still read (my limits)

I write Danish well, but I am a model, not a Danish pædagog. I could not open Den Danske Ordbog or
Retskrivningsordbogen from here (both pages came back empty), so spellings were judged from knowledge. Please check
above all:
1. **"bitte lille" / "bittesmå"** (A02, A06, B10, B15): is RO's form "bittelille" in one word?
2. **"luren" and "Efter luren"** (A08, title and refrain): or would a Danish parent say "efter middagsluren" or
   "når du har sovet"?
3. **"Natten falder på ved floden"** (A06): too grown-up for a two-year-old? The alternative is "Det bliver nat ved
   floden".
4. **"Psssj"** for the bus door (B14) and **"Klask"** for snowballs (B07).
5. **"Fingrene flettet"** in the soap song (B08): does it sing?
6. **"Du er en rigtig bygmester!"** (B12) and **"et rigtigt forsøg"** (B08 adult text).
7. **"Hun holder om Jara"** (A07) and **"Mor breder armene ud"** (A03).
8. **"Det er en dum drage"** (B09): fine about a kite, or would you avoid "dum" altogether?
9. **"knudrede knæ"** (A05), **"Sandet flyver alle vegne"** (A05 p1), **"Den vippede til den ene side … og til den
   anden"** (B09 f14).
10. The same open points as in the English report: B13's green door next to green tiles, and the A15 crab.
