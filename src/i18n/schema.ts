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
}

export type Dict = {
  common: CommonDict
  actions: ActionsDict
  pages: PagesDict
}
