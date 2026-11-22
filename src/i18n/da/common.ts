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
  },
  placeholder: 'Midlertidig side: design og indhold er under udarbejdelse.',
  notFound: 'Siden blev ikke fundet',
  loading: 'Indlæser …',
  footer: { label: 'Om siden', cancelPurchase: 'Fortryd et køb', business: 'Virksomhedsoplysninger: tilføjes, før salget åbner.' },
} satisfies CommonDict
