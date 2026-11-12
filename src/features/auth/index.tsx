import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, BookOpen, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react'
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

/** The demo account. The fields are read-only and the form never leaves the page. */
const DEMO = { email: 'demo@storytime.example', pass: '123456' }
/** Time the sheet takes to leave (matches auth.css). */
const EXIT = 280
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

const focusables = (root: HTMLElement | null) => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter((el) => el.getClientRects().length > 0)

/**
 * The sign-in sheet (shown while `loginOpen`). A demo: both fields are prefilled and read-only, and submitting
 * only flips `loggedIn` in the store — nothing is sent anywhere. Desktop: a paper card with the cover beside the form.
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

  // Focus lands on the main action (the form is already filled in), and again on the next one after signing in.
  useEffect(() => {
    if (!mounted || !open) return
    card.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
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
    if (e.shiftKey && (at === first || !card.current?.contains(at))) {
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
    const box = root.current
    const badge = box?.querySelector('.au__badge')
    if (box && badge) {
      const a = box.getBoundingClientRect()
      const b = badge.getBoundingClientRect()
      leaves.current?.burst(b.left + b.width / 2 - a.left, b.top + b.height / 2 - a.top, 16)
    }
    const id = window.setTimeout(() => setFx(false), 2600)
    return () => window.clearTimeout(id)
  }, [fx])

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
          <span className="au__brand">{t.brand}</span>
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
                <BookOpen size={19} strokeWidth={2} aria-hidden />
                {t.auth.go}
              </Pill>
            </div>
          ) : (
            <form ref={pane} className="au__form" onSubmit={submit} noValidate autoComplete="off">
              <h2 id={titleId} className="au__title">
                {t.auth.title}
              </h2>
              <p id={noteId} className="au__demo">
                <ShieldCheck size={16} strokeWidth={2} aria-hidden />
                <span>{t.auth.demo}</span>
              </p>

              <label className="au__field">
                <span className="au__label">{t.auth.email}</span>
                <span className="au__input">
                  <Mail size={18} strokeWidth={1.9} aria-hidden />
                  <input type="email" dir="ltr" value={DEMO.email} readOnly autoComplete="off" spellCheck={false} data-auth="email" />
                </span>
              </label>

              <div className="au__field">
                <label className="au__label" htmlFor={passId}>
                  {t.auth.pass}
                </label>
                <span className="au__input">
                  <LockKeyhole size={18} strokeWidth={1.9} aria-hidden />
                  <input id={passId} type={show ? 'text' : 'password'} dir="ltr" value={DEMO.pass} readOnly autoComplete="off" spellCheck={false} data-auth="pass" />
                  <button type="button" className="au__eye" onClick={() => setShow((v) => !v)} aria-label={show ? s.hide : s.show} aria-pressed={show} data-auth="eye">
                    {show ? <EyeOff size={19} strokeWidth={1.9} aria-hidden /> : <Eye size={19} strokeWidth={1.9} aria-hidden />}
                  </button>
                </span>
              </div>

              <Pill type="submit" variant="ink" size="lg" className="au__submit" data-autofocus data-auth="submit">
                <span>{t.auth.submit}</span>
                <span className="au__chip" aria-hidden>
                  <ArrowRight size={18} strokeWidth={2.2} className="flip-rtl" />
                </span>
              </Pill>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
