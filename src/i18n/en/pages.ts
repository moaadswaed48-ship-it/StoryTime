import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'Stories for children aged 2 to 8',
    description: 'Stories for ages 2 to 8 that teach respect and kindness, each with a picture book, a short film and an activity to share.',
  },
  plans: { title: 'Plans by age group', description: 'Placeholder page for plans. No prices yet.' },
  signIn: { title: 'Sign in', description: 'Placeholder sign-in page. Accounts are not active yet.' },
  signUp: { title: 'Create account', description: 'Placeholder sign-up page. Sign-up is not active yet.' },
  legal: { terms: 'Terms of use', privacy: 'Privacy policy', refunds: 'Refunds and cancellation', accessibility: 'Accessibility statement', credits: 'Credits and licences', cookies: 'Cookies and local storage' },
  app: { library: 'Library', story: 'Story', collections: 'Collections', settings: 'Settings' },
  forgotPassword: { title: 'Reset your password', description: 'Get a link to choose a new password for your StoryTime account.' },
  cancelPurchase: { title: 'Cancel a purchase', description: 'How to cancel a StoryTime pass within 14 days, online, by email or by post.' },
} satisfies PagesDict
