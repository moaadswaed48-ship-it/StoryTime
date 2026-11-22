/**
 * Words of the family side after sign-in: library, collections, storybook page, reader, film player, activity.
 * Part of the typed dictionaries (src/i18n/schema.ts → Dict.stories): a missing key in any language fails the
 * type check. Strings may hold {placeholders}, filled by fmt(). Same rules as schema.ts: Modern Standard Arabic,
 * parents addressed without assuming gender, Western digits.
 */
export type StoriesDict = {
  library: {
    whoIsReading: string
    whoIsReadingLead: string
    reading: string
    changeReader: string
    groupLegend: string
    continueTitle: string
    continuePage: string
    continueAction: string
    nothingStarted: string
    shelfLabel: string
    viewLegend: string
    viewShelf: string
    viewList: string
    prevBook: string
    nextBook: string
    openBook: string
    bookOf: string
    lockedBy: string
    emptyGroup: string
    samplesNote: string
  }
  doors: {
    legend: string
    read: string
    readHint: string
    listen: string
    listenHint: string
    watch: string
    watchHint: string
    do: string
    doHint: string
    testRecording: string
    noRecording: string
    noFilm: string
    noActivity: string
    hintTitle: string
    hintLead: string
    hintDismiss: string
    storyCredit: string
    authorCredit: string
    lockedTitle: string
    lockedLead: string
    backToLibrary: string
    progressRead: string
    progressWatched: string
    progressDone: string
  }
  reader: {
    bookLabel: string
    close: string
    textSize: string
    smaller: string
    larger: string
    pageOf: string
    prevPage: string
    nextPage: string
    listen: string
    pause: string
    autoFlip: string
    autoFlipHint: string
    on: string
    off: string
    theEnd: string
    readAgain: string
    tapToListen: string
    loading: string
    pageError: string
    audioError: string
    noRecordingPage: string
    accessEndedTitle: string
    accessEndedLead: string
    devVoice: string
    testRecording: string
  }
  film: {
    label: string
    close: string
    notReady: string
    error: string
    captionsNote: string
    /** Labels for the player's own buttons (Media Chrome keys, see src/features/film/chrome-labels.ts). */
    chrome: {
      play: string
      pause: string
      enableCaptions: string
      disableCaptions: string
      captions: string
      enterFullscreen: string
      exitFullscreen: string
      mute: string
      unmute: string
      seek: string
      videoPlayer: string
      playbackTime: string
      loading: string
      timeOf: string
      remaining: string
      hour: string
      hours: string
      minute: string
      minutes: string
      second: string
      seconds: string
      networkError: string
      decodeError: string
      notSupported: string
      notLoaded: string
    }
  }
  activity: {
    label: string
    goal: string
    need: string
    steps: string
    step: string
    minutes: string
    safety: string
    forAdult: string
    inClass: string
    didIt: string
    done: string
    undo: string
    moving: string
    still: string
  }
  collections: {
    stories: string
    films: string
    activities: string
    legend: string
    allAges: string
    playHere: string
    openHere: string
    close: string
    toStorybook: string
    empty: string
  }
  settings: {
    title: string
    autoFlip: string
    captions: string
    saved: string
  }
}
