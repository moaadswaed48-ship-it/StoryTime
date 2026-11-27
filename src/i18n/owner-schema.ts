/**
 * The owner's area words, in four languages. Kept out of the main dictionary (src/i18n/schema.ts) so families never
 * download them: src/features/owner/i18n.ts loads one language's file on demand. Each file is checked with
 * `satisfies OwnerDict`, so a missing key fails `npm run typecheck`. {placeholders} are filled by fmt().
 * The people using these screens are a physician and an educator: plain words, no technical terms.
 */
export type OwnerDict = {
  area: {
    title: string
    lead: string
    nav: { stories: string; messages: string; refunds: string; prices: string; dashboard: string; changes: string }
    notOwnerTitle: string
    notOwnerLead: string
    backToLibrary: string
    testModeNote: string
  }
  list: {
    title: string
    lead: string
    newStory: string
    empty: string
    emptyLead: string
    draft: string
    published: string
    untitled: string
    noGroups: string
    trialMark: string
    langMissing: string
    langReady: string
    langChecked: string
    langNotOffered: string
    authorBadge: string
    publishedIn: string
    open: string
    updated: string
  }
  editor: {
    back: string
    preview: string
    save: string
    saved: string
    unsaved: string
    leaveWarning: string
    publishedWarning: string
    sections: { groups: string; titles: string; pages: string; film: string; activity: string; publish: string; history: string }
    groupsLead: string
    trialToggle: string
    trialLimit: string
    titleLabel: string
    teaserLabel: string
    teaserHint: string
    pageN: string
    addPage: string
    removePage: string
    removeConfirm: string
    picture: string
    pictureHint: string
    noPicture: string
    zoneLegend: string
    zoneHint: string
    zoneSideLegend: string
    zoneVLegend: string
    zoneSide: { start: string; end: string; full: string }
    zoneV: { top: string; middle: string; bottom: string }
    zoneSizeLegend: string
    zoneSize: { s: string; m: string; l: string }
    text: string
    speech: string
    speechHint: string
    missing: string
    lockedNote: string
    filmLead: string
    filmFile: string
    captionsFile: string
    captionsHint: string
    activityLead: string
    activityTitle: string
    goal: string
    materials: string
    materialsHint: string
    safety: string
    forAdult: string
    inClass: string
    stepsTitle: string
    stepN: string
    addStep: string
    removeStep: string
    stepMedia: string
    stepMediaHint: string
    stepCaption: string
    loopBadge: string
    historyLead: string
    historyEmpty: string
  }
  upload: {
    choose: string
    replace: string
    uploading: string
    sourceLegend: string
    sourceOwn: string
    sourceStudio: string
    sourceOther: string
    credit: string
    licence: string
    licenceHint: string
    limits: string
    current: string
    refused: { type: string; size: string; empty: string; content: string; licence: string }
  }
  publish: {
    lead: string
    colLang: string
    colState: string
    stateMissing: string
    stateReady: string
    stateChecked: string
    stateStale: string
    signOff: string
    withdraw: string
    signOffHint: string
    scopeLegend: string
    scopeAll: string
    scopeOnly: string
    publish: string
    unpublish: string
    isPublished: string
    isDraft: string
    problemsTitle: string
    softTitle: string
    publishedDone: string
    unpublishedDone: string
    authorOnlyArabic: string
    gaps: {
      title: string
      pageText: string
      speechWords: string
      picture: string
      noPages: string
      noGroup: string
      notSignedOff: string
      noLanguage: string
      film: string
      captions: string
      activity: string
      stepCaption: string
    }
    activityFields: { title: string; goal: string; materials: string; safety: string; forAdult: string; inClass: string }
  }
  preview: {
    title: string
    lead: string
    langLegend: string
    book: string
    film: string
    activity: string
    page: string
    noWords: string
    noPicture: string
    noFilm: string
    noActivity: string
    captions: string
    materials: string
    steps: string
    safety: string
    forAdult: string
    inClass: string
    storytimeCredit: string
    authorCredit: string
  }
  dashboard: {
    title: string
    lead: string
    signUps: string
    total: string
    last7: string
    parents: string
    teachers: string
    trials: string
    passes: string
    purchases: string
    purchasesEmpty: string
    colDate: string
    colEmail: string
    colGroup: string
    colLength: string
    colAmount: string
    colStatus: string
    months: string
    testNoPrice: string
    noEmail: string
    statuses: { paid: string; failed: string; cancelled: string; refunded: string; pending: string }
    countedAt: string
  }
  /** Part 2: the contact-form inbox. Nothing is emailed from the site; the owner writes back from her own email. */
  messages: {
    title: string
    lead: string
    /** "Still to handle: {n}" (a count after a colon, so no plural forms are needed). */
    unhandledCount: string
    allHandled: string
    filterLegend: string
    filterOpen: string
    filterAll: string
    empty: string
    emptyOpen: string
    noName: string
    writtenIn: string
    received: string
    handledOn: string
    markHandled: string
    markOpen: string
    reply: string
  }
  /** Part 2: refund requests from cancelled passes, and the public cancellation form. No money moves here. */
  refunds: {
    title: string
    lead: string
    noMoneyTitle: string
    noMoneyLead: string
    openCount: string
    noneOpen: string
    empty: string
    cancelledOn: string
    paidOn: string
    paid: string
    testPurchase: string
    noEmail: string
    feeLabel: string
    feeHint: string
    feeInvalid: string
    saveFee: string
    feeSaved: string
    feeNotSet: string
    fee: string
    toReturn: string
    noteLabel: string
    noteHint: string
    markRefunded: string
    stateOpen: string
    stateIssued: string
    stateDeclined: string
    refundedOn: string
    returned: string
    noteTitle: string
    publicTitle: string
    publicLead: string
    publicEmpty: string
    orderRef: string
    /** The orders matching a public request (order number and email), and the owner's cancellation for it. */
    matchesTitle: string
    noMatch: string
    passActive: string
    passCancelled: string
    passRefunded: string
    windowClosed: string
    cancelOrder: string
    cancelConfirm: string
    cancelYes: string
    cancelKeep: string
    cancelDone: string
  }
  /** Part 2: pass prices. Never a default number: until the owner sets one, the site says "Price not set yet". */
  prices: {
    title: string
    lead: string
    notSetRule: string
    current: string
    inputLabel: string
    save: string
    clear: string
    saved: string
    cleared: string
    invalid: string
    tooLow: string
    tooHigh: string
  }
  changes: {
    title: string
    lead: string
    empty: string
    colWhen: string
    colWhat: string
    actions: { insert: string; update: string; delete: string; publish: string; unpublish: string; import: string }
    targets: {
      stories: string
      story_listings: string
      story_texts: string
      story_age_groups: string
      story_signoffs: string
      pages: string
      films: string
      activities: string
      activity_steps: string
      media: string
      contact_messages: string
      cancellation_requests: string
      refunds: string
      passes: string
      pass_prices: string
      other: string
    }
  }
  errors: {
    generic: string
    network: string
    storageFull: string
    notFound: string
    textLocked: string
    trialLimit: string
    signoffBlocked: string
    publishBlocked: string
    /** A save that would leave a published story incomplete. */
    publishedIncomplete: string
    notOwner: string
    feeOverCap: string
    feeNotSet: string
    noteRequired: string
    refundClosed: string
    badPrice: string
    orderNotMatching: string
    passNotActive: string
    cancelWindowClosed: string
    retry: string
  }
}
