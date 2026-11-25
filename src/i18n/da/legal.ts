import type { LegalDict } from '../legal-schema'

/*
 * Danish legal pages, written from the English master (src/i18n/en/legal.ts), not word for word. "Du" throughout,
 * which carries no gender. Sales are in Israel only at launch; EU rules (GDPR, Danish consumer law, cookies) are not
 * covered yet (docs/LEGAL-CHECKLIST.md section 4). Open legal questions: docs/legal/LAWYER-PACK.md.
 */
export default {
  chrome: {
    draftTitle: 'Udkast: endnu ikke gennemgået af en advokat',
    draftBody:
      'Denne side er et arbejdsudkast. En advokat har ikke gennemgået den endnu, og den kan ændre sig, før StoryTime åbner for salg. Markerede steder er oplysninger, vi endnu ikke har udfyldt.',
    placeholder: 'Udfyldes senere:',
    placeholderKey: 'Sådan markeres en oplysning, der endnu mangler',
    updated: 'Udkast af {date}',
    version: 'Vilkårsversion {version}',
    languageNote:
      'Disse sider findes på arabisk, hebraisk, engelsk og dansk. [[Hvilken sprogversion der gælder, hvis de afviger: afgøres med vores advokat]]',
    contents: 'På denne side',
    otherPages: 'Andre juridiske sider',
    backToTop: 'Til toppen af siden',
  },

  terms: {
    title: 'Brugsvilkår',
    summary: 'Aftalen mellem dig og StoryTime: hvad du får, hvad en pakke koster og varer, og hvad vi hver især lover.',
    sections: {
      about: {
        title: 'Hvem vi er',
        body: [
          'StoryTime drives af [[virksomhedens navn]], [[ID- eller virksomhedsnummer]], [[postadresse i Israel]].',
          'Du kan kontakte os på [[e-mailadresse til kundeservice]]. [[Telefonnummer, hvis loven kræver det]]',
          'I disse vilkår betyder "vi" StoryTime, og "du" betyder den voksne, der har kontoen.',
        ],
      },
      service: {
        title: 'Hvad StoryTime er',
        body: [
          'StoryTime er et onlinebibliotek med historier for børn fra 2 til 8 år. Hver historie har en billedbog, en læs-med-funktion, en kort film og en aktivitet, I kan lave sammen. Siden findes på arabisk, hebraisk, engelsk og dansk.',
          'Historierne er delt op efter alder: 2–3, 4–5 og 6–8 år. Vi tilføjer historier løbende, så biblioteket vokser.',
          'Ved lanceringen sælges pakker kun til kunder i Israel. Den gratis prøveperiode virker overalt.',
        ],
      },
      accounts: {
        title: 'Konti er for voksne',
        body: [
          'Kun voksne på 18 år eller derover må oprette en konto. En forælder eller en pædagog opretter én konto og tilføjer derefter profiler til de børn, der skal bruge den.',
          {
            list: [
              'En forælder kan tilføje op til 5 børneprofiler. En profil indeholder kun et fornavn eller et kælenavn og en aldersgruppe.',
              'En pædagog tilføjer en gruppe i stedet for børn: gruppens navn og en aldersgruppe, aldrig børnenes navne.',
              'Du har ansvaret for, hvordan kontoen bruges, også af de børn, du lader bruge den.',
              'Hold din adgangskode for dig selv. Hvis du tror, en anden kender den, så skift den under Indstillinger og giv os besked.',
            ],
          },
        ],
      },
      trial: {
        title: 'Den gratis prøveperiode',
        body: [
          {
            list: [
              '3 historier fra én aldersgruppe i 3 dage, med alle funktioner: bog, læs med, film og aktivitet.',
              'Du skal ikke bruge et betalingskort, og prøveperioden bliver aldrig til en betaling.',
              'Én prøveperiode pr. konto og pr. e-mailadresse, også efter en konto er slettet. For at det kan lade sig gøre, gemmer vi en envejskode lavet ud fra adressen; {legal/privacy|privatlivspolitikken} forklarer det.',
              'Når de 3 dage er gået, lukkes prøvehistorierne. Profiler og fremskridt bliver.',
            ],
          },
        ],
      },
      passes: {
        title: 'Pakker',
        body: [
          'En pakke åbner alle historier i én aldersgruppe i 1, 3 eller 12 måneder.',
          {
            list: [
              'Du betaler én gang. En pakke fornyes aldrig af sig selv, og vi trækker aldrig penge igen uden et nyt køb.',
              'Adgangen starter online lige efter betalingen, og pakken slutter på den slutdato, der vises før betalingen og i din købsbekræftelse.',
              'Én konto kan have pakker til to aldersgrupper på samme tid.',
              'Køber du en pakke, mens en anden pakke til samme aldersgruppe stadig løber, starter den nye, når den løbende slutter.',
              'Vi sender dig en e-mail, før en pakke slutter. Den indeholder fakta og et link til din konto, aldrig et tilbud.',
            ],
          },
        ],
      },
      prices: {
        title: 'Priser og betaling',
        body: [
          'Priserne vises i shekel inklusive moms. Den pris, der vises, når du køber, er den pris, du betaler. [[Prisliste: ikke fastsat endnu]]',
          '[[Vores skattemæssige status (momsfritaget eller momsregistreret virksomhed i Israel) og hvad den betyder for momsen: bekræftes med vores revisor]]',
          'Betalingen håndteres af [[betalingsselskabet, som endnu ikke er valgt]] på dets egen sikre side. Vi ser og gemmer aldrig dit kortnummer. Du får en kvittering for hver betaling og et kreditnotadokument for hver refusion.',
        ],
      },
      cancel: {
        title: 'Fortrydelse af et køb',
        body: [
          'Du kan fortryde en pakke inden for 14 dage efter købet, eller efter du modtog købsbekræftelsen, hvis den kom senere. Vi betaler pengene tilbage inden for 14 dage efter din anmodning. Der kan beholdes et gebyr på højst 5 % af prisen eller 100 shekel, alt efter hvad der er lavest.',
          'Alle regler og alle måder at fortryde på står på siden {legal/refunds|Fortrydelse og refusion}. Vil du fortryde nu, så gå til {cancel-purchase|Fortryd et køb}.',
        ],
      },
      ends: {
        title: 'Når en pakke eller prøveperiode slutter',
        body: [
          'De historier, som pakken eller prøveperioden åbnede, lukkes. Din konto, profilerne og deres læsefremskridt bliver, så du kan fortsætte, hvor I slap, hvis du køber en ny pakke. Der trækkes intet automatisk.',
        ],
      },
      use: {
        title: 'Fair brug',
        body: [
          'StoryTime er til din familie eller til den gruppe, du underviser. Du må ikke:',
          {
            list: [
              'kopiere, optage, downloade, printe til andre, offentliggøre eller sælge historierne, billederne, filmene eller aktiviteterne, medmindre siden selv tilbyder det;',
              'dele din konto eller adgangskode med personer uden for dit hjem eller din gruppe;',
              'hente indhold fra siden med automatiske værktøjer eller forsøge at omgå login, voksentjekket eller adgangsreglerne;',
              'bruge siden til at skade andre eller bryde loven.',
            ],
          },
          '[[Præcis hvad en pædagog må gøre med indholdet i gruppen: afklares med vores advokat]]',
        ],
      },
      content: {
        title: 'Hvem ejer historierne',
        body: [
          'Historierne, billederne, filmene og aktiviteterne på StoryTime tilhører StoryTime, undtagen når en historie er krediteret sin forfatter. En historie af en ekstern forfatter tilhører forfatteren og bruges med tilladelse. Når du køber en pakke, får du ret til at bruge indholdet som beskrevet i disse vilkår; du bliver ikke ejer af det.',
          'Siden {legal/credits|Krediteringer og licenser} viser, hvem der har lavet hvad, og hvilke eksterne værktøjer vi bruger.',
        ],
      },
      changes: {
        title: 'Ændringer i biblioteket',
        body: [
          'Vi tilføjer historier og forbedrer dem, der er. Engang imellem kan vi være nødt til at rette, udskifte eller fjerne en historie.',
          '[[Hvad der sker, hvis en historie fjernes, mens din pakke løber: afklares med vores advokat]]',
          'Vi arbejder for, at siden er tilgængelig, men den kan en gang imellem være utilgængelig, for eksempel under vedligeholdelse.',
        ],
      },
      liability: {
        title: 'Vores ansvar',
        body: [
          'Intet i disse vilkår indskrænker de rettigheder, du har efter den israelske forbrugerbeskyttelseslov.',
          '[[Grænserne for vores ansvar: formuleres af vores advokat]]',
          'Aktiviteterne er tænkt til at blive lavet sammen med en voksen. Læs materialelisten og sikkerhedsnoterne til hver aktivitet, før I går i gang.',
        ],
      },
      ending: {
        title: 'Lukning af en konto',
        body: [
          'Du kan altid slette din konto under {app/settings|Indstillinger}. Det fjerner kontoen, alle profiler og alle fremskridt. En løbende pakke går tabt og refunderes ikke ved sletning: vil du fortryde et køb inden for de 14 dage, så fortryd det først.',
          '[[Hvornår vi må lukke en konto, der bryder vilkårene, og hvad der sker med en løbende pakke: afklares med vores advokat]]',
        ],
      },
      updates: {
        title: 'Ændringer i vilkårene',
        body: [
          'Hver version af vilkårene har en dato og et versionsnavn, som står øverst på siden. Vi registrerer, hvilken version du accepterede, da du oprettede kontoen, og hver gang du køber.',
          '[[Hvordan og hvor lang tid i forvejen vi varsler en ændring: afklares med vores advokat]]',
        ],
      },
      law: {
        title: 'Lovvalg og domstole',
        body: ['Disse vilkår er underlagt israelsk ret. [[Hvilke domstole der behandler tvister: fastsættes af vores advokat]]'],
      },
      contact: {
        title: 'Kontakt',
        body: ['Spørgsmål om vilkårene: [[e-mailadresse til kundeservice]], [[postadresse i Israel]].'],
      },
    },
  },

  privacy: {
    title: 'Privatlivspolitik',
    summary: 'Hvilke data vi indsamler og hvorfor, hvem der hjælper os, hvor længe vi gemmer dem, og hvordan du ser, retter, henter eller sletter dem.',
    sections: {
      short: {
        title: 'Kort fortalt',
        body: [
          {
            list: [
              'Vi beder om meget lidt: en voksens e-mail og adgangskode og for hvert barn kun et fornavn eller kælenavn og en aldersgruppe.',
              'Ingen reklamer, intet salg af data og ingen sporings- eller analyseværktøjer.',
              'Vi beder aldrig om telefonnummer, foto, efternavn eller fødselsdato.',
              'Dit kortnummer går til betalingsselskabet, aldrig til os.',
              'Du kan hente, rette og slette dine data under Indstillinger.',
            ],
          },
        ],
      },
      who: {
        title: 'Hvem er ansvarlig',
        body: [
          '[[Virksomhedens navn]], [[ID- eller virksomhedsnummer]], [[postadresse i Israel]] er ansvarlig for dine data.',
          'Spørgsmål og anmodninger om privatliv: [[navn og e-mailadresse på kontaktpersonen for privatliv]].',
        ],
      },
      collect: {
        title: 'Hvad vi indsamler og hvorfor',
        body: [
          'Dette er den komplette liste.',
          {
            table: {
              head: ['Hvad', 'Hvorfor', 'Påkrævet?', 'Gemmes'],
              rows: [
                ['Din e-mailadresse', 'Til login og til bekræftelser, kvitteringer og påmindelser', 'Påkrævet', 'Så længe kontoen findes'],
                ['Din adgangskode', 'Til login. Logintjenesten gemmer den kun som en envejskode (hash), så ingen kan læse den', 'Påkrævet', 'Så længe kontoen findes'],
                ['Forælder eller pædagog; sidens sprog og historiernes sprog', 'For at vise de rigtige skærme på dit sprog', 'Påkrævet', 'Så længe kontoen findes'],
                ['En børneprofil: fornavn eller kælenavn og aldersgruppe', 'For at skelne profilerne og vise historier til barnets alder', 'Aldersgruppen er påkrævet; navnet er frivilligt', 'Til du sletter profilen eller kontoen'],
                ['En gruppe (pædagoger): gruppens navn og aldersgruppe, ingen børnenavne', 'For at vise historier til gruppens alder', 'Aldersgruppen er påkrævet; navnet er frivilligt', 'Til du sletter gruppen eller kontoen'],
                ['Læsefremskridt for hver profil: sidste læste side, set film, lavet aktivitet', 'For at fortsætte, hvor I slap', 'Opstår, når siden bruges', 'Til du sletter profilen eller kontoen'],
                ['Din gratis prøveperiode: aldersgruppe, datoer og de 3 historier', 'For at køre prøveperioden og kun tillade én pr. konto', 'Kun hvis du starter en prøveperiode', 'Så længe kontoen findes; se derefter "Hvor længe vi gemmer data"'],
                ['Køb: pakke, aldersgruppe, længde, datoer, beløb, ordrenummer, betalingsselskabets reference og kvitteringslink, fortrydelser og refusioner', 'For at give dig pakken, håndtere fortrydelser og refusioner og opbevare de bilag, skattereglerne kræver', 'Påkrævet for at købe', '[[Den periode, skattereglerne kræver]]; uden dit navn, når kontoen er slettet'],
                ['Dine valg: den version af vilkårene, du accepterede, at du er 18 år eller derover, og dit valg om nyheder, med dato og hvor du traf valget', 'For at kunne dokumentere, hvad du har accepteret, og respektere dit valg', 'Påkrævet (nyheder er frivillige)', 'Så længe kontoen findes'],
                ['En log over de e-mails, vi har sendt dig: adresse, hvilken e-mail, hvornår og om den kom frem; adresser, der afviste e-mails eller markerede os som spam', 'For ikke at sende den samme e-mail to gange og for at stoppe med at sende til adresser, der ikke kan modtage', 'Opstår ved afsendelse', '[[Periode fastsættes senere]]'],
                ['En fortrydelsesanmodning sendt via formularen: e-mail, ordrenummer og din besked', 'For at håndtere fortrydelsen', 'Kun hvis du bruger formularen', '[[Periode fastsættes senere]]'],
                ['Tekniske loginoplysninger, som logintjenesten gemmer, for eksempel tidspunktet og enhedens internetadresse (IP)', 'For at holde kontiene sikre', 'Opstår ved login', '[[Den periode, logintjenesten gemmer dem: bekræftes]]'],
              ],
            },
          },
          'Nogle indstillinger, for eksempel tekststørrelse, gemmes kun i din browser. Du finder dem på siden {legal/cookies|Cookies og lokal lagring}.',
        ],
      },
      never: {
        title: 'Hvad vi aldrig indsamler',
        body: [
          {
            list: [
              'Et barns efternavn, foto, stemme, fødselsdato, skole eller placering.',
              'Dit telefonnummer, dine kontakter eller din placering.',
              'Dit kortnummer eller dine bankoplysninger.',
              'Oplysninger fra reklamenetværk eller sociale medier.',
            ],
          },
          'Vi viser ikke reklamer, vi sælger eller udlejer ikke data, og vi laver ikke markedsføringsprofiler af børn eller voksne.',
        ],
      },
      why: {
        title: 'Hvad vi bygger brugen på',
        body: [
          'Vi bruger dine data til at levere den tjeneste, du har bedt om, til at opfylde vores pligter efter loven (for eksempel skatte- og forbrugerregler) og, kun for nyhedsmails, med dit særskilte samtykke. Vi bruger dem ikke til andet.',
          '[[Den formulering, den israelske lov om beskyttelse af privatlivet kræver efter ændring nr. 13: bekræftes af vores advokat]]',
        ],
      },
      helpers: {
        title: 'Hvem hjælper os',
        body: [
          'Nogle få servicevirksomheder behandler data for os, kun for at drive StoryTime og kun efter vores instrukser. De må ikke bruge dem til egne formål.',
          {
            table: {
              head: ['Opgave', 'Virksomhed', 'Hvor'],
              rows: [
                ['Database, login og fillagring', 'Supabase', '[[Et datacenter i EU: regionen bekræftes, når tjenesten sættes op]]'],
                ['Afsendelse af e-mails', 'Resend', '[[Hvor data gemmes og behandles: bekræftes]]'],
                ['Hosting af siden og hurtig levering', 'Cloudflare (ved lanceringen)', '[[Hvor data behandles: bekræftes]]'],
                ['Betalinger, kvitteringer og refusioner', '[[Israelsk betalingsselskab, endnu ikke valgt]]', '[[Bekræftes]]'],
              ],
            },
          },
          '[[Skriftlige aftaler med hver virksomhed om behandling af data: underskrives før lanceringen]]',
          'Vi kan også udlevere data til en myndighed, hvis loven kræver det.',
        ],
      },
      abroad: {
        title: 'Data uden for Israel',
        body: [
          'Nogle af disse virksomheder gemmer data uden for Israel. Loven tillader det til lande, hvis beskyttelse ikke er ringere end Israels, herunder EU\'s medlemslande.',
          '[[Retsgrundlaget for overførsel til et land uden for EU: bekræftes af vores advokat]]',
        ],
      },
      kept: {
        title: 'Hvor længe vi gemmer data',
        body: [
          'Vi gemmer dine data, så længe din konto findes. Sletter du en profil, slettes dens fremskridt med. Sletter du kontoen, sletter vi kontoen, din e-mailadresse i kontoen, alle profiler, alle fremskridt, dine valg, din prøveperiode og dine pakker.',
          'Efter sletning bliver kun disse oplysninger:',
          {
            list: [
              'Bilag for køb og refusioner, uden dit navn, fordi skattereglerne kræver dem. [[Hvor længe: den periode, skattereglerne kræver]]',
              'En prøveperiode-registrering: en envejskode lavet ud fra din e-mailadresse (en hash med et hemmeligt "salt") og dagen, prøveperioden startede. Den indeholder ingen e-mail og intet navn, ingen kan åbne den via siden, og den bruges kun til at afvise en ny gratis prøveperiode til samme adresse. [[Hvor længe: foreslået 2 år, bekræftes af vores advokat]]',
              'Loggen over e-mails, der allerede er sendt til dig (hvilken e-mail, på hvilket sprog, hvornår, og om den kom frem), uden din adresse: i hver registrering erstattes adressen af samme slags envejskode, straks for tidligere e-mails og så snart e-mailen, der bekræfter sletningen, er sendt. Kun hvis en e-mail til dig blev afvist, eller du markerede en som spam, bliver adressen stående på vores liste over adresser, vi ikke skriver til. [[Hvor længe: fastsættes senere]]',
              'En fortrydelsesanmodning, du har sendt via formularen. [[Hvor længe: fastsættes senere]]',
              'En note om, at kontoen er slettet og hvornår, uden din e-mail.',
            ],
          },
          '[[Sikkerhedskopier hos databasetjenesten, og hvor længe de gemmes: bekræftes]]',
        ],
      },
      rights: {
        title: 'Dine rettigheder, og hvordan du bruger dem',
        body: [
          {
            list: [
              'Se og hent dine data: {app/settings|Indstillinger}, "Dine data", "Hent mine data". Filen indeholder din konto, profiler, fremskridt, valg, prøveperiode og køb.',
              'Ret dem: skift profiler, sprog og nyheder under Indstillinger. Skriv til os om alt andet.',
              'Slet dem: slet en profil eller hele kontoen under Indstillinger.',
              'Stop nyhedsmails: fjern fluebenet under Indstillinger, eller brug linket nederst i enhver nyhedsmail.',
              'For e-mailloggen eller noget, der ikke er i filen: skriv til [[e-mailadresse til privatlivsspørgsmål]].',
            ],
          },
          'Vi svarer på anmodninger [[inden for den frist, loven fastsætter: bekræftes af vores advokat]].',
        ],
      },
      children: {
        title: 'Børn',
        body: [
          'StoryTime er lavet til børn, men kun voksne har konti og træffer alle valg.',
          {
            list: [
              'En forælder opretter hver børneprofil. Vi beder kun om et fornavn eller kælenavn, som kan være et hvilket som helst ord, og en aldersgruppe.',
              'En pædagog indtaster en gruppe, aldrig børnenes navne.',
              'Børnenes skærme har ingen reklamer, ingen tilbud og ingen sporing. Køb, indstillinger og alt om penge ligger bag et voksentjek.',
              'Du kan altid se, ændre og slette hver profil og dens fremskridt.',
            ],
          },
          '[[Bekræftelse af, at en forælders samtykke dækker en børneprofil som beskrevet: bekræftes af vores advokat]]',
        ],
      },
      security: {
        title: 'Sådan beskytter vi dem',
        body: [
          {
            list: [
              'Alle forbindelser til siden er krypterede.',
              'Databasen selv giver hver konto adgang til kun dens egne data.',
              'Adgangskoder gemmes kun som en envejskode.',
              'Kun ejerens konto kan åbne ejerens område, og ændringer i indhold, pakker og refusioner logges.',
            ],
          },
          'Hvis data nogensinde bliver eksponeret, [[hvad vi gør, og hvem vi giver besked: afklares med vores advokat]].',
        ],
      },
      news: {
        title: 'Nyhedsmails',
        body: [
          'Vi sender kun nyheder om nye historier, hvis du har sat flueben i nyhedsfeltet. Det er aldrig udfyldt på forhånd, og du kan altid fjerne fluebenet under Indstillinger eller via linket i hver nyhedsmail.',
          'Hver nyhedsmail er mærket som reklame i emnefeltet, på hebraisk ("פרסומת") og på mailens sprog.',
          'Servicemails, for eksempel bekræftelser, kvitteringer og påmindelsen før en pakke slutter, sendes altid og indeholder aldrig tilbud.',
        ],
      },
      cookies: {
        title: 'Cookies',
        body: ['Vi bruger ingen sporings- eller reklamecookies. Hvad siden gemmer i din browser, og hvorfor, står på siden {legal/cookies|Cookies og lokal lagring}.'],
      },
      updates: {
        title: 'Ændringer i politikken',
        body: ['Når politikken ændres, opdaterer vi datoen øverst. [[Hvordan vi giver kontohavere besked om en vigtig ændring: afklares med vores advokat]]'],
      },
      complaints: {
        title: 'Spørgsmål og klager',
        body: [
          'Skriv gerne til os først: [[e-mailadresse til privatlivsspørgsmål]]. Du kan også klage til den israelske myndighed for beskyttelse af privatlivet (Privacy Protection Authority) under Justitsministeriet. [[Myndighedens kontaktoplysninger]]',
        ],
      },
    },
  },

  refunds: {
    title: 'Fortrydelse og refusion',
    summary: 'Sådan fortryder du en pakke inden for 14 dage, sådan fungerer refusionen, og det sker der med din adgang.',
    sections: {
      short: {
        title: 'Kort fortalt',
        body: [
          {
            list: [
              'Du kan fortryde en pakke inden for 14 dage.',
              'Vi betaler pengene tilbage inden for 14 dage efter din anmodning.',
              'Vi kan beholde et gebyr på højst 5 % af prisen eller 100 shekel, alt efter hvad der er lavest.',
              'Den gratis prøveperiode koster intet, så den skal ikke opsiges. Pakker fornyes aldrig, så der er intet at stoppe.',
            ],
          },
        ],
      },
      right: {
        title: 'Din fortrydelsesret',
        body: [
          'Du kan fortryde en pakke inden for 14 dage fra den dag, du købte den, eller fra den dag, du modtog købsbekræftelsen, alt efter hvad der kommer sidst. Det gælder også, selvom du allerede er begyndt at bruge pakken.',
        ],
      },
      how: {
        title: 'Sådan fortryder du',
        body: [
          'Vælg den måde, der passer dig:',
          {
            steps: [
              'Logget ind: gå til {cancel-purchase|Fortryd et køb} eller til dine pakker under {app/settings|Indstillinger}, og vælg "Fortryd dette køb". Det tager ét trin efter et voksentjek.',
              'Ikke logget ind: udfyld formularen på siden {cancel-purchase|Fortryd et køb} med den e-mail, du brugte ved købet, og ordrenummeret fra din købsbekræftelse.',
              'På e-mail: [[e-mailadresse til fortrydelse]].',
              'Med post: [[postadresse i Israel]].',
            ],
          },
          '[[Pr. telefon, hvis loven kræver det: nummeret tilføjes]]',
          'Vi bekræfter hver fortrydelse skriftligt på e-mail.',
        ],
      },
      refund: {
        title: 'Din refusion',
        body: [
          {
            list: [
              'Vi betaler pengene tilbage inden for 14 dage efter at have modtaget din anmodning og annullerer opkrævningen hos betalingsselskabet. [[Hvordan pengene når dig (samme kort eller på anden måde): bekræftes med betalingsselskabet]]',
              'Vi kan beholde et fortrydelsesgebyr på højst 5 % af prisen eller 100 shekel, alt efter hvad der er lavest. [[Om vi overhovedet tager et gebyr: ejerens beslutning]]',
              'Du får et kreditnotadokument for refusionen.',
            ],
          },
          '[[Om der må trækkes et beløb for de dage, pakken allerede er brugt: bekræftes af vores advokat. Indtil da trækker vi intet for brug.]]',
        ],
      },
      ourFault: {
        title: 'Når fejlen er vores',
        body: [
          'Fortryder du på grund af en fejl hos os, for eksempel at historierne ikke åbner, at pakken ikke er, som vi beskrev, eller at adgangen kom for sent, betaler vi hele prisen tilbage inden for 14 dage uden gebyr.',
        ],
      },
      longer: {
        title: 'En længere frist for nogle kunder',
        body: [
          'Personer med handicap, personer på 65 år eller derover og nye indvandrere (inden for 5 år efter indvandringen) kan have op til 4 måneder til at fortryde, hvis salget omfattede en samtale med os. Vores pakker sælges kun online, men hvis det gælder dig, så skriv det, når du fortryder.',
          '[[De præcise betingelser for denne ret: bekræftes af vores advokat]]',
        ],
      },
      after: {
        title: 'Når du har fortrudt',
        body: [
          {
            list: [
              'Adgangen fra den pakke slutter med det samme.',
              'Din konto, dine profiler og jeres læsefremskridt bliver.',
              'Andre pakker på kontoen påvirkes ikke.',
            ],
          },
        ],
      },
      nothing: {
        title: 'Intet at stoppe',
        body: ['Den gratis prøveperiode kræver intet kort og bliver aldrig til en betaling. Pakker betales én gang og fornyes aldrig. Der er intet abonnement at stoppe.'],
      },
      deleting: {
        title: 'At slette kontoen er ikke at fortryde',
        body: ['Sletter du din konto, får du ikke pengene for en pakke tilbage. Vil du have pengene tilbage inden for de 14 dage, så fortryd købet først, og slet derefter kontoen, hvis du ønsker det.'],
      },
      contact: {
        title: 'Sælger og kontakt',
        body: ['[[Virksomhedens navn]], [[ID- eller virksomhedsnummer]], [[postadresse i Israel]], [[e-mailadresse til fortrydelse]].'],
      },
    },
  },

  accessibility: {
    title: 'Tilgængelighedserklæring',
    summary: 'Sådan gør vi StoryTime brugbar for alle, hvad der endnu mangler, og hvordan du fortæller os om et problem.',
    sections: {
      commitment: {
        title: 'Vores mål',
        body: [
          'Vi vil have, at alle børn og voksne kan bruge StoryTime. Vi bygger siden efter retningslinjerne for tilgængeligt webindhold (WCAG) 2.1 på niveau AA, som den israelske standard 5568 bygger på. [[Den gældende version af israelsk standard 5568: bekræftes]]',
        ],
      },
      done: {
        title: 'Det har vi bygget indtil nu',
        body: [
          {
            list: [
              'Telefonen først: alle sider virker på en lille skærm, med store knapper og links.',
              'Knapper og links er almindelige og virker med tastatur, og det element, du står på, har en tydelig ramme.',
              'Intet er skjult bag, at man holder musen over noget.',
              'Ordene i bøgerne er rigtig tekst, så skærmlæsere kan læse dem højt, og bogen kan vise større tekst.',
              'Filmene har undertekster på fire sprog, som er slået til fra start.',
              'Beder din enhed om mindre bevægelse, eller kan den ikke vise 3D, bliver bogen en flad bog uden bladreanimation.',
              'Arabiske og hebraiske sider løber fra højre mod venstre.',
              'Skærme til små børn fungerer med billeder, ikke ord.',
            ],
          },
        ],
      },
      gaps: {
        title: 'Det mangler endnu',
        body: [
          'Vi siger ærligt, hvad der stadig mangler:',
          {
            list: [
              'Siden er endnu ikke testet i Safari på iPhone og iPad.',
              'Der er endnu ingen indtalte stemmer; læs med bruger testoptagelser.',
              'En fuld kontrol efter standarden er ikke lavet endnu. Den laves, før salget åbner.',
              'På arabisk og hebraisk løber filmens tidslinje stadig fra venstre mod højre.',
              'Sidens endelige farver og skrifttyper er ved at blive designet; kontrasten kontrolleres igen, når de er fastlagt.',
              'Betalingssiden tilhører betalingsselskabet, som endnu ikke er valgt.',
            ],
          },
        ],
      },
      contact: {
        title: 'Fortæl os om et problem',
        body: [
          'Er noget svært at bruge, eller har du brug for en tilpasning, så fortæl os det:',
          { list: ['Kontakt for tilgængelighed: [[navn]]', 'E-mail: [[e-mailadresse]]', 'Telefon: [[telefonnummer, hvis der er et]]', 'Post: [[postadresse i Israel]]'] },
          '[[Hvor hurtigt vi svarer: fastsættes senere]]',
        ],
      },
      date: {
        title: 'Erklæringens dato',
        body: ['Erklæringen er skrevet den 25. november 2026. [[Dato for den seneste fulde tilgængelighedskontrol]]'],
      },
    },
  },

  credits: {
    title: 'Krediteringer og licenser',
    summary: 'Hvem der har skrevet og lavet det, du ser på StoryTime, og de eksterne værktøjer, vi bruger, med deres licenser.',
    sections: {
      stories: {
        title: 'Historier',
        body: [
          'Historier skrevet af StoryTime er mærket som StoryTimes.',
          'En historie skrevet af en ekstern forfatter krediteres forfatteren og tilhører fortsat forfatteren; vi bruger den med tilladelse. [[Forfatterens navn, som hun ønsker det vist, og datoen for hendes skriftlige tilladelse]]',
        ],
      },
      art: {
        title: 'Billeder, film og lyde',
        body: [
          'Billederne, filmene, figurerne og lydene er tegnet og animeret i programkode af StoryTime. Vi bruger ikke AI-værktøjer, der laver billeder eller video.',
          'Der er endnu ingen indtalte stemmer. Når de kommer, krediteres hver stemme her. [[Stemmer og indspilningstjeneste]]',
        ],
      },
      fonts: {
        title: 'Skrifttyper',
        body: ['Siden henter ingen skrifttyper: den bruger dem, der allerede findes på din enhed. [[Tilføjer brandet skrifttyper, står hver skrifttype og dens licens her]]'],
      },
      code: {
        title: 'Kodebiblioteker',
        body: [
          'StoryTime er bygget med disse åbne biblioteker. Tak til dem, der har lavet dem.',
          {
            table: {
              head: ['Bibliotek', 'Lavet af', 'Licens'],
              rows: [
                ['React, React DOM', 'Meta Platforms, Inc. and affiliates', 'MIT'],
                ['React Router', 'React Training LLC, Remix Software Inc.', 'MIT'],
                ['GSAP', 'GreenSock', 'GreenSocks gratis standardlicens'],
                ['three.js', 'three.js authors', 'MIT'],
                ['React Three Fiber, drei', 'Poimandres (pmndrs)', 'MIT'],
                ['Zustand', 'Paul Henschel and contributors', 'MIT'],
                ['Media Chrome', 'Mux, Inc.', 'MIT'],
                ['ce-la-react', 'Google LLC', 'BSD-3-Clause'],
                ['Supabase JavaScript client', 'Supabase', 'MIT'],
                ['React Email', 'Plus Five Five, Inc. (Resend)', 'MIT'],
                ['Tailwind CSS', 'Tailwind Labs, Inc.', 'MIT'],
                ['isbot', 'isbot contributors', 'Unlicense (fri for ophavsret)'],
              ],
            },
          },
          'Disse biblioteker bruger igen andre biblioteker, hver under sin egen licens. [[Komplet liste over alle biblioteker og licenser: laves før lanceringen]]',
        ],
      },
      copyright: {
        title: 'Ophavsret',
        body: ['© 2026 [[virksomhedens navn]]. Alle rettigheder forbeholdes til StoryTimes historier, billeder, film og aktiviteter. En historie, der er krediteret sin forfatter, tilhører fortsat forfatteren.'],
      },
    },
  },

  cookies: {
    title: 'Cookies og lokal lagring',
    summary: 'Hvad siden gemmer i din browser og hvorfor. Ingen sporingscookies, ingen reklamer, intet at acceptere.',
    sections: {
      short: {
        title: 'Kort fortalt',
        body: [
          'StoryTime bruger ingen reklame-, analyse- eller sporingscookies. Siden gemmer nogle få små elementer i browserens eget lager, kun for at den kan virke: så du forbliver logget ind, og så dine indstillinger huskes. Derfor er der ikke noget cookiebanner at acceptere.',
          '[[Om hostingtjenesten sætter en cookie, der er nødvendig for sikkerheden, når siden er i drift: bekræftes ved lanceringen]]',
        ],
      },
      what: {
        title: 'Hvad der gemmes og hvorfor',
        body: [
          {
            table: {
              head: ['Element', 'Hvad det gør', 'Hvor længe'],
              rows: [
                ['Login (sb-…-auth-token)', 'Holder dig logget ind på denne enhed', 'Til du logger ud'],
                ['Læse- og filmindstillinger (storytime.prefs…)', 'Tekststørrelse, undertekster, automatisk bladring, reol eller liste', 'Til du rydder browserens lager'],
                ['Åben profil (storytime.activeLearner…)', 'Hvilken børneprofil der sidst var åben', 'Til du rydder browserens lager'],
                ['Sted i filmen (storytime.film…)', 'Hvor en film stoppede, så den kan fortsætte derfra', 'Til filmen slutter, eller du rydder lageret'],
                ['Voksentjek (storytime.gate.passedAt)', 'Husker i 10 minutter, at en voksen har svaret på tjekket', 'Til fanen lukkes'],
                ['E-mail, der bekræftes (storytime.pendingEmail)', 'Viser din adresse på siden "Tjek din e-mail"', 'Til fanen lukkes'],
                ['Små beskeder (storytime.access.dismissed, storytime.justDeleted)', 'Husker, at du lukkede en besked, eller at en konto lige er slettet', 'Til fanen lukkes'],
              ],
            },
          },
          'Disse elementer bliver på din enhed. Indstillingerne sendes ikke til os.',
        ],
      },
      testMode: {
        title: 'Mens siden er i testtilstand',
        body: ['Før salget åbner, kan siden køre i en testtilstand, og en besked på skærmen siger det. I testtilstand gemmes konti, profiler og fremskridt kun i denne browser (storytime.local…), ikke på en server.'],
      },
      others: {
        title: 'Andre virksomheder',
        body: ['Ingen andre virksomheder sætter cookies gennem StoryTime. Når du betaler, kommer du til betalingsselskabets egen side, som har sine egne cookieregler. [[Betalingsselskabet og dets cookiepolitik]]'],
      },
      control: {
        title: 'Du bestemmer',
        body: ['Du kan slette alt, hvad siden gemmer, ved at rydde sidens data i din browsers indstillinger. Derefter skal du logge ind igen, og indstillingerne går tilbage til standard.'],
      },
      updates: {
        title: 'Hvis det ændrer sig',
        body: ['Ønsker vi nogensinde at tilføje en valgfri cookie eller et måleværktøj, spørger vi dig først med et tydeligt valg og opdaterer denne side.'],
      },
    },
  },
} satisfies LegalDict
