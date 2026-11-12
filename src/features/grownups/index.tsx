import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, BadgeCheck, Presentation, ShieldCheck, SlidersHorizontal, Sprout } from 'lucide-react'
import { Container, Pill } from '@/design/ui'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { sfx } from '@/audio/synth'
import { go } from '@/app/router'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import { useProfileStore } from '@/store/useProfileStore'
import { HoldButton } from './Hold'
import { ClassroomPanel, PlanPanel, ProgressPanel, SettingsPanel } from './panels'
import './grownups.css'

const TABS = ['progress', 'classroom', 'settings', 'plan'] as const
type Tab = (typeof TABS)[number]
const ICON = { progress: Sprout, classroom: Presentation, settings: SlidersHorizontal, plan: BadgeCheck }

/** The gate stays open for the rest of the visit (this tab), also across the reload a language switch needs. */
const OPEN = 'st:grown:open'
const TAB = 'st:grown:tab'
const remember = (k: string, v: string) => {
  try {
    sessionStorage.setItem(k, v)
  } catch {
    /* private mode: the gate simply closes again on reload */
  }
}
const recall = (k: string) => {
  try {
    return sessionStorage.getItem(k)
  } catch {
    return null
  }
}

/** Always in view: a grown-up should never have to wonder where the child's data goes. One sentence per line. */
function Local({ className }: { className?: string }) {
  // no RegExp lookbehind: iPhones before iOS 16.4 cannot parse it and the whole screen would fail to load
  const sentences = t.app.grown.local.match(/[^.!؟?]+[.!؟?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [t.app.grown.local]
  return (
    <p className={cn('flex w-fit items-start gap-2.5 text-[14.5px] leading-relaxed text-ink-2', className)} data-gu-local>
      <ShieldCheck className="mt-[3px] h-[18px] w-[18px] shrink-0 text-maple" aria-hidden />
      <span>
        {sentences.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </span>
    </p>
  )
}

function Gate({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-216px)] max-w-[30rem] flex-col items-center justify-center text-center" data-gu-gate>
      <h1 className="t-h2">{t.app.grown.gate}</h1>
      <p className="t-lede mt-3 text-ink-2/80">{t.app.grown.gateHint}</p>
      <HoldButton className="mt-10 text-ink" onDone={onOpen} data-gu-hold>
        {t.app.grown.hold}
      </HoldButton>
      <Local className="mx-auto mt-10 text-start" />
      <Pill variant="outline" className="mt-7 h-14 px-7" onClick={() => go('home')}>
        <ArrowLeft className="h-[18px] w-[18px] rtl:rotate-180" aria-hidden />
        {t.app.tabs.home}
      </Pill>
    </div>
  )
}

/**
 * The grown-ups' area: where a parent or a teacher looks behind the curtain. A press-and-hold gate keeps small
 * children out; behind it, the child's real progress, classroom mode, settings and the plan.
 */
export function GrownUps() {
  const [open, setOpen] = useState(() => recall(OPEN) === '1')
  const [tab, setTab] = useState<Tab>(() => {
    const saved = recall(TAB) as Tab | null
    return saved && TABS.includes(saved) ? saved : 'progress'
  })
  const name = useProfileStore((s) => s.profile?.name)
  const unlock = useCallback(() => {
    remember(OPEN, '1')
    sfx.pop()
    setOpen(true)
  }, [])
  const pick = useCallback((next: Tab) => {
    remember(TAB, next)
    setTab(next)
  }, [])

  useEffect(() => {
    exposeQA({
      grownups: {
        unlock,
        tab: (n: Tab) => TABS.includes(n) && pick(n),
        state: () => {
          const p = useProfileStore.getState()
          const s = useSiteStore.getState()
          return { open, tab, classroom: p.classroom, sound: s.sound, reduce: s.reduceToggle, progress: p.progress[story.id] ?? null, profile: p.profile }
        },
      },
    })
  }, [open, tab, unlock, pick])

  const i = TABS.indexOf(tab)
  return (
    <section id="grownups" className="relative min-h-[100svh] bg-paper pb-[132px] pt-[84px] text-ink lg:pb-24 lg:pt-[124px]" data-open={open} data-tab={tab}>
      <Container className="max-w-[1120px]">
        {!open ? (
          <Gate onOpen={unlock} />
        ) : (
          <div className="view-in grid gap-x-14 gap-y-6 lg:grid-cols-[304px_minmax(0,1fr)]">
            <aside className="self-start lg:sticky lg:top-[124px]">
              <h1 className="t-h2 whitespace-nowrap lg:!text-[clamp(2.5rem,3.9vw,3.4rem)]">{t.app.tabs.grownups}</h1>
              <Local className="mt-4 lg:mt-5" />
              <div className="gu-tabs mt-5 lg:mt-8" role="tablist" aria-label={t.app.tabs.grownups} style={{ '--i': i } as React.CSSProperties}>
                <span className="gu-thumb" aria-hidden />
                {TABS.map((k) => {
                  const Icon = ICON[k]
                  return (
                    <button key={k} type="button" role="tab" id={`gu-tab-${k}`} aria-selected={tab === k} aria-controls="gu-panel" className="gu-tab" onClick={() => pick(k)} data-gu-tab={k}>
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      <span>{t.app.grown.tabs[k]}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <div id="gu-panel" role="tabpanel" aria-labelledby={`gu-tab-${tab}`} key={tab} className={cn('view-in min-w-0', (tab === 'settings' || tab === 'plan') && 'max-w-[640px]')}>
              {/* the same heading line above every card */}
              <div className="mb-4 flex min-h-[44px] flex-wrap items-center justify-between gap-3 lg:mb-5 lg:pt-3">
                <h2 className="t-h3">{tab === 'progress' ? t.app.grown.progressTitle : tab === 'classroom' ? t.app.grown.classroomTitle : t.app.grown.tabs[tab]}</h2>
                {tab === 'progress' && name && <p className="inline-flex h-9 items-center rounded-full bg-paper-2 px-4 text-[15px] font-semibold text-ink-2">{name}</p>}
              </div>
              {tab === 'progress' && <ProgressPanel />}
              {tab === 'classroom' && <ClassroomPanel />}
              {tab === 'settings' && <SettingsPanel />}
              {tab === 'plan' && <PlanPanel />}
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}
