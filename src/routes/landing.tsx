import { useId, type ReactNode } from 'react'
import { data, useLoaderData } from 'react-router'
import { PRICES } from '@/data/prices'
import { PASS_MONTHS } from '@/data/types'
import { ImpactChart } from '@/features/landing/ImpactChart'
import { isLang } from '@/i18n/config'
import { loadLanding } from '@/i18n/landing'
import { useLang } from '@/i18n/use-dict'
import { langData, pageMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { OfflineBanner } from '@/ui/Banners'
import { ButtonLink, PlaceholderTag, TextLink } from '@/ui/controls'
import { SiteFooter } from '@/ui/SiteFooter'
import { SiteHeader } from '@/ui/SiteHeader'
import type { Route } from './+types/landing'

export const meta: Route.MetaFunction = ({ matches }) => {
  const d = langData(matches)
  return d ? pageMeta({ lang: d.lang, page: '', title: d.dict.pages.landing.title, description: d.dict.pages.landing.description, siteName: d.dict.common.siteName }) : []
}

async function load(lang: string | undefined) {
  if (!isLang(lang)) throw data(null, { status: 404 })
  return { landing: await loadLanding(lang) }
}
/** The landing words load here, not in the shared dictionary, so other pages never carry them (src/i18n/landing.ts). */
export const loader = ({ params }: Route.LoaderArgs) => load(params.lang)
export const clientLoader = ({ params }: Route.ClientLoaderArgs) => load(params.lang)

/** Sources for the research lines (docs/research/ages-raw.md: WHO in section C, the two studies in section F). */
const SOURCES = {
  who: 'https://www.who.int/news/item/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more',
  durlak: 'https://pubmed.ncbi.nlm.nih.gov/21291449/',
  jones: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4605168',
} as const

/**
 * The public landing page: words and structure only. The visual design (Stage 2 brand, Stage 8 polish) restyles
 * these sections; what is fixed here is the order, the copy, the headings and the right-to-left behaviour.
 * The only story text in this public page is the one A04 excerpt in the dictionary (checked by e2e/stage4b1).
 */
export default function Landing() {
  const { lang, dict } = useLang()
  const t = useLoaderData<typeof loader>().landing
  const c = dict.commerce
  const signUp = localPath(lang, 'sign-up')
  const plans = localPath(lang, 'plans')
  const pricesSet = PRICES.some((p) => p.priceAgorot !== null)

  return (
    <>
      <OfflineBanner />
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl px-4">
        {/* 1. Hero: one main action, one secondary. */}
        <section aria-labelledby="hero-title" className="flex flex-col gap-5 py-10 sm:py-16">
          <h1 id="hero-title" className="max-w-3xl text-4xl font-semibold text-balance sm:text-5xl">{t.hero.title}</h1>
          <p className="max-w-prose text-lg text-pretty text-ink-muted">{t.hero.lead}</p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink to={signUp}>{t.hero.primary}</ButtonLink>
            <ButtonLink to={plans} variant="secondary">{t.hero.secondary}</ButtonLink>
          </div>
          <p className="text-ink-muted">{c.plans.trialLead}</p>
        </section>

        {/* 2. What is inside every story, shown through one real story (A04). */}
        <Block title={t.inside.title} lead={t.inside.lead}>
          <div className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold">{t.inside.storyTitle}</span>
              <Chip>{t.inside.storyGroup}</Chip>
            </p>
            <p className="text-ink-muted">{t.inside.storyLine}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {(['read', 'listen', 'watch', 'do'] as const).map((k, i) => (
              <li key={k} className="flex flex-col gap-2 rounded-control border border-line bg-surface p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-ink text-sm">{i + 1}</span>
                  {t.inside[k].name}
                </h3>
                <p>{t.inside[k].text}</p>
                {k === 'read' && (
                  <figure className="mt-1 flex flex-col gap-1 border-s-4 border-ink/70 ps-3">
                    <figcaption className="text-sm text-ink-muted">{t.inside.excerptLabel}</figcaption>
                    <blockquote lang={lang} className="text-lg leading-relaxed">{t.inside.excerpt}</blockquote>
                  </figure>
                )}
              </li>
            ))}
          </ol>
          <p role="note" className="rounded-control border border-dashed border-ink-muted px-4 py-3 text-sm text-ink-muted">{t.inside.status}</p>
        </Block>

        {/* 3. Values, with real examples from the outlines. */}
        <Block title={t.values.title} lead={t.values.lead}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(['elders', 'classmates', 'mother', 'numbers'] as const).map((k) => (
              <li key={k} className="flex flex-col gap-2 rounded-control border border-line bg-surface p-4">
                <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                  {t.values[k].value} <Chip>{t.values[k].group}</Chip>
                </h3>
                <p>{t.values[k].text}</p>
              </li>
            ))}
          </ul>
          <p className="text-ink-muted">{t.values.adultNote}</p>
        </Block>

        {/* 4. Evidence: illustration graph beside verified research only. */}
        <Block title={t.evidence.title}>
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <ImpactChart words={t.evidence.chart} />
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">{t.evidence.researchTitle}</h3>
              <ul className="flex flex-col gap-3">
                {(['who', 'durlak', 'jones'] as const).map((k) => (
                  <li key={k} className="flex flex-col gap-1">
                    <p>{t.evidence[k].text}</p>
                    <a href={SOURCES[k]} className="inline-flex min-h-11 items-center text-sm text-ink-muted underline underline-offset-4" rel="noopener">
                      {t.evidence[k].source}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-muted">{t.evidence.scope}</p>
              <p className="font-medium">{t.evidence.ownStudy}</p>
            </div>
          </div>
        </Block>

        {/* 5. How it works. */}
        <Block title={t.steps.title}>
          <ol className="grid gap-3 sm:grid-cols-3">
            {(['one', 'two', 'three'] as const).map((k, i) => (
              <li key={k} className="flex gap-3 rounded-control border border-line bg-surface p-4">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-lg font-semibold text-paper">{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{t.steps[k].title}</h3>
                  <p className="text-ink-muted"><Ranges text={t.steps[k].text} /></p>
                </div>
              </li>
            ))}
          </ol>
          <div>
            <ButtonLink to={signUp}>{t.hero.primary}</ButtonLink>
          </div>
        </Block>

        {/* 6. The age groups. */}
        <Block title={t.ages.title}>
          <dl className="grid gap-3 sm:grid-cols-3">
            {(['2-3', '4-5', '6-8'] as const).map((g) => (
              <div key={g} className="flex flex-col gap-1 rounded-control border border-line bg-surface p-4">
                <dt className="text-lg font-semibold"><bdi>{c.groups[g]}</bdi></dt>
                <dd>{t.ages[g]}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-muted">{t.ages.planned}</p>
        </Block>

        {/* 7. Plans teaser: no prices until the owner sets them; the law's cancellation link and methods. */}
        <Block title={t.plans.title} lead={t.plans.lead}>
          <ul className="flex flex-col gap-2">
            {PASS_MONTHS.map((m) => (
              <li key={m} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-surface px-4 py-3">
                <span className="font-semibold">{c.months[m]}</span>
                {!pricesSet && (
                  <span className="flex flex-wrap items-center gap-2 text-ink-muted">
                    {c.plans.priceNotSet} <PlaceholderTag>{c.plans.placeholderBadge}</PlaceholderTag>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <ul className="flex list-disc flex-col gap-1 ps-6">
            <li className="font-medium">{t.plans.noRenew}</li>
            <li>{c.plans.factCancel}</li>
          </ul>
          <div>
            <ButtonLink to={plans} variant="secondary">{t.plans.cta}</ButtonLink>
          </div>
          {/* Consumer Protection Law 14ט(ב): a clearly labelled cancellation link on the home page, with the methods beside it. */}
          <aside className="flex flex-col gap-1 rounded-control border border-line bg-paper p-4">
            <TextLink to={localPath(lang, 'cancel-purchase')} className="text-lg font-semibold">{c.cancel.homeLink}</TextLink>
            <p className="text-ink-muted">{c.cancel.homeMethods}</p>
          </aside>
        </Block>

        {/* 8. Questions and answers. Every question is a real button; answers are in the HTML for search and screen readers. */}
        <Block title={t.faq.title}>
          <div className="flex flex-col gap-2">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group rounded-control border border-line bg-surface">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-ink text-lg leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
                </summary>
                <p className="px-4 pb-4"><Ranges text={item.a} /></p>
              </details>
            ))}
          </div>
        </Block>
      </main>
      <SiteFooter />
    </>
  )
}

/** One landing section: a heading, an optional lead line, then its content. */
function Block({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 border-t border-line py-10 sm:py-14">
      <div className="flex flex-col gap-2">
        <h2 id={id} className="text-2xl font-semibold text-balance sm:text-3xl">{title}</h2>
        {lead && <p className="max-w-prose text-lg text-ink-muted"><Ranges text={lead} /></p>}
      </div>
      {children}
    </section>
  )
}

/** Keeps an age range such as "2–3" on one line, so a phone never breaks it after the dash. */
function Ranges({ text }: { text: string }) {
  return <>{text.split(/(\d+–\d+)/).map((part, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part))}</>
}

function Chip({ children }: { children: string }) {
  return <span className="inline-flex items-center rounded-full border border-ink/40 px-2.5 py-0.5 text-sm font-medium"><bdi>{children}</bdi></span>
}
