import type { PagesDict } from '../schema'

export default {
  landing: {
    title: 'Stories for children aged 2 to 8',
    description: 'Stories for ages 2 to 8 that teach respect and kindness. Each one will have a picture book, a short film and an activity to share.',
  },
  plans: { title: 'Plans by age group', description: 'Passes for each age group, for 1, 3 or 12 months. Paid once, never renewed by itself. Prices are not set yet.' },
  signIn: { title: 'Sign in', description: 'Sign in to your StoryTime account.' },
  signUp: { title: 'Create account', description: 'Create a StoryTime account and start the free trial: 3 stories for 3 days, with no card needed.' },
  legal: { terms: 'Terms of use', privacy: 'Privacy policy', refunds: 'Refunds and cancellation', accessibility: 'Accessibility statement', credits: 'Credits and licences', cookies: 'Cookies and local storage' },
  app: { library: 'Library', story: 'Story', collections: 'Collections', settings: 'Settings' },
  forgotPassword: { title: 'Reset your password', description: 'Get a link to choose a new password for your StoryTime account.' },
  cancelPurchase: { title: 'Cancel a purchase', description: 'How to cancel a StoryTime pass within 14 days, online, by email or by post.' },
  help: { title: 'Help', description: 'Answers to common questions about StoryTime, and how to reach us.' },
  contact: { title: 'Contact', description: 'Write to the StoryTime team with a question, an idea or a problem.' },
} satisfies PagesDict
