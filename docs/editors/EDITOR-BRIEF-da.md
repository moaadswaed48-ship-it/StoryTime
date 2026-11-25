# StoryTime: brief til den danske sprogredaktør

> **Summary for the owner (Moaad), in English.** This brief, written in Danish, asks one native Danish children's-book
> editor (ideally someone who knows how a pædagog talks) to read all 45 stories (book, film lines, activity), the
> landing page, the 19 emails and the legal drafts (wording only): about **41,000 words** (44,000 with the optional site buttons). Danish is where the
> project plan says a native reader matters most, and the AI reviewers could not open the Danish dictionaries, so
> spellings were judged from knowledge. The priority list covers the comma rule, sound words, compound spellings
> (bittelille), "juice" versus "saft", the C07 rewrite and a few lines that may sound translated. Rough effort:
> **25 to 40 hours** (our estimate, not a quote). Send this file plus `docs/editors/reading-copy/da.md`.

Udkast af 25. nov. 2026. Alt nedenfor stammer fra projektets egne noter. Honorar, kontrakt og frist aftales med
ejeren og står ikke her.

---

## 1. Hvad er StoryTime?

StoryTime er et bibliotek af historier for børn fra 2 til 8 år på arabisk, hebraisk, engelsk og dansk. Det sælges
i Israel til familier og børnehavepædagoger som et adgangskort pr. aldersgruppe. Hver historie har fire dele:

- **en bog**, som den voksne læser højt (siderne vendes som papir; ordene står på rolige felter i billedet);
- **en film** med sit eget manuskript, som senere bliver læst op af en indspillet stemme, med undertekster;
- **en aktivitet** for barnet og en voksen: mål, materialer, billedtrin med meget korte tekster, en sikkerhedslinje,
  en forklaring til den voksne og en version til en børnegruppe;
- en kommende **oplæsningsstemme** (ikke indspillet endnu).

De 45 historier er skrevet af AI-skribenter ud fra fælles oplæg og derefter gennemgået linje for linje af en særskilt
AI-korrekturlæser pr. sprog. **Hvert sprog er skrevet fra bunden, ikke oversat fra engelsk.** Intet menneske med
dansk som modersmål har læst teksterne endnu: det er din opgave.

Billederne og filmene er tegnet i kode og indeholder ingen ord, så det samme billede bruges på alle fire sprog.
Historierne foregår i Israels landskab (havet, markedet, bakkerne, regn om vinteren); den danske tekst skal ikke
forklare eller flytte dem til Danmark.

## 2. Læserne: tre aldersgrupper

| Gruppe | Alder | Hvem læser | Grænser for bogen (fra aldersbriefene) |
|---|---|---|---|
| A | 2 til 3 | En voksen læser højt for et lille barn | 40 til 150 ord pr. bog, 3 til 15 ord pr. opslag, sætninger på højst 8 ord; nutid tilladt; ingen passiv, ingen betingelser |
| B | 4 til 5 | En voksen læser højt; barnet siger omkvædene med | 200 til 450 ord, 15 til 40 pr. opslag, sætninger på op til 14 ord |
| C | 6 til 8 | Man læser sammen; nogle børn begynder at læse selv | 450 til 900 ord, 30 til 70 pr. opslag, sætninger på op til 20 ord |

Et kontrolværktøj holder alle historier inden for grænserne. Hvis en rettelse gør en linje for lang, så skriv det i
kolonnen "Begrundelse", så finder vi plads.

## 3. Hvad skal læses, og hvor meget

Alt står i én fil: **`docs/editors/reading-copy/da.md`** (ejeren kan sende den som dokument). Hver linje har en
henvisning, du kan citere: historiens id, `p` = bogside, `f` = filmreplik, aktivitetens felt, eller en nøgle for
hjemmesidens tekster.

| Del | Hvad | Ord |
|---|---|---|
| 45 historier: bogtekst | 562 sider | 15.017 |
| 45 historier: filmreplikker | 891 replikker (eget manuskript, ikke en kopi af bogen) | 4.494 |
| 45 historier: aktiviteter | mål, materialer, trin, sikkerhedslinje, note til den voksne, note til gruppen | 15.293 |
| 45 historier: titler og navne | | 359 |
| Forsiden | | 1.044 |
| 19 e-mails | bekræft adresse, velkommen, prøveperiode, kvittering, påmindelser om adgangskort, ny adgangskode m.fl. | 1.189 |
| Juridiske udkast | vilkår, privatliv, fortrydelse og refusion, tilgængelighed, krediteringer, cookies: **kun sproget, ikke jura** (en advokat gennemgår indholdet) | 3.850 |
| **I alt** | | **ca. 41.250** |
| Valgfrit | knapper, menuer, kontosider og ejerens område | 3.072 |

Talt med `node docs/editors/count-words.mjs` den 25. nov. 2026 (hjemmesidens tekster er talt i kildefilerne, altså
cirka). **Groft skøn over tidsforbruget:** ved et omhyggeligt tempo på 1.200 til 1.800 ord i timen, med højtlæsning,
ca. 25 til 40 timer. Det er vores skøn, ikke en måling.

Forsiden og de juridiske sider kan også ses på den skjulte testside:
`https://moaadswaed48-ship-it.github.io/StoryTime/next/da/` og `…/next/da/legal/terms/` (også `privacy`, `refunds`,
`accessibility`, `credits`, `cookies`).

**Ret venligst ikke:** bibliotekets første historie, som er skrevet af en menneskelig forfatter og tilhører hende
(den er ikke med i din fil); personernes **navne** (de deles af fire sprog: lyder et navn forkert, så sig det);
og **fakta** (sikkerhed, natur, tal: marker dem, så tjekker vi kilderne). Pladsholdere i kantede parenteser (fx
`[support email address: …]`) skal være synlige, til ejeren udfylder dem. Ord i krøllede parenteser, fx `{endsAt}`
eller `{group}`, udfyldes af hjemmesiden (en dato, en aldersgruppe): bevar dem præcis, som de er. I de juridiske
udkast betyder `[[…]]` et synligt hul og `{path|label}` et link.

## 4. Husstilen kort (`docs/story-room/style-da.md`)

1. Almindeligt rigsdansk, sådan som en rolig forælder eller pædagog taler til et barn. Ingen slang, ingen engelske
   låneord, hvor der findes et dansk ord (cool, okay, nice).
2. Mor og far; bedstemor og bedstefar i fortællingen. Mormor, farfar osv. kun når oplægget fastlægger, hvilken side af
   familien det er (fx "moster" og "farbror" passer til den arabiske tekst).
3. Datid i fortællingen; gruppe A må bruge nutid; én tid pr. bog. Ingen lange sammensatte ord i gruppe A.
4. Én idé pr. sætning; det vigtige ord sidst; omkvæd gentages ord for ord; rim kun når de er naturlige og skrevet på
   dansk fra starten.
5. Tal skrives med bogstaver i historierne; cifre kun i voksenteksten. Klokkeslæt med ord, og de skal passe til uret i
   billedet ("halv fem" = 4.30).
6. Replikker i »indadvendte gåseøjne«; ingen semikolon i gruppe A og B; højst ét udråbstegn pr. opslag i gruppe B
   og C. **Kommaer:** vi skriver uden det valgfri startkomma (se prioritet 1).
7. Den voksne tiltales med "du" eller "I", ellers "den voksne" eller "forælder eller pædagog"; aldrig mor som
   standard.
8. Undgå: skældsord om børn (fræk, doven, dum), ros for at være "klog" (ros indsatsen), højtider og religion
   (jul, påske, fastelavn), politik, militær, rigtige stednavne, mærkevarer, svinekød (også leverpostej og
   flæskesteg), vin, kød med mælk i samme måltid, ugedage der er hviledag for nogen (fredag, lørdag, søndag).

## 5. Din prioriterede liste

### Prioritet 1: valg der gælder alle historier

1. **Kommareglen.** Alle filer er skrevet uden det valgfri startkomma, men med slutkomma efter en ledsætning ("Den der
   leder, går og løber ikke"). Er det stadig det, du vil have? Gælder også "tæt ved tårnet hvor livredderen kunne se
   dem" (C08): læses ledsætningen som restriktiv?
2. **Stavning uden ordbog.** Korrekturlæserne kunne ikke åbne Den Danske Ordbog eller Retskrivningsordbogen, så alle
   stavemåder er bedømt efter hukommelsen. Især: **"bitte lille" / "bittesmå"** (A02, A06, B10, B15), skal det være
   "bittelille" i ét ord?
3. **Lydord.** Ingen af dem har en skriftlig kilde. Se listen under prioritet 2.
4. **Sikkerhedslinjen** sidst i hver aktivitet: »Sker der et uheld, så ring til det lokale alarmnummer.« Lyder den
   naturligt?
5. **Voksennoterne er lange på en telefon.** Alle korrekturlæsere har sagt det. Sig gerne, om de skal forkortes, og
   vis det på to eller tre noter som eksempel.
6. **Lyder noget oversat?** Danske linjer, der følger engelsk ordstilling, er det, vi frygter mest. Læs hver side højt.

### Prioritet 2: konkrete linjer

**Lydord (alle grupper)**
- A-gruppen: "Wiii", "Plop", "Flap, flap, flap" (vinger), "Vuuush", "Vift" (ører), "Vrik", "atju", "Fuuu", "Klirr",
  "Mums", "Vups", "Trip, trip, trip", "Prrr", "Plip, plip", "Tuuut", "Hiv", "Hi hi", "Uhu".
- Piloterne: "tok" (A04, stokken), "Fiiiit!", "Piv", "Dryp, dryp, dryp", "Hys", "Bzzz".
- B-gruppen: "Kling, klang" (gedeklokker), "Mæh", "I-a", "Svisj", "Bump", "Splat", "Plump", "Knæk", "Fiu", "knas",
  "Bank", "Sus!" (vind), "Bums", "Uææ" (baby), "Visk, visk" (vinduesviskere), "Psssj" (busdør, B14), "Bonk", "Klik",
  "Klask" (snebolde, B07).
- C-gruppen: "Klask", "Svup … bump … hop" (C02), "Fiiiii!" (C06), "Kast, grib" (C08).

**Gruppe A (2 til 3)**
- A01 p6 "Far kommer ingen vegne". A02 p11 "På det blå synger hun".
- A05 "knudrede knæ"; p1 "Sandet flyver alle vegne"; navnene Lille Kamel, Mor Kamel (med stort som navne).
- A06 »Så skal der børstes tænder!« og p7 »Gab op!«; "sundhedsplejersken" (en dansk rolle uden israelsk modstykke);
  "Natten falder på ved floden": for voksent for en toårig? (Alternativ: "Det bliver nat ved floden".) Lille
  Flodhest, Far Flodhest.
- A07 "stille og stillere"; "Hun holder om Jara". A03 "Mor breder armene ud".
- A08 "luren" og titlen/omkvædet "Efter luren": eller "efter middagsluren" / "når du har sovet"? "mad" om
  mellemmåltidet.
- A09 "lunt" over for "varmt" som kontrast. A10 katten "Sky" (= sky og genert; begge passer?).
- A11 "Rundt, rundt, rundt" som omkvæd ved siden af adjektivet "rund"; "Den største runde ting af alle".
- A12/A13 titler og navne: "Bamse skal også tisse", "Bamse af og på", "Føleposen", "Kassetunnellen"; "Mor Pindsvin",
  "Lille Pindsvin"; "gemmeleg"; "onkel" uden familieside.

**Gruppe B (4 til 5)**
- Piloten B02: titlen "Den syngende konkylie"; p11 "så synger den om havet" (Dalias stemme, eller ville et dansk barn
  sige "så kan man høre havet"?); p13 "Ingen sagde et pip"; f08 "Det larmede mere … og mere"; f03 "Du skal gemme dig
  lidt endnu"; trin 3 "Fortæl så dit eget"; "I dag måtte alle tage noget med hjemmefra" (for "show-and-tell").
- B01 "Prik" for Speckle; "moster". B04 "Kom, så laver vi den sammen" (lave = reparere). B05 "farbror".
- B07 "snedame"; "Karam fik en knude i maven"; "Hun gumlede på en tidsel"; "johannesbrødtræ" (langt ord for gruppe B,
  men det rigtige ord).
- B08 sæbesangen "Fingrene flettet": kan den synges? "et rigtigt forsøg" (voksentekst). "tommeltot", "ekspedienten".
- B09 "Det er en dum drage" (om en drage: i orden, eller undgå "dum" helt?); f14 "Den vippede til den ene side … og
  til den anden".
- B10 vuggevisen: »Lille måne, rund og stor. Lille fisk der i havet bor. Luk dine øjne, lille ven. Sov nu sødt, og
  sov igen.«
- B12 "Du er en rigtig bygmester!"; "et fif". B13 "fliselægger"; det nye omkvæd med gult og grønt. B14 "hinkerude";
  "Kom og stå her hos mig"; "du" til den gamle kvinde (moderne dansk). B15 "Man kan få dem i den gale hals";
  titler "Storebrorsangen", "Mit navn på trommen", "Frøet der tog sig god tid".

**Gruppe C (6 til 8)**
- Piloten C01: p8 "Han fik et sug i maven"; p15 "Sælgeren slog en skraldlatter op, den største hele dagen"; "Så er
  det retfærdigt"; "saft" om bagerens drik; "Keglespil med ti", "Kiggerammen"; "bedstefar" i barnets egne replikker
  (skal det blive morfar eller farfar?).
- C02 titlen *Sneglerunden*: kærligt, eller lyder det som at gøre grin med de langsomme? "Han smilede over hele
  ansigtet".
- C03 "Den gik ikke op"; "havregryn" der rasler i posen, "Posen raslede som en lille tromme"; remsen "Taske, flaske,
  jakke, hue".
- C04 misforståelsen "laks" for "hals"; "citronvand".
- C05 "Frugtpause!", "Næste gang giver vi", "Flot regnet ud".
- C06 "lyder lysest" om den højeste tone (for at undgå "højest" = mest larmende).
- **C07 læst højt fra start til slut.** Den er skrevet om, så Noahs moster holder ham i hånden ved hver
  overgang (beslutning om trafiksikkerhed). Er hun til stede uden at tage legen fra børnene? "viste vej",
  "vejviser", "Tak, vejviser" (erstatter "fører", der kan minde om "Føreren"), "lyskurv", titlen *Noah viser vej*.
- C08 "Bolden virkede så tæt på".
- C10 "Langben"; "Fem ad gangen". C11 "Klokken er hel" som i danske skoler; "Lige op er hel. Lige ned er halv.";
  "Hvor længe varer et minut?"; "Det er på tide du hilser på uret".
- C12 "lillebror lavede et forbavset frøansigt". C13 "en kæmpestor gren" eller "en kæmpe gren"?
- C14 "dæk" om tømmerflådens bund. C15 "juice" over for "saft" (saft er koncentrat, og historien handler om frisk
  appelsinjuice), "knaldorange", "pulterkammer", "ovnrens", "giftlinje".

### Prioritet 3: hjemmesidens tekster

- **Forsiden:** overskriften "Én historie. Læs, se og leg sammen"; "børnehaveklassen" for den amerikanske
  "kindergarten" i Jones-undersøgelsen; "percentilpoint".
- **E-mails:** "israelsk tid" efter klokkeslæt; "pakke" for adgangskortet (som på siden); "Kærlig hilsen" /
  "StoryTime" som underskrift; afsnittet om fortrydelse bruger "fortryde/fortrydelse": passer det i en israelsk
  retlig sammenhæng? Markedsføringsmailens emne begynder med det hebraiske lovkrav `פרסומת | Reklame` (skal blive).
- **Juridiske udkast:** kun sprog og klarhed. Ændr ikke meningen; marker det uklare, så sender vi det til advokaten.

## 6. Sådan sender du rettelser tilbage

Én tabel (regneark eller tabel i et dokument), én række pr. rettelse, sendt til ejeren på e-mail:

| Historie eller side | Sted | Nuværende linje | Forslag | Begrundelse |
|---|---|---|---|---|
| A08 | titel | Efter luren | … | … |
| C07 | f14 | … | … | … |
| E-mails | `templates.trial_ends_tomorrow.subject` | … | … | … |
| Alle historier | aktivitet `safety` | … | … | Gælder alle 45 |

- **Sted** er den henvisning, der står med fed i din fil: `p5`, `f12`, `steps[2].caption`, `forAdult` eller nøglen
  for en side-tekst.
- En rettelse, der skal gælde overalt (et ord, en stavemåde), skrives én gang med "alle historier" i første kolonne.
- Spørgsmål uden forslag er velkomne: lad "Forslag" stå tomt og skriv spørgsmålet under "Begrundelse".
- Vil du hellere rette direkte i filen, går det også; tabellen er bare den nemmeste måde for os at indføre rettelserne
  præcist.
