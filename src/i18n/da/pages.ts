import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'Historier til børn fra 2 til 8 år',
    description: 'Midlertidig side: her bygges et bibliotek med historier til børn fra 2 til 8 år.',
  },
  plans: { title: 'Pakker efter aldersgruppe', description: 'Midlertidig side til pakkerne. Ingen priser endnu.' },
  signIn: { title: 'Log ind', description: 'Midlertidig login-side. Konti er endnu ikke aktive.' },
  signUp: { title: 'Opret konto', description: 'Midlertidig side til oprettelse af konto. Tilmelding er endnu ikke aktiv.' },
  legal: { terms: 'Brugsvilkår', privacy: 'Privatlivspolitik', description: 'Midlertidig side. Den juridiske tekst er under udarbejdelse.' },
  app: { library: 'Bibliotek', story: 'Historie', collections: 'Samlinger', settings: 'Indstillinger' },
} satisfies PagesDict
