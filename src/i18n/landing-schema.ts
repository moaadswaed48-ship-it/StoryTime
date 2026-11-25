/**
 * Words of the public landing page (src/routes/landing.tsx). Part of the typed dictionaries (schema.ts → Dict.landing):
 * a missing key in any language fails the type check. Same rules as schema.ts: Modern Standard Arabic, parents and
 * teachers addressed without assuming gender, Western digits. Every claim must be true of the build today (CLAUDE.md
 * rule 4); the lines to revisit as production lands are listed in docs/landing/COPY-NOTES.md.
 */

type Part = { name: string; text: string }
type Value = { value: string; group: string; text: string }
type Step = { title: string; text: string }
type QA = { q: string; a: string }
/** Exactly nine questions in every language. */
type Nine<T> = [T, T, T, T, T, T, T, T, T]

export type LandingDict = {
  hero: {
    /** Seven words or fewer. */
    title: string
    lead: string
    /** Honest line beside the headline: what is ready today, and what is still being made (CLAUDE.md rule 4). */
    note: string
    primary: string
    secondary: string
  }
  /** "What is inside every story", shown through the pilot A04. */
  inside: {
    title: string
    lead: string
    /** A04's title in this language, exactly as the story file has it. */
    storyTitle: string
    storyGroup: string
    storyLine: string
    excerptLabel: string
    /**
     * The one story excerpt allowed in public HTML: page 5 of A04, copied exactly from
     * content/stories/a04/<lang>.json (a test fails if the two drift apart).
     */
    excerpt: string
    read: Part
    listen: Part
    watch: Part
    do: Part
    /** Honest status line: what exists today and what is still in production. */
    status: string
  }
  values: {
    title: string
    lead: string
    elders: Value
    classmates: Value
    mother: Value
    numbers: Value
    adultNote: string
  }
  evidence: {
    title: string
    chart: {
      title: string
      /** The fixed label inside the graphic: an illustration with sample numbers, not study results. */
      label: string
      xAxis: string
      yAxis: string
      xStart: string
      xEnd: string
      yLow: string
      yHigh: string
      /** The text alternative read by screen readers. */
      alt: string
    }
    researchTitle: string
    who: { text: string; source: string }
    durlak: { text: string; source: string }
    jones: { text: string; source: string }
    scope: string
    ownStudy: string
  }
  steps: {
    title: string
    one: Step
    two: Step
    three: Step
  }
  ages: {
    title: string
    '2-3': string
    '4-5': string
    '6-8': string
    planned: string
  }
  plans: {
    title: string
    lead: string
    noRenew: string
    cta: string
  }
  faq: {
    title: string
    items: Nine<QA>
  }
}
