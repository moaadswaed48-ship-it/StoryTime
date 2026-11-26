import { useEffect, useRef, useState } from 'react'
import type { ActivityContent } from '@/data/types'
import { dirOf, isRtl, type Lang } from '@/i18n/config'
import { num } from '@/i18n/helpers'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button } from '@/ui/controls'
import { StepPicture } from '@/features/family/ActivityView'
import { IconArrow, IconCheck } from '@/features/family/icons'
import { ArtPlaceholder } from '@/features/family/Placeholder'
import { moveCard } from './classroom'

/**
 * An activity on the classroom's big screen: one card at a time. Card 0, "Get ready", shows the title, what it
 * teaches and what the group needs; then one card per step, its picture as large as the screen allows and its
 * caption in very large type. Large buttons at the two edges (at the foot on a phone) move between cards, and so do
 * the arrow keys (in the story's reading direction). "We did it!" sits on the last card. Under the screen, for the
 * teacher: the class note first, then the safety note and the whole idea. Nothing moves by itself; a moving step
 * plays its loop only when motion is welcome (StepPicture). Printing shows every card, one after another.
 */
export function ClassroomActivity({ activity, lang, done, onDone, learnerName, printable }: {
  activity: ActivityContent
  lang: Lang
  done: boolean
  onDone: ((done: boolean) => void) | null
  learnerName: string | null
  printable: boolean
}) {
  const { dict } = useLang()
  const t = dict.stories.activity
  const c = dict.stories.classroom
  const steps = activity.steps.length
  const [card, setCard] = useState(0)
  const rtl = isRtl(lang)
  const go = (by: number) => setCard((x) => moveCard(x, by, steps))
  const goRef = useRef(go)
  goRef.current = go

  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLElement && ev.target.closest('input,textarea,select')) return
      if (ev.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) goRef.current(1)
      else if (ev.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) goRef.current(-1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [rtl])

  // The "Get ready" card has its own heading; the steps say where the group is.
  const indicator = card === 0 ? '' : fmt(c.stepOf, { n: num(card), total: num(steps) })
  const last = card === steps
  const show = (i: number) => (i === card ? 'flex' : 'hidden print:flex')
  const back = (
    <button type="button" onClick={() => go(-1)} disabled={card === 0} aria-label={c.prevStep} data-testid="class-step-back"
      className="grid size-20 place-items-center rounded-full bg-surface shadow-md ring-1 ring-black/15 disabled:opacity-30 xl:size-24">
      <IconArrow className="size-10 -scale-x-100 rtl:scale-x-100 xl:size-12" />
    </button>
  )
  const forward = (
    <button type="button" onClick={() => go(1)} disabled={last} aria-label={c.nextStep} data-testid="class-step-forward"
      className="grid size-20 place-items-center rounded-full bg-ink text-paper shadow-md disabled:opacity-30 xl:size-24">
      <IconArrow className="size-10 rtl:-scale-x-100 xl:size-12" />
    </button>
  )

  return (
    <div className="flex flex-col gap-8" data-testid="activity" data-classroom="on" data-card={card} {...(printable ? { 'data-print-root': '' } : {})}>
      {/* The big screen. */}
      <section aria-labelledby="class-activity-title" dir={dirOf(lang)} lang={lang}
        className="flex min-h-[calc(100dvh-14rem)] flex-col gap-4 rounded-[1.25rem] bg-surface p-3 ring-1 ring-line sm:p-5 print:min-h-0 print:ring-0" data-testid="class-stage">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 id="class-activity-title" className="me-auto text-2xl font-semibold sm:text-3xl xl:text-4xl">{activity.title}</h1>
          <p className="text-xl font-semibold text-ink-muted tabular-nums xl:text-2xl" aria-live="polite" data-testid="class-indicator" data-no-print>{indicator}</p>
          {printable && (
            <Button variant="secondary" onClick={() => window.print()} data-testid="activity-print" data-no-print className="min-h-14">
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" /></svg>
              {t.print}
            </Button>
          )}
        </header>

        <div className="relative flex min-h-0 flex-1 items-stretch md:px-24 xl:px-32 print:px-0">
          <div className="absolute inset-y-0 start-0 hidden items-center md:flex" data-no-print>{back}</div>
          <div className="absolute inset-y-0 end-0 hidden items-center md:flex" data-no-print>{forward}</div>

          <ol className="flex min-w-0 flex-1 flex-col print:gap-8">
            <li className={`${show(0)} flex-1 flex-col justify-center gap-5`} data-testid="class-card-0">
              <h2 className="text-3xl font-semibold sm:text-4xl xl:text-6xl">{c.getReady}</h2>
              <p className="text-2xl sm:text-3xl xl:text-4xl">
                <span className="text-ink-muted">{t.goal}: </span>{activity.goal}
              </p>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold text-ink-muted xl:text-2xl">{t.need}</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 2xl:gap-4" data-testid="class-materials">
                  {activity.materials.map((m) => (
                    <li key={m.id} className="flex flex-col items-center gap-2 rounded-control bg-paper p-3 text-center ring-1 ring-line">
                      {m.pictureUrl
                        ? <img src={m.pictureUrl} alt="" className="aspect-square w-full max-w-32 2xl:max-w-40 rounded-[0.6rem] object-cover" loading="lazy" />
                        : <span className="relative block aspect-square w-full max-w-32 2xl:max-w-40 overflow-hidden rounded-[0.6rem]"><ArtPlaceholder compact /></span>}
                      <span className="text-lg font-semibold sm:text-xl xl:text-2xl">{m.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            {activity.steps.map((s, i) => (
              <li key={s.n} className={`${show(i + 1)} flex-1 flex-col items-center justify-center gap-5`} data-testid={`class-card-${i + 1}`}>
                <div className="w-full max-w-[calc((100dvh-30rem)*4/3)] min-w-0 print:max-w-md">
                  <StepPicture still={s.pictureUrl} loop={s.loopUrl} label={fmt(t.step, { n: num(s.n) })} placeholder={dict.stories.placeholder.picture} />
                </div>
                <p className="flex max-w-5xl items-start gap-4 text-3xl font-semibold leading-snug sm:text-4xl 2xl:text-5xl" data-testid="class-caption">
                  <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-2xl text-paper 2xl:size-16 2xl:text-3xl">{num(s.n)}</span>
                  <span><span className="sr-only">{fmt(t.step, { n: num(s.n) })}: </span>{s.caption}</span>
                </p>
                {i + 1 === steps && onDone && (
                  <div className="flex flex-col items-center gap-3" aria-live="polite" data-no-print>
                    {done ? (
                      <>
                        <p className="inline-flex items-center gap-3 text-2xl font-semibold text-green-900" data-testid="activity-done">
                          <span className="grid size-12 place-items-center rounded-full bg-green-800 text-white"><IconCheck className="size-7" /></span>
                          {fmt(t.done, { name: learnerName ?? '' })}
                        </p>
                        <Button variant="quiet" onClick={() => onDone(false)} className="min-h-14 text-lg">{t.undo}</Button>
                      </>
                    ) : (
                      <Button onClick={() => onDone(true)} className="min-h-20 px-12 text-2xl xl:text-3xl" data-testid="activity-did-it">
                        <IconCheck className="size-8" />
                        {t.didIt}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* On a phone or a narrow tablet the two buttons sit at the foot, where the teacher's thumbs are. */}
        <div className="flex items-center justify-between gap-4 md:hidden" data-no-print>
          {back}
          <span className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: steps + 1 }, (_, i) => <span key={i} className={`size-2.5 rounded-full ${i === card ? 'bg-ink' : 'bg-ink/25'}`} />)}
          </span>
          {forward}
        </div>
      </section>

      {/* For the teacher, under the screen: the class note first. */}
      <section className="flex flex-col gap-4" aria-labelledby="class-notes-h" data-testid="class-notes">
        <h2 id="class-notes-h" className="text-2xl font-semibold">{c.teacherNotes}</h2>
        {activity.inClass.trim() && (
          <div className="flex flex-col gap-2 rounded-control bg-surface p-5 ring-1 ring-line" data-testid="activity-in-class">
            <h3 className="text-xl font-semibold">{t.inClass}</h3>
            <p className="max-w-prose text-lg leading-relaxed" lang={lang} dir={dirOf(lang)}>{activity.inClass}</p>
          </div>
        )}
        <div className="flex gap-3 rounded-control border-s-4 border-amber-700 bg-amber-50 p-4 text-amber-950" data-testid="activity-safety">
          <span aria-hidden="true" className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-amber-700 text-sm font-bold text-white">!</span>
          <div>
            <h3 className="font-semibold">{t.safety}</h3>
            <p className="text-lg" lang={lang} dir={dirOf(lang)}>{activity.safety}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-control bg-surface p-5 ring-1 ring-line">
          <h3 className="text-xl font-semibold">{t.forAdult}</h3>
          <p className="max-w-prose text-lg leading-relaxed" lang={lang} dir={dirOf(lang)}>{activity.forAdult}</p>
        </div>
      </section>
    </div>
  )
}
