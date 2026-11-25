import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'Historier til børn fra 2 til 8 år',
    description: 'Historier til børn på 2 til 8 år om respekt og venlighed, hver med en billedbog, en kort film og en aktivitet, I laver sammen.',
  },
  plans: { title: 'Pakker efter aldersgruppe', description: 'Midlertidig side til pakkerne. Ingen priser endnu.' },
  signIn: { title: 'Log ind', description: 'Midlertidig login-side. Konti er endnu ikke aktive.' },
  signUp: { title: 'Opret konto', description: 'Midlertidig side til oprettelse af konto. Tilmelding er endnu ikke aktiv.' },
  legal: { terms: 'Brugsvilkår', privacy: 'Privatlivspolitik', refunds: 'Fortrydelse og refusion', accessibility: 'Tilgængelighedserklæring', credits: 'Krediteringer og licenser', cookies: 'Cookies og lokal lagring' },
  app: { library: 'Bibliotek', story: 'Historie', collections: 'Samlinger', settings: 'Indstillinger' },
  forgotPassword: { title: 'Nulstil din adgangskode', description: 'Få et link til at vælge en ny adgangskode til din StoryTime-konto.' },
  cancelPurchase: { title: 'Fortryd et køb', description: 'Sådan fortryder du køb af en StoryTime-pakke inden for 14 dage: online, på e-mail eller med post.' },
} satisfies PagesDict
