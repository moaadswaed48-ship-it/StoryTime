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
  }
  /** Shown on every page that is still a placeholder (rule: placeholders are visibly marked). */
  placeholder: string
  notFound: string
  loading: string
  footer: {
    label: string
    cancelPurchase: string
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
  legal: { terms: string; privacy: string; description: string }
  app: { library: string; story: string; collections: string; settings: string }
  forgotPassword: { title: string; description: string }
  cancelPurchase: { title: string; description: string }
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
}
