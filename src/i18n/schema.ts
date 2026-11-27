import type { LegalDoc } from '../seo/paths'
import type { StoriesDict } from './stories-schema'

/**
 * The shape every language's dictionary must have. Each language file is checked with `satisfies`, so a key
 * that is missing (or misspelt, or extra) in any of the four languages fails `npm run typecheck`.
 * Rules: Modern Standard Arabic; address parents without assuming gender (verbal nouns in Arabic,
 * impersonal forms in Hebrew); Western digits everywhere.
 */
export type CommonDict = {
  /** Working name until the brand is designed in Stage 2. */
  siteName: string
  skipToContent: string
  menu: string
  language: string
  nav: {
    home: string
    library: string
    plans: string
    signIn: string
    signUp: string
    collections: string
    settings: string
    /** The owner's area: shown only to the owner account. */
    owner: string
  }
  /** Shown on every page that is still a placeholder (rule: placeholders are visibly marked). */
  placeholder: string
  notFound: string
  /** The not-found page: one calm line and the way home (the footer's Help link follows it). */
  notFoundLead: string
  notFoundHome: string
  loading: string
  footer: {
    label: string
    cancelPurchase: string
    help: string
    contact: string
    /** Name of the footer's language picker (the header's is `language`). */
    languages: string
    business: string
  }
}

export type ActionsDict = {
  start: string
  continue: string
  back: string
  next: string
  previous: string
  close: string
  play: string
  pause: string
  read: string
  signOut: string
}

export type PagesDict = {
  landing: { title: string; description: string }
  plans: { title: string; description: string }
  signIn: { title: string; description: string }
  signUp: { title: string; description: string }
  /** Short names of the legal pages (footer, page titles). The pages' text is in src/i18n/<lang>/legal.ts. */
  legal: Record<LegalDoc, string>
  app: { library: string; story: string; collections: string; settings: string }
  forgotPassword: { title: string; description: string }
  cancelPurchase: { title: string; description: string }
  help: { title: string; description: string }
  contact: { title: string; description: string }
}

/**
 * The Help page (the landing page's questions, loaded from the landing words, plus how to reach us) and the Contact
 * page with its form. The support email address is a visible placeholder until the owner sets it.
 */
export type SupportDict = {
  help: {
    lead: string
    faqTitle: string
    contactTitle: string
    contactLead: string
    contactLink: string
    emailPlaceholder: string
    cancelTitle: string
    cancelLead: string
  }
  contact: {
    lead: string
    name: string
    email: string
    emailHint: string
    message: string
    messageHint: string
    tooLong: string
    send: string
    sent: string
    sendAnother: string
    testNote: string
    otherWays: string
    helpLink: string
  }
}

/**
 * Accounts: sign-up, sign-in, email links, onboarding, settings, the parent gate, errors and page states.
 * Strings may hold {placeholders}, filled by fmt() in src/i18n/format.ts.
 */
export type AccountDict = {
  auth: {
    signUpTitle: string
    signUpLead: string
    email: string
    password: string
    showPassword: string
    hidePassword: string
    passwordHint: string
    strength: { weak: string; fair: string; strong: string }
    roleLegend: string
    roleParent: string
    roleParentHint: string
    roleTeacher: string
    roleTeacherHint: string
    adultsOnly: string
    adultCheck: string
    termsCheck: string
    readTerms: string
    readPrivacy: string
    marketingCheck: string
    marketingHint: string
    dataNote: string
    submitSignUp: string
    haveAccount: string
    signInLink: string
    checkTitle: string
    checkLead: string
    checkSpam: string
    checkResend: string
    checkResent: string
    checkWait: string
    checkWrong: string
    confirmWorking: string
    testOpenEmailChange: string
    emailChangedTitle: string
    emailChangedLead: string
    emailChangedContinue: string
    linkExpiredTitle: string
    linkExpiredLead: string
    linkExpiredEmail: string
    linkExpiredSend: string
    signInTitle: string
    submitSignIn: string
    forgot: string
    noAccount: string
    createLink: string
    sendAgain: string
    forgotTitle: string
    forgotLead: string
    forgotSubmit: string
    forgotSent: string
    backToSignIn: string
    resetTitle: string
    newPassword: string
    resetSubmit: string
    resetDone: string
    sessionExpired: string
    testEmailTitle: string
    testEmailLead: string
    testOpenConfirm: string
    testOpenReset: string
  }
  errors: {
    emailTaken: string
    invalidEmail: string
    weakPassword: string
    wrongCredentials: string
    unconfirmed: string
    rateLimited: string
    network: string
    unknown: string
    required: string
    mustAccept: string
    trialUsed: string
    noTrialStories: string
    profileLimit: string
    roleLocked: string
    cancelWindowClosed: string
    passNotActive: string
    /** create_order refused a real payment company: the seller's business name and number are not recorded yet (seller_not_set). */
    sellerNotSet: string
    /** create_order refused: this pass has no price yet (price_not_set). */
    priceNotSet: string
    notFound: string
    locked: string
    retry: string
  }
  states: {
    loading: string
    saving: string
    offline: string
    testMode: string
  }
  gate: {
    title: string
    lead: string
    question: string
    answer: string
    submit: string
    wrong: string
    back: string
  }
  onboarding: {
    stepOf: string
    skip: string
    languageTitle: string
    languageLead: string
    ageTitle: string
    ageLead: string
    childTitle: string
    childLead: string
    childName: string
    childNameHint: string
    childDefault: string
    classTitle: string
    classLead: string
    className: string
    classNameHint: string
    classDefault: string
    optional: string
    trialTitle: string
    trialLead: string
    trialStoriesTitle: string
    trialEndsAt: string
    trialAfter: string
    trialStart: string
    trialAlreadyUsed: string
    toFirstStory: string
    toLibrary: string
  }
  settings: {
    title: string
    accountTitle: string
    roleParent: string
    roleTeacher: string
    languageTitle: string
    siteLanguage: string
    storyLanguage: string
    save: string
    saved: string
    profilesTitle: string
    classesTitle: string
    addProfile: string
    addClass: string
    edit: string
    remove: string
    cancel: string
    removeWarn: string
    removeLastWarn: string
    confirmRemove: string
    noProfiles: string
    passesTitle: string
    noPasses: string
    passFrom: string
    passUntil: string
    daysLeft: string
    passStatus: { queued: string; active: string; ending_soon: string; ended: string; cancelled: string; refunded: string }
    cancelUntil: string
    cancelPurchase: string
    paymentsTitle: string
    noPayments: string
    orderStatus: { pending: string; paid: string; failed: string; cancelled: string; refunded: string }
    receiptNote: string
    /** A refund of an order in the payment history: requested, then issued with the amount returned, the fee and the owner's note. */
    refundRequested: string
    refundIssued: string
    refundToReturn: string
    refundReturned: string
    refundFee: string
    refundNoFee: string
    refundFeeLater: string
    refundNote: string
    newsTitle: string
    newsCheck: string
    serviceNote: string
    passwordTitle: string
    changePassword: string
    passwordChanged: string
    dataTitle: string
    download: string
    downloadNote: string
    correctNote: string
    deleteTitle: string
    deleteWarn: string
    deleteKept: string
    deletePass: string
    deleteType: string
    deleteMismatch: string
    deleteSubmit: string
    changeEmail: string
    newEmail: string
    sendEmailLink: string
    emailLinkSent: string
    emailChangeNote: string
    deletedTitle: string
    deletedLead: string
    signOut: string
  }
}

/** Plans, checkout, cancelling a purchase, and what a user sees as a trial or pass runs and ends. */
export type CommerceDict = {
  groups: { '2-3': string; '4-5': string; '6-8': string }
  groupHints: { '2-3': string; '4-5': string; '6-8': string }
  months: { 1: string; 3: string; 12: string }
  plans: {
    lead: string
    groupLegend: string
    placeholderBadge: string
    priceNotSet: string
    vatIncluded: string
    perMonth: string
    total: string
    paidOnce: string
    choose: string
    allFeatures: string
    factsTitle: string
    factInstant: string
    factEnds: string
    factTwoGroups: string
    factQueue: string
    factCancel: string
    factValidity: string
    /** factValidity once the owner has set at least one price (owner's area, Prices). */
    factValiditySet: string
    /** factValidity when some passes have a price and others not yet (decided per pass, not by one price). */
    factValidityPartial: string
    /** Home page plan teaser: a length priced for some age groups but not all of them yet. */
    priceSetSome: string
    israelOnly: string
    cancelLink: string
    sellerTitle: string
    sellerPlaceholder: string
    trialTitle: string
    trialLead: string
    trialCta: string
  }
  checkout: {
    title: string
    testBadge: string
    passLabel: string
    groupLabel: string
    lengthLabel: string
    startsLabel: string
    endsLabel: string
    totalLabel: string
    queuedNote: string
    /** create_order refused the order: the price changed while the summary was open (price_changed). {price}: the new total. */
    priceChangedTitle: string
    priceChangedLead: string
    /** The same refusal when the price was removed (no price now): the pass cannot be bought at the moment. */
    priceRemovedLead: string
    termsCheck: string
    rightsLink: string
    pay: string
    processing: string
    confirming: string
    successTitle: string
    successLead: string
    successQueued: string
    failedTitle: string
    failedLead: string
    cancelledTitle: string
    cancelledLead: string
    tryAgain: string
    toLibrary: string
    toPasses: string
    orderRef: string
    testPayTitle: string
    testPayLead: string
    testPaySucceed: string
    testPayFail: string
    testPayCancel: string
    amount: string
    signInFirst: string
  }
  cancel: {
    title: string
    lead: string
    refund: string
    access: string
    trialNote: string
    noRenew: string
    signedInTitle: string
    signedInNone: string
    confirmTitle: string
    confirmLead: string
    confirm: string
    keep: string
    done: string
    signedOutTitle: string
    signedOutLead: string
    email: string
    orderRef: string
    message: string
    send: string
    sent: string
    otherWays: string
    contactPlaceholder: string
    homeLink: string
    homeMethods: string
  }
  access: {
    trialActive: string
    trialStoriesNote: string
    trialEndedTitle: string
    trialEndedLead: string
    passEndedTitle: string
    passEndedLead: string
    seePasses: string
    buyNew: string
    notNow: string
    noAccessTitle: string
    noAccessLead: string
    startTrial: string
    open: string
    locked: string
    lockedLead: string
    sample: string
    samplesNote: string
    interimList: string
    interimStory: string
    page: string
    activePass: string
    keptNote: string
  }
}

export type Dict = {
  common: CommonDict
  actions: ActionsDict
  pages: PagesDict
  account: AccountDict
  commerce: CommerceDict
  stories: StoriesDict
  support: SupportDict
}
