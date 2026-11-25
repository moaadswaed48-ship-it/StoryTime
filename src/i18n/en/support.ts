import type { SupportDict } from '../schema'

export default {
  help: {
    lead: 'Answers to the questions parents and kindergarten staff ask most, and how to reach us.',
    faqTitle: 'Questions and answers',
    contactTitle: 'Still have a question?',
    contactLead: 'Write to us through the contact form.',
    contactLink: 'Open the contact form',
    emailPlaceholder: 'Support email address: to be added before sales open.',
    cancelTitle: 'Cancelling a purchase',
    cancelLead: 'Within 14 days of buying a pass, the purchase can be cancelled on the “Cancel a purchase” page.',
  },
  contact: {
    lead: 'A question, an idea or a problem with the site: write it here.',
    name: 'Name',
    email: 'Email address',
    emailHint: 'Used only to answer this message.',
    message: 'Message',
    messageHint: 'Up to 2,000 characters.',
    tooLong: 'The message is too long. Keep it to 2,000 characters.',
    send: 'Send the message',
    sent: 'Thank you. Your message is saved.',
    sendAnother: 'Write another message',
    testNote: 'Test mode: messages are kept only in this browser. Nobody reads them yet, and no email is sent.',
    otherWays: 'Other ways to reach us',
    helpLink: 'Questions and answers',
  },
} satisfies SupportDict
