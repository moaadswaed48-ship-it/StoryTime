import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, Lock, X } from 'lucide-react'
import { go } from '@/app/router'
import { prefersReducedNow } from '@/app/useMotionTier'
import { sfx } from '@/audio/synth'
import { Leaves } from '@/design/Leaves'
import { useOverlayLock } from '@/design/overlay'
import { BlurWords, Pill } from '@/design/ui'
import { t } from '@/i18n/copy'
import { rtl } from '@/i18n/locale'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { useProfileStore, type Avatar } from '@/store/useProfileStore'
import { useSiteStore, type View } from '@/store/useSiteStore'
import { AVATARS, ReaderAvatar } from './Avatar'
import { runCrossing } from './crossing'
import { cleanName, NAME_MAX } from './name'
import './enter.css'

/** closed → open (choosing) → covering (leaves close over the screen) → parting (the library shows behind them) → closed */
type Phase = 'closed' | 'open' | 'covering' | 'parting'
const VIEWS: View[] = ['home', 'story', 'tree', 'grownups', 'studio']

/**
 * Where "enter" leads. From the landing page it is the library (or the screen the visitor asked for, once the router
 * remembers it as `enterTarget` — see REQUESTS); inside the app the reader is only switching, so the screen stays.
 */
function targetView(): View {
  const st = useSiteStore.getState() as ReturnType<typeof useSiteStore.getState> & { enterTarget?: View | null }
  if (st.view !== 'landing') return st.view
  return st.enterTarget && VIEWS.includes(st.enterTarget) ? st.enterTarget : 'home'
}

/**
 * The way in: "Who is reading today?". Four round pictures, a name paper (like the name papers of the story),
 * one big button and a one-tap guest door. Confirming stores the reader in this browser and crosses into the library
 * behind a curtain of autumn leaves.
 */
export function Enter() {
  const picking = useSiteStore((s) => s.picking)
  const [phase, setPhase] = useState<Phase>('closed')
  const [avatar, setAvatar] = useState<Avatar>('sari')
  const [name, setName] = useState('')
  /** True once the visitor has tapped a picture (a guest who chose nothing gets the leaf). */
  const picked = useRef(false)
  const live = useRef({ phase, avatar, name })
  live.current = { phase, avatar, name }

  const panel = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const cross = useRef<{ finish: () => void } | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  // Follow the store: opening fills the form from the current reader; closing from outside (router) closes the dialog.
  useEffect(() => {
    if (picking && live.current.phase === 'closed') {
      const p = useProfileStore.getState().profile
      setAvatar(p?.avatar ?? 'sari')
      setName(p?.name ?? '')
      picked.current = !!p
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setPhase('open')
    } else if (!picking && live.current.phase === 'open') {
      setPhase('closed')
    }
  }, [picking])

  const cancel = useCallback(() => {
    if (live.current.phase === 'open') {
      useSiteStore.getState().setPicking(false)
      returnFocus.current?.focus?.({ preventScroll: true })
    } else cross.current?.finish()
  }, [])
  useOverlayLock(phase !== 'closed', cancel)

  /** Stores the reader and changes the screen. Runs while the leaves cover everything (or at once with reduced motion). */
  const commit = useCallback((a: Avatar, n: string) => {
    useProfileStore.getState().setProfile({ name: cleanName(n).trim(), avatar: a })
    const st = useSiteStore.getState()
    const target = targetView()
    if (st.view === target && !st.overlay) st.setPicking(false)
    else go(target)
    if (useSiteStore.getState().picking) useSiteStore.getState().setPicking(false)
  }, [])

  const confirm = useCallback(
    (a: Avatar, n: string) => {
      if (live.current.phase !== 'open') return
      setAvatar(a)
      setName(cleanName(n))
      sfx.chime()
      if (prefersReducedNow() || useSiteStore.getState().tier === 'reduced') {
        commit(a, n)
        setPhase('closed')
        return
      }
      setPhase('covering')
      // the canvas mounts with this render; start on the next frame
      requestAnimationFrame(() => {
        const cv = canvas.current
        if (!cv) {
          commit(a, n)
          setPhase('closed')
          return
        }
        cross.current = runCrossing(cv, {
          onCovered: () => {
            commit(a, n)
            setPhase('parting')
          },
          onDone: () => {
            cross.current = null
            setPhase('closed')
          },
        })
      })
    },
    [commit],
  )

  // Never leave a curtain behind (tab hidden, rAF paused…).
  useEffect(() => {
    if (phase !== 'covering' && phase !== 'parting') return
    const id = window.setTimeout(() => (cross.current ? cross.current.finish() : setPhase('closed')), 2200)
    return () => window.clearTimeout(id)
  }, [phase])
  useEffect(() => () => cross.current?.finish(), [])

  // While choosing: focus moves into the dialog and Tab stays inside it.
  useEffect(() => {
    if (phase !== 'open') return
    const root = panel.current
    const first = window.setTimeout(() => root?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus({ preventScroll: true }), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !root) return
      const items = Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), input')).filter((n) => n.offsetParent !== null)
      if (!items.length) return
      const a = items[0]
      const z = items[items.length - 1]
      if (!root.contains(document.activeElement)) (e.preventDefault(), a.focus())
      else if (e.shiftKey && document.activeElement === a) (e.preventDefault(), z.focus())
      else if (!e.shiftKey && document.activeElement === z) (e.preventDefault(), a.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(first)
      window.removeEventListener('keydown', onKey)
    }
  }, [phase])

  useEffect(() => {
    exposeQA({
      enter: {
        open: () => useSiteStore.getState().setPicking(true),
        /** Picks a picture, writes a name and goes in (with the crossing). Safe to call right after `open()`. */
        choose: (a: Avatar, n = '') => {
          const run = () => confirm(AVATARS.includes(a) ? a : 'sari', n)
          if (live.current.phase === 'open') run()
          else {
            useSiteStore.getState().setPicking(true)
            window.setTimeout(run, 80)
          }
        },
        skip: () => cross.current?.finish(),
        state: () => ({ open: live.current.phase === 'open', phase: live.current.phase, avatar: live.current.avatar, name: live.current.name }),
      },
    })
  }, [confirm])

  if (phase === 'closed') return null

  const choose = (a: Avatar) => {
    picked.current = true
    if (a !== avatar) sfx.pop()
    setAvatar(a)
  }
  const onRadioKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const fwd = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
    const back = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
    if (!fwd && !back) return
    e.preventDefault()
    const next = AVATARS[(i + (fwd ? 1 : AVATARS.length - 1)) % AVATARS.length]
    choose(next)
    panel.current?.querySelector<HTMLElement>(`[data-pick="${next}"]`)?.focus({ preventScroll: true })
  }
  const Arrow = rtl ? ArrowLeft : ArrowRight
  const choosing = phase === 'open' || phase === 'covering'

  return (
    <div className="enter" data-phase={phase} data-over={useSiteStore.getState().view === 'landing' ? 'film' : 'app'} data-lenis-prevent onPointerDown={phase === 'open' ? undefined : () => cross.current?.finish()}>
      {choosing && (
        <div className="enter__sheet" role="dialog" aria-modal="true" aria-label={t.app.who.title} inert={phase !== 'open'}>
          <button type="button" className="enter__backdrop" tabIndex={-1} aria-label={t.nav.close} onClick={cancel} />
          <Leaves density={7} className="enter__leaves" />
          <button type="button" className="enter__close glass" aria-label={t.nav.close} onClick={cancel}>
            <X size={22} strokeWidth={2.2} aria-hidden />
          </button>

          <div ref={panel} className="enter__panel">
            <div className="enter__head">
              <BlurWords as="h2" text={t.app.who.title} className="enter__title display-on-film" immediate />
              <p className="enter__sub text-on-film">{t.app.who.sub}</p>
            </div>

            <div className="enter__avatars" role="radiogroup" aria-label={t.app.who.sub}>
              {AVATARS.map((a, i) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={avatar === a}
                  tabIndex={avatar === a ? 0 : -1}
                  data-pick={a}
                  className={cn('enter__pick', avatar === a && 'is-on')}
                  style={{ '--i': i } as CSSProperties}
                  onClick={() => choose(a)}
                  onKeyDown={(e) => onRadioKey(e, i)}
                >
                  <span className="enter__face">
                    <ReaderAvatar avatar={a} className="h-full w-full" eager />
                    <span className="enter__tick" aria-hidden>
                      <Check size={19} strokeWidth={3.4} />
                    </span>
                  </span>
                  <span className="enter__who">{t.app.who.avatars[a]}</span>
                </button>
              ))}
            </div>

            <form
              className="enter__form"
              onSubmit={(e) => {
                e.preventDefault()
                confirm(avatar, name)
              }}
            >
              <label className="enter__paper">
                <span className="enter__paper-label">{t.app.who.name}</span>
                <input
                  className="enter__input"
                  type="text"
                  name="reader"
                  dir="auto"
                  value={name}
                  maxLength={NAME_MAX * 2}
                  placeholder={t.app.who.namePh}
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="go"
                  onChange={(e) => setName(cleanName(e.target.value))}
                />
              </label>
              <p className="enter__note">
                <Lock size={13} strokeWidth={2.2} aria-hidden />
                {t.app.who.note}
              </p>

              <Pill variant="solid" size="lg" type="submit" className="enter__go" data-enter-go>
                <span>{t.app.who.go}</span>
                <span className="enter__go-arrow" aria-hidden>
                  <Arrow size={18} strokeWidth={2.6} />
                </span>
              </Pill>
              <button type="button" className="enter__guest" data-enter-guest onClick={() => confirm(picked.current ? avatar : 'leaf', '')}>
                {t.app.who.guest}
              </button>
            </form>

          </div>
        </div>
      )}

      <canvas ref={canvas} className="enter__curtain" aria-hidden />
      <div className="enter__medal" aria-hidden>
        <ReaderAvatar avatar={avatar} className="h-full w-full" eager />
      </div>
      {/* the greeting the library will repeat: the child's name on a name paper, as in the story */}
      <p className="enter__hello" aria-hidden>
        {name.trim() ? (
          <>
            <span>{t.app.home.hello}</span>
            <span className="enter__hello-name" dir="auto">
              {name.trim()}
            </span>
          </>
        ) : (
          <span>{t.app.home.helloGuest}</span>
        )}
      </p>
    </div>
  )
}
