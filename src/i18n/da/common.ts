import type { CommonDict } from '../schema'

export default {
  siteName: 'StoryTime',
  skipToContent: 'Spring til indhold',
  menu: 'Menu',
  language: 'Sprog',
  nav: {
    home: 'Forside',
    library: 'Bibliotek',
    plans: 'Pakker',
    signIn: 'Log ind',
    signUp: 'Opret konto',
    collections: 'Samlinger',
    settings: 'Indstillinger',
    owner: 'Ejerens område',
  },
  placeholder: 'Midlertidig side: design og indhold er under udarbejdelse.',
  notFound: 'Siden blev ikke fundet',
  notFoundLead: 'Denne adresse fører ikke til en side. Den kan være ændret, eller der mangler måske et bogstav.',
  notFoundHome: 'Gå til forsiden',
  loading: 'Indlæser …',
  footer: { label: 'Om siden', cancelPurchase: 'Fortryd et køb', help: 'Hjælp', contact: 'Kontakt', languages: 'Sidens sprog', business: 'Virksomhedsoplysninger: tilføjes, før salget åbner.' },
} satisfies CommonDict
