import { useEffect, useRef, useState } from 'react'
import type { ActivityContent } from '@/data/types'
import { dirOf, type Lang } from '@/i18n/config'
import { num } from '@/i18n/helpers'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button } from '@/ui/controls'
import { IconCheck } from './icons'
import { useReducedMotion } from './prefs'

/**
 * An activity, complete (owner's requests K and L): what it teaches, the safety note, what you need (a picture of
 * each thing), the steps as large pictures with very short captions (a step marked as moving plays a short silent
 * loop; with reduced motion it shows its still picture), the whole idea for the grown-up, the class note, and a
 * "We did it!" mark saved to the reader's progress. Used on the activity page and inside the collection.
 */
export function ActivityView({ activity, lang, done, onDone, learnerName, headingLevel = 1 }: {
  activity: ActivityContent
  /** The language the activity text is in (may differ from the site language). */
  lang: Lang
  done: boolean
  onDone: ((done: boolean) => void) | null
  learnerName: string | null
  headingLevel?: 1 | 2
}) {
  const { dict } = useLang()
  const t = dict.stories.activity
  const H = headingLevel === 1 ? 'h1' : 'h2'
  const S = headingLevel === 1 ? 'h2' : 'h3'
  return (
    <div className="flex flex-col gap-8" data-testid="activity">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase rtl:tracking-normal rtl:normal-case">{t.label}</p>
        <H className="text-3xl font-semibold" lang={lang} dir={dirOf(lang)}>{activity.title}</H>
        {activity.minutes && <p className="text-ink-muted">{fmt(t.minutes, { n: num(activity.minutes) })}</p>}
      </header>

      <section className="flex flex-col gap-2 rounded-control bg-surface p-5 ring-1 ring-line">
        <S className="text-sm font-semibold text-ink-muted">{t.goal}</S>
        <p className="text-xl font-medium" lang={lang} dir={dirOf(lang)}>{activity.goal}</p>
      </section>

      <section className="flex gap-3 rounded-control border-s-4 border-amber-700 bg-amber-50 p-4 text-amber-950" data-testid="activity-safety">
        <span aria-hidden="true" className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-amber-700 text-sm font-bold text-white">!</span>
        <div>
          <S className="font-semibold">{t.safety}</S>
          <p lang={lang} dir={dirOf(lang)}>{activity.safety}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <S className="text-xl font-semibold">{t.need}</S>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="activity-materials">
          {activity.materials.map((m) => (
            <li key={m.id} className="flex flex-col items-center gap-2 rounded-control bg-surface p-3 text-center ring-1 ring-line">
              {m.pictureUrl ? <img src={m.pictureUrl} alt="" className="aspect-square w-full max-w-28 rounded-[0.6rem] object-cover" loading="lazy" /> : <span className="aspect-square w-full max-w-28 rounded-[0.6rem] bg-line/40" />}
              <span className="font-medium" lang={lang} dir={dirOf(lang)}>{m.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <S className="text-xl font-semibold">{t.steps}</S>
        <ol className="grid gap-4 sm:grid-cols-3" data-testid="activity-steps">
          {activity.steps.map((s) => (
            <li key={s.n} className="flex flex-col gap-3">
              <StepPicture still={s.pictureUrl} loop={s.loopUrl} label={fmt(t.step, { n: num(s.n) })} />
              <p className="flex items-start gap-3 text-lg font-medium" lang={lang} dir={dirOf(lang)}>
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-base text-paper">{num(s.n)}</span>
                <span><span className="sr-only">{fmt(t.step, { n: num(s.n) })}: </span>{s.caption}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2 rounded-control bg-surface p-5 ring-1 ring-line">
        <S className="text-xl font-semibold">{t.forAdult}</S>
        <p className="max-w-prose leading-relaxed" lang={lang} dir={dirOf(lang)}>{activity.forAdult}</p>
      </section>
      <section className="flex flex-col gap-2 rounded-control bg-surface p-5 ring-1 ring-line">
        <S className="text-xl font-semibold">{t.inClass}</S>
        <p className="max-w-prose leading-relaxed" lang={lang} dir={dirOf(lang)}>{activity.inClass}</p>
      </section>

      {onDone && (
        <div className="flex flex-col items-center gap-3 py-2" aria-live="polite">
          {done ? (
            <>
              <p className="inline-flex items-center gap-2 text-lg font-semibold text-green-900" data-testid="activity-done">
                <span className="grid size-9 place-items-center rounded-full bg-green-800 text-white"><IconCheck className="size-5" /></span>
                {fmt(t.done, { name: learnerName ?? '' })}
              </p>
              <Button variant="quiet" onClick={() => onDone(false)}>{t.undo}</Button>
            </>
          ) : (
            <Button onClick={() => onDone(true)} className="min-h-16 px-10 text-xl" data-testid="activity-did-it">
              <IconCheck className="size-6" />
              {t.didIt}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** A step's picture: its silent loop when it has one and motion is welcome, else the still. */
function StepPicture({ still, loop, label }: { still: string | null; loop: string | null; label: string }) {
  const { dict } = useLang()
  const reduced = useReducedMotion()
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const moving = !!loop && !reduced && !failed
  useEffect(() => {
    // Some browsers ignore autoplay until the element is in view: start it explicitly, quietly.
    if (moving) void video.current?.play().catch(() => {})
  }, [moving])
  return (
    <figure className="relative overflow-hidden rounded-control bg-surface ring-1 ring-line">
      {moving ? (
        <video ref={video} src={loop!} poster={still ?? undefined} muted loop playsInline autoPlay preload="metadata" aria-label={label} onError={() => setFailed(true)} className="aspect-[4/3] w-full object-cover" data-testid="step-loop" />
      ) : still ? (
        <img src={still} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
      ) : (
        <span className="block aspect-[4/3] w-full bg-line/40" />
      )}
      {loop && (
        <figcaption className="absolute start-2 top-2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white">
          {moving ? dict.stories.activity.moving : dict.stories.activity.still}
        </figcaption>
      )}
    </figure>
  )
}
