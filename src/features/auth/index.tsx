import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, Check, LibraryBig, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, X } from 'lucide-react'
import { enterApp } from '@/app/router'
import { sfx } from '@/audio/synth'
import { Leaves, type LeavesHandle } from '@/design/Leaves'
import { useOverlayLock } from '@/design/overlay'
import { Pill } from '@/design/ui'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import { s } from './strings'
import './auth.css'

/** What the empty fields suggest. Anything typed is accepted (also nothing at all): the form never leaves the page. */
const DEMO = { email: 'name@example.com', pass: '••••••' }
/** Time the sheet takes to leave (matches auth.css). */
const EXIT = 280
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/** How the visitor last acted (pointer or keyboard), so the sheet only rings its button for keyboard users. */
let viaKeys = false
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => { if (!e.metaKey && !e.altKey && !e.ctrlKey) viaKeys = true }, true)
  window.addEventListener('pointerdown', () => { viaKeys = false }, true)
}

const focusables = (root: HTMLElement | null) => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => el.getClientRects().length > 0)

/**
 * The sign-in / sign-up sheet (shown while `loginOpen`). A demo to try: type anything (or nothing) and submit;
 * it only flips `loggedIn` in the store — nothing is checked and nothing is sent anywhere. Desktop: a paper card with the cover beside the form.
 * Phones: a bottom sheet. Esc or the backdrop closes it; focus stays inside and returns to where it came from.
 */
export function AuthModal() {
  const open = useSiteStore((st) => st.loginOpen)
  const setLoginOpen = useSiteStore((st) => st.setLoginOpen)
  const setLoggedIn = useSiteStore((st) => st.setLoggedIn)
  const reduced = useSiteStore((st) => st.tier === 'reduced')
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)
  const [show, setShow] = useState(false)
  const [height, setHeight] = useState(0)
  const [fx, setFx] = useState(false)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [form, setForm] = useState({ name: '', email: '', pass: '' })
  const root = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const pane = useRef<HTMLFormElement>(null)
  const leaves = useRef<LeavesHandle>(null)
  const opener = useRef<HTMLElement | null>(null)
  const handOver = useRef(false)
  const titleId = useId()
  const noteId = useId()
  const passId = useId()

  const close = useCallback(() => setLoginOpen(false), [setLoginOpen])
  useOverlayLock(open, close)

  // Open: remember who asked, start from the right state. Close: give focus back, leave after the exit motion.
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      handOver.current = false
      setDone(useSiteStore.getState().loggedIn)
      setShow(false)
      setMode(useSiteStore.getState().authMode) // the landing page can ask for the new-account side
      setForm({ name: '', email: '', pass: '' })
      setHeight(0)
      setFx(false)
      setMounted(true)
      return
    }
    if (!handOver.current && opener.current?.isConnected) opener.current.focus({ preventScroll: true })
    opener.current = null
    const id = window.setTimeout(() => setMounted(false), EXIT)
    return () => window.clearTimeout(id)
  }, [open])

  // Keyboard users land on the main action (the form is already filled in), and again on the next one after signing in.
  // After a tap or a click the dialog itself takes focus, so the trap holds without a ring on the button.
  useEffect(() => {
    if (!mounted || !open) return
    const target = viaKeys ? card.current?.querySelector<HTMLElement>('[data-autofocus]') : card.current
    target?.focus({ preventScroll: true })
  }, [mounted, open, done])

  // Focus stays inside the sheet, even if something outside asks for it.
  useEffect(() => {
    if (!mounted || !open) return
    const pull = (e: FocusEvent) => {
      const box = card.current
      if (!box || !(e.target instanceof Node) || box.contains(e.target)) return
      ;(focusables(box)[0] ?? box).focus({ preventScroll: true })
    }
    document.addEventListener('focusin', pull)
    return () => document.removeEventListener('focusin', pull)
  }, [mounted, open])

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const list = focusables(card.current)
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    const at = document.activeElement
    if (at === card.current) {
      // the dialog itself holds focus (opened by a tap or click): Tab enters at either end
      e.preventDefault()
      ;(e.shiftKey ? last : first).focus()
    } else if (e.shiftKey && (at === first || !card.current?.contains(at))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (at === last || !card.current?.contains(at))) {
      e.preventDefault()
      first.focus()
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault() // a demo: nothing is sent anywhere
    setHeight(pane.current?.offsetHeight ?? 0)
    setLoggedIn(true)
    setDone(true)
    setFx(!reduced)
    sfx.chime()
  }

  // A handful of leaves fly up from the tick. The canvas exists only while they fall.
  useEffect(() => {
    if (!fx) return
    // one beat later, once the canvas has settled in (React's dev double-mount would drop leaves thrown at once)
    const fire = window.setTimeout(() => {
      const box = root.current
      const badge = box?.querySelector('.au__badge')
      if (!box || !badge) return
      const a = box.getBoundingClientRect()
      const b = badge.getBoundingClientRect()
      leaves.current?.burst(b.left + b.width / 2 - a.left, b.top + b.height / 2 - a.top, 16)
    }, 60)
    const end = window.setTimeout(() => setFx(false), 2800)
    return () => {
      window.clearTimeout(fire)
      window.clearTimeout(end)
    }
  }, [fx])

  // Into the app (SPEC 5.0): the label says so too (`t.app.enter`), matching the welcome line «the library is now open».
  const go = () => {
    handOver.current = true // the library takes the focus from here
    setLoginOpen(false)
    enterApp()
  }

  useEffect(() => {
    exposeQA({ auth: { state: () => ({ open, mounted, done, show, focusInside: !!card.current?.contains(document.activeElement) }) } })
  }, [open, mounted, done, show])

  if (!mounted) return null

  return (
    <div ref={root} className="au z-[80]" data-state={open ? 'open' : 'closing'} onKeyDown={onKey}>
      <div className="au__backdrop" onClick={close} aria-hidden />
      {fx && (
        <div className="au__fx" aria-hidden>
          <Leaves ref={leaves} density={0} />
        </div>
      )}

      <div ref={card} className="au__card" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={done ? undefined : noteId} tabIndex={-1} data-lenis-prevent>
        <div className="au__art" aria-hidden>
          <picture>
            <source media="(min-width: 760px)" srcSet={asset(story.cover)} />
            <img src={asset('story/k08-sm.webp')} alt="" width={640} height={358} decoding="async" draggable={false} />
          </picture>
          <span className="au__art-shade" />
          <span className="au__grip" />
          <span className="au__brand glass">{t.brand}</span>
          <span className="au__caption">
            <span className="au__kicker">{story.kicker[locale]}</span>
            <span className="au__story">{story.title[locale]}</span>
          </span>
        </div>

        <div className="au__body">
          <button type="button" className="au__close" onClick={close} aria-label={t.nav.close}>
            <X size={20} strokeWidth={2.2} aria-hidden />
          </button>

          {done ? (
            <div className="au__done" style={height ? { minHeight: height } : undefined} role="status">
              <span className="au__badge" aria-hidden>
                <Check size={32} strokeWidth={2.8} />
              </span>
              <h2 id={titleId} className="au__welcome">
                {t.auth.welcome}
              </h2>
              <Pill variant="ink" size="lg" className="au__go" onClick={go} data-autofocus data-auth="go">
                <LibraryBig size={19} strokeWidth={2} aria-hidden />
                {t.app.enter}
              </Pill>
            </div>
          ) : (
            <form ref={pane} className="au__form" onSubmit={submit} noValidate autoComplete="off">
              <h2 id={titleId} className="au__title">
                {mode === 'up' ? t.auth.titleUp : t.auth.title}
              </h2>
              <p id={noteId} className="au__demo">
                <ShieldCheck size={16} strokeWidth={2} aria-hidden />
                <span>{t.auth.demo}</span>
              </p>

              {mode === 'up' && (
                <label className="au__field">
                  <span className="au__label">{t.auth.name}</span>
                  <span className="au__input">
                    <UserRound size={18} strokeWidth={1.9} aria-hidden />
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t.auth.namePh} autoComplete="off" spellCheck={false} data-auth="name" />
                  </span>
                </label>
              )}

              <label className="au__field">
                <span className="au__label">{t.auth.email}</span>
                <span className="au__input">
                  <Mail size={18} strokeWidth={1.9} aria-hidden />
                  {/* plain text on purpose: anything typed is accepted, so nothing is validated */}
                  <input type="text" inputMode="email" dir="ltr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder={DEMO.email} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} data-auth="email" />
                </span>
              </label>

              <div className="au__field">
                <label className="au__label" htmlFor={passId}>
                  {t.auth.pass}
                </label>
                <span className="au__input">
                  <LockKeyhole size={18} strokeWidth={1.9} aria-hidden />
                  <input id={passId} type={show ? 'text' : 'password'} dir="ltr" value={form.pass} onChange={(e) => setForm((f) => ({ ...f, pass: e.target.value }))} placeholder={DEMO.pass} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} data-auth="pass" />
                  <button type="button" className="au__eye" onClick={() => setShow((v) => !v)} aria-label={show ? s.hide : s.show} aria-pressed={show} data-auth="eye">
                    {show ? <EyeOff size={19} strokeWidth={1.9} aria-hidden /> : <Eye size={19} strokeWidth={1.9} aria-hidden />}
                  </button>
                </span>
              </div>

              <Pill type="submit" variant="ink" size="lg" className="au__submit" data-autofocus data-auth="submit">
                <span>{mode === 'up' ? t.auth.submitUp : t.auth.submit}</span>
                <span className="au__chip" aria-hidden>
                  <ArrowRight size={18} strokeWidth={2.2} className="flip-rtl" />
                </span>
              </Pill>
              <button type="button" className="au__switch" onClick={() => setMode((m) => (m === 'in' ? 'up' : 'in'))} data-auth="switch">
                {mode === 'in' ? t.auth.toUp : t.auth.toIn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
