import type { CommonDict } from '../schema'

export default {
  siteName: 'StoryTime',
  skipToContent: 'Skip to content',
  menu: 'Menu',
  language: 'Language',
  nav: {
    home: 'Home',
    library: 'Library',
    plans: 'Plans',
    signIn: 'Sign in',
    signUp: 'Create account',
    collections: 'Collections',
    settings: 'Settings',
    owner: "Owner's area",
  },
  placeholder: 'Placeholder page: design and content are in progress.',
  notFound: 'Page not found',
  notFoundLead: 'This address does not lead to a page. It may have changed, or a letter may be missing.',
  notFoundHome: 'Go to the home page',
  loading: 'Loading…',
  footer: { label: 'Site information', cancelPurchase: 'Cancel a purchase', help: 'Help', contact: 'Contact', languages: 'Language of the site', business: 'Business details: to be added before sales open.' },
} satisfies CommonDict
