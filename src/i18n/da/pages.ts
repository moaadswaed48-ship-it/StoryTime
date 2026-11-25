import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'Historier til børn fra 2 til 8 år',
    description: 'Historier til børn på 2 til 8 år om respekt og venlighed. Hver historie får en billedbog, en kort film og en aktivitet, I laver sammen.',
  },
  plans: { title: 'Pakker efter aldersgruppe', description: 'Pakker til hver aldersgruppe, til 1, 3 eller 12 måneder. Betales én gang og fornyes aldrig af sig selv. Priserne er ikke fastsat endnu.' },
  signIn: { title: 'Log ind', description: 'Log ind på din StoryTime-konto.' },
  signUp: { title: 'Opret konto', description: 'Opret en StoryTime-konto, og start den gratis prøveperiode: 3 historier i 3 dage, uden kort.' },
  legal: { terms: 'Brugsvilkår', privacy: 'Privatlivspolitik', refunds: 'Fortrydelse og refusion', accessibility: 'Tilgængelighedserklæring', credits: 'Krediteringer og licenser', cookies: 'Cookies og lokal lagring' },
  app: { library: 'Bibliotek', story: 'Historie', collections: 'Samlinger', settings: 'Indstillinger' },
  forgotPassword: { title: 'Nulstil din adgangskode', description: 'Få et link til at vælge en ny adgangskode til din StoryTime-konto.' },
  cancelPurchase: { title: 'Fortryd et køb', description: 'Sådan fortryder du køb af en StoryTime-pakke inden for 14 dage: online, på e-mail eller med post.' },
  help: { title: 'Hjælp', description: 'Svar på almindelige spørgsmål om StoryTime, og hvordan I kan kontakte os.' },
  contact: { title: 'Kontakt', description: 'Skriv til StoryTime med et spørgsmål, en idé eller et problem.' },
} satisfies PagesDict
