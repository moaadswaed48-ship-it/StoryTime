import type { SupportDict } from '../schema'

export default {
  help: {
    lead: 'Svar på de spørgsmål, forældre og børnehavepersonale oftest stiller, og hvordan I kan kontakte os.',
    faqTitle: 'Spørgsmål og svar',
    contactTitle: 'Har du stadig et spørgsmål?',
    contactLead: 'Skriv til os via kontaktformularen.',
    contactLink: 'Åbn kontaktformularen',
    emailPlaceholder: 'E-mailadresse til support: tilføjes, før salget åbner.',
    cancelTitle: 'Fortryd et køb',
    cancelLead: 'Inden for 14 dage efter købet af en pakke kan købet fortrydes på siden »Fortryd et køb«.',
  },
  contact: {
    lead: 'Et spørgsmål, en idé eller et problem med siden: skriv det her.',
    name: 'Navn',
    email: 'E-mailadresse',
    emailHint: 'Bruges kun til at svare på denne besked.',
    message: 'Besked',
    messageHint: 'Op til 2.000 tegn.',
    tooLong: 'Beskeden er for lang. Den må højst have 2.000 tegn.',
    send: 'Send beskeden',
    sent: 'Tak. Din besked er gemt.',
    sendAnother: 'Skriv en ny besked',
    testNote: 'Testtilstand: beskeder gemmes kun i denne browser. Ingen læser dem endnu, og der sendes ingen e-mail.',
    otherWays: 'Andre måder at kontakte os på',
    helpLink: 'Spørgsmål og svar',
  },
} satisfies SupportDict
