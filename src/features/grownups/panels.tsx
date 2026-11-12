import { useState, type ReactNode } from 'react'
import { ArrowUpRight, Check, ChevronLeft, Languages, PenLine, Presentation, Trash2, Volume2, Wind } from 'lucide-react'
import { Pill } from '@/design/ui'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { setSound, sfx } from '@/audio/synth'
import { go } from '@/app/router'
import { writeReduceToggle } from '@/app/useMotionTier'
import { SCENES, story } from '@/content/story'
import { locale, num, switchLocale } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import { leavesOf, useProfileStore, type Activity } from '@/store/useProfileStore'
import { Maple } from '@/features/tree/Maple'
import { forgetSeen } from '@/features/tree/seen'
import { strings } from './strings'

const KINDS: Activity[] = ['read', 'watched', 'played']

function Label({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-[13.5px] font-semibold text-muted">{children}</h3>
      {end && <span className="text-[13.5px] font-semibold tabular-nums text-ink-2">{end}</span>}
    </div>
  )
}

/** What this child has done in the story. Every number is read from the progress kept in this browser. */
export function ProgressPanel() {
  const p = useProfileStore((s) => s.progress[story.id])
  const scene = Math.min(SCENES - 1, Math.max(0, p?.scene ?? 0))
  const at = story.scenes[scene]
  return (
    <div className="gu-card overflow-hidden" data-gu-progress data-started={!!p}>
      <div className="flex items-center gap-4 p-5 sm:gap-5 sm:p-7">
        <img src={asset(story.coverThumb)} alt="" className="aspect-[3/4] w-[72px] shrink-0 rounded-[14px] object-cover shadow-soft sm:w-[88px]" draggable={false} />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-maple">{story.kicker[locale]}</p>
          <p className="mt-1 text-[19px] font-bold leading-snug sm:text-[22px]">{story.title[locale]}</p>
        </div>
      </div>

      {!p ? (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/8 p-5 sm:p-7">
          <p className="text-[17px] text-ink-2" data-gu-none>
            {t.app.grown.none}
          </p>
          <Pill variant="outline" onClick={() => useSiteStore.getState().openBook(0)}>
            {t.app.home.start}
          </Pill>
        </div>
      ) : (
        <div className="grid gap-6 border-t border-ink/8 p-5 sm:gap-7 sm:p-7">
          <div>
            <Label end={`${num(leavesOf(p))} ${t.book.of} ${num(3)}`}>{strings.leaves}</Label>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {KINDS.map((k) => (
                <li key={k} className={cn('flex flex-col items-center gap-1.5 rounded-[18px] px-2 py-3 text-center sm:flex-row sm:gap-3 sm:px-4 sm:text-start', p[k] ? 'bg-paper' : 'border border-dashed border-ink/15')} data-gu-leaf={k} data-on={p[k]}>
                  <Maple kind={k} on={p[k]} className={cn('h-9 w-9 shrink-0', !p[k] && 'text-ink/40')} />
                  <span className="min-w-0">
                    <span className={cn('block text-[13.5px] font-semibold leading-tight', !p[k] && 'text-muted')}>{t.app.tree[k]}</span>
                    {p[k] && (
                      <span className="gu-done mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                        {t.app.story.done}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Label>{strings.lastScene}</Label>
            <button type="button" onClick={() => useSiteStore.getState().openBook(scene)} className="group mt-3 flex w-full items-center gap-4 rounded-[18px] bg-paper p-2.5 text-start transition-colors duration-200 hover:bg-paper-2" data-gu-scene={scene}>
              <img src={asset(at.thumb)} alt="" className="aspect-video w-[104px] shrink-0 rounded-[12px] object-cover sm:w-[128px]" draggable={false} />
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-bold leading-snug">{at.title[locale]}</span>
                <span className="mt-0.5 block text-[14px] tabular-nums text-ink-2">
                  {t.book.page} {num(scene + 1)} {t.book.of} {num(SCENES)}
                </span>
              </span>
              <ChevronLeft className="me-2 h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          <div>
            <Label end={p.letters.length ? num(p.letters.length) : undefined}>{strings.letters}</Label>
            {p.letters.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.letters.map((l) => (
                  <li key={l} className="gu-letter grid h-12 w-12 place-items-center rounded-[14px] bg-white text-[22px] font-extrabold" data-gu-letter={l}>
                    {l}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[15px] text-ink-2">{t.app.grown.none}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** A whole row that works as a switch: the label explains, the track shows the state. */
function SwitchRow({ icon, label, on, onChange, name }: { icon: ReactNode; label: string; on: boolean; onChange: (on: boolean) => void; name: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="gu-row flex w-full items-center gap-4 px-5 text-start sm:px-7" data-gu-switch={name}>
      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-200', on ? 'bg-maple/12 text-maple' : 'bg-paper text-ink-2')}>{icon}</span>
      <span className="min-w-0 flex-1 text-[17px] font-semibold leading-snug">{label}</span>
      <span className="gu-switch" data-on={on} aria-hidden />
    </button>
  )
}

/** Classroom mode: one line that explains it, a real switch, and the button a teacher presses in front of the group. */
export function ClassroomPanel() {
  const classroom = useProfileStore((s) => s.classroom)
  return (
    <div className="gu-card overflow-hidden" data-gu-classroom>
      <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[21/9]">
        <img src={asset(story.scenes[0].img)} alt="" className="h-full w-full object-cover object-[50%_30%]" draggable={false} />
      </div>
      <div className="p-5 pb-2 sm:p-7 sm:pb-3">
        <p className="t-lede max-w-[38rem] text-ink-2/85">{t.app.grown.classroomText}</p>
      </div>
      <SwitchRow name="classroom" icon={<Presentation className="h-5 w-5" aria-hidden />} label={t.app.grown.classroomOn} on={classroom} onChange={(v) => useProfileStore.getState().setClassroom(v)} />
      <div className="border-t border-ink/8 p-5 sm:p-7">
        <Pill variant="ink" size="lg" className="w-full sm:w-auto" onClick={() => useSiteStore.getState().openBook(0)} data-gu-present>
          {t.app.grown.present}
        </Pill>
      </div>
    </div>
  )
}

/** Clears what the child has done, and nothing else: the name and classroom mode stay as they are. */
function clearProgress() {
  const store = useProfileStore.getState()
  const { profile, classroom } = store
  store.reset()
  if (profile) useProfileStore.getState().setProfile(profile)
  if (classroom) useProfileStore.getState().setClassroom(true)
  forgetSeen()
}

export function SettingsPanel() {
  const sound = useSiteStore((s) => s.sound)
  const reduce = useSiteStore((s) => s.reduceToggle)
  const [reset, setReset] = useState<'idle' | 'ask' | 'done'>('idle')
  return (
    <div className="gu-card overflow-hidden" data-gu-settings>
      <div className="gu-row flex w-full items-center gap-4 px-5 sm:px-7">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink-2">
          <Languages className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-[17px] font-semibold leading-snug">{t.app.grown.language}</span>
        <Pill variant="outline" onClick={switchLocale} data-gu-lang>
          {t.nav.lang}
        </Pill>
      </div>
      <SwitchRow
        name="sound"
        icon={<Volume2 className="h-5 w-5" aria-hidden />}
        label={t.app.grown.sound}
        on={sound}
        onChange={(v) => {
          setSound(v)
          useSiteStore.getState().setSoundOn(v)
          if (v) sfx.pop()
        }}
      />
      <SwitchRow
        name="motion"
        icon={<Wind className="h-5 w-5" aria-hidden />}
        label={t.app.grown.motion}
        on={reduce}
        onChange={(v) => {
          writeReduceToggle(v)
          useSiteStore.getState().setReduceToggle(v)
        }}
      />
      {reset === 'idle' ? (
        <button type="button" onClick={() => setReset('ask')} className="gu-row flex w-full items-center gap-4 px-5 text-start transition-colors duration-200 hover:bg-white/60 sm:px-7" data-gu-reset="idle" data-gu-reset-start>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink-2">
            <Trash2 className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-[17px] font-semibold leading-snug">{t.app.grown.reset}</span>
          <ChevronLeft className="h-5 w-5 shrink-0 text-muted ltr:rotate-180" aria-hidden />
        </button>
      ) : (
        <div className="gu-row flex flex-wrap items-center gap-x-4 gap-y-4 px-5 py-4 sm:px-7" data-gu-reset={reset}>
          <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', reset === 'done' ? 'bg-maple text-white' : 'bg-paper text-ink-2')}>
            {reset === 'done' ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden /> : <Trash2 className="h-5 w-5" aria-hidden />}
          </span>
          <span className="min-w-0 flex-1 basis-[11rem] text-[17px] font-semibold leading-snug" role="status">
            {reset === 'ask' ? strings.resetAsk : t.app.grown.resetDone}
          </span>
          {reset === 'ask' && (
            <span className="flex w-full gap-2 sm:w-auto">
              <Pill variant="maple" className="gu-solid flex-1 sm:flex-none" onClick={() => (clearProgress(), setReset('done'))} data-gu-reset-yes>
                {strings.resetYes}
              </Pill>
              <Pill variant="outline" className="flex-1 sm:flex-none" onClick={() => setReset('idle')} data-gu-reset-no>
                {strings.cancel}
              </Pill>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Back to the front door, then down to the plans. The landing page loads its sections as it goes, so the plans
 * move down while it settles: keep them in place for a few seconds, and let go the moment the visitor scrolls.
 */
function seePlans() {
  go('landing')
  const started = performance.now()
  let stopped = false
  const stop = () => void (stopped = true)
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
  events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }))
  const seek = () => {
    if (stopped || useSiteStore.getState().view !== 'landing') return events.forEach((e) => window.removeEventListener(e, stop))
    const el = document.querySelector<HTMLElement>('#pricing')
    if (el && Math.abs(el.getBoundingClientRect().top - 80) > 8) {
      const lenis = useSiteStore.getState().lenis
      lenis?.resize() // the page has grown since the last measure
      if (lenis) lenis.scrollTo(el, { offset: -80, immediate: true, force: true })
      else window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 80)
    }
    if (performance.now() - started < 5000) setTimeout(seek, 180)
    else events.forEach((e) => window.removeEventListener(e, stop))
  }
  setTimeout(seek, 80)
}

export function PlanPanel() {
  return (
    <div className="grid gap-4" data-gu-plan>
      <div className="gu-card flex flex-wrap items-center justify-between gap-x-6 gap-y-5 p-5 sm:p-7">
        <div>
          <p className="text-[13.5px] font-semibold text-muted">{t.app.grown.planNow}</p>
          <p className="mt-2 flex items-center gap-3 text-[26px] font-bold leading-tight sm:text-[30px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-maple" aria-hidden />
            {t.app.grown.planDemo}
          </p>
        </div>
        <Pill variant="ink" size="lg" className="w-full sm:w-auto" onClick={seePlans} data-gu-plans>
          {t.app.grown.planSee}
          <ArrowUpRight className="flip-rtl h-[18px] w-[18px]" aria-hidden />
        </Pill>
      </div>
      <button type="button" onClick={() => go('studio')} className="gu-card group flex min-h-[84px] w-full items-center gap-4 px-5 text-start transition-[background-color,scale] duration-200 ease-out hover:bg-white active:scale-[0.985] sm:px-7" data-gu-studio>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper">
          <PenLine className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-[18px] font-bold leading-snug">{t.app.grown.studio}</span>
        <ChevronLeft className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5" aria-hidden />
      </button>
    </div>
  )
}
