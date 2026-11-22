import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'Stories for children aged 2 to 8',
    description: 'Placeholder page: a story library for children aged 2 to 8 is being built here.',
  },
  plans: { title: 'Plans by age group', description: 'Placeholder page for plans. No prices yet.' },
  signIn: { title: 'Sign in', description: 'Placeholder sign-in page. Accounts are not active yet.' },
  signUp: { title: 'Create account', description: 'Placeholder sign-up page. Sign-up is not active yet.' },
  legal: { terms: 'Terms of use', privacy: 'Privacy policy', description: 'Placeholder page. The legal text is being prepared.' },
  app: { library: 'Library', story: 'Story', collections: 'Collections', settings: 'Settings' },
  forgotPassword: { title: 'Reset your password', description: 'Get a link to choose a new password for your StoryTime account.' },
  cancelPurchase: { title: 'Cancel a purchase', description: 'How to cancel a StoryTime pass within 14 days, online, by email or by post.' },
} satisfies PagesDict
