import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowRight, BookOpen, ShieldCheck, X } from 'lucide-react'
import { sfx } from '@/audio/synth'
import { useOverlayLock } from '@/design/overlay'
import { Pill } from '@/design/ui'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'
import { exposeQA } from '@/lib/qa'
import { useSiteStore } from '@/store/useSiteStore'
import './checkout.css'

type Phase = 'form' | 'paying' | 'receipt'
const EMPTY = { name: '', card: '', exp: '', cvc: '' }
/** How long the pretend payment "thinks" before the receipt starts to print (ms). */
const THINK = 1100

/** The card number as typed, in groups of four; a row of dots while it is empty. */
const grouped = (raw: string) => (raw.replace(/\s+/g, '').match(/.{1,4}/g) ?? ['••••', '••••', '••••', '••••']).join(' ')

/**
 * The demo checkout (shown while `checkout` is set in the store): choose → type anything → pay → a receipt prints.
 * It exists so a visitor can feel the whole path. Nothing is validated, nothing leaves the page and nothing is
 * charged; paying only flips `loggedIn`, which opens the rest of the story. Prices are the labelled samples.
 */
export function Checkout() {
  const order = useSiteStore((st) => st.checkout)
  const close = useSiteStore((st) => st.closeCheckout)
  const setLoggedIn = useSiteStore((st) => st.setLoggedIn)
  const [phase, setPhase] = useState<Phase>('form')
  const [form, setForm] = useState(EMPTY)
  const [bill, setBill] = useState({ no: '', date: '' })
  const card = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const open = !!order
  const shut = useCallback(() => close(), [close])
  useOverlayLock(open, shut)

  useEffect(() => {
    if (!open) return
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPhase('form')
    setForm(EMPTY)
    card.current?.focus({ preventScroll: true })
    // Tab stays inside the sheet; focus returns to where it came from when the sheet closes.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = Array.from(card.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, a[href]') ?? []).filter((n) => n.getClientRects().length > 0)
      if (!items.length) return
      const at = items.indexOf(document.activeElement as HTMLElement)
      const to = e.shiftKey ? (at <= 0 ? items.length - 1 : at - 1) : at === -1 || at === items.length - 1 ? 0 : at + 1
      e.preventDefault()
      e.stopImmediatePropagation()
      items[to].focus()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      if (before?.isConnected) before.focus({ preventScroll: true })
    }
  }, [open])

  const tier = t.pricing.tiers.find((x) => x.id === order?.plan) ?? t.pricing.tiers[1]
  const yearly = !!order?.yearly
  const amount = yearly ? tier.yearly : tier.monthly
  const price = `${t.pricing.currency}${num(amount)}`
  const period = yearly ? t.pricing.yearly : t.pricing.monthly

  const pay = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault() // a demo: nothing is sent anywhere
      if (phase !== 'form') return
      setPhase('paying')
      sfx.pop()
      window.setTimeout(() => {
        const now = new Date()
        setBill({
          no: `ST-${num(Math.floor(100000 + Math.random() * 900000))}`,
          date: new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(now),
        })
        setLoggedIn(true)
        setPhase('receipt')
        // the printer is heard only when the site's sound is on and the receipt really prints (not in the rest state)
        if (useSiteStore.getState().tier === 'reduced') sfx.chime()
        else sfx.print()
      }, THINK)
    },
    [phase, setLoggedIn],
  )

  useEffect(() => {
    exposeQA({
      checkout: {
        state: () => ({ open, phase }),
        fill: (v: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...v })),
        pay: () => pay(),
        done: () => close(),
      },
    })
  }, [open, phase, pay, close])

  if (!order) return null
  const last = form.card.replace(/\s+/g, '').slice(-4)
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="pay z-[85]" data-phase={phase}>
      <div className="pay__backdrop" onClick={shut} aria-hidden />
      <div ref={card} className="pay__card" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} data-lenis-prevent>
        <button type="button" className="pay__close" onClick={shut} aria-label={t.nav.close}>
          <X size={20} strokeWidth={2.2} aria-hidden />
        </button>

        {phase !== 'receipt' ? (
          <form className="pay__form" onSubmit={pay} noValidate autoComplete="off">
            <h2 id={titleId} className="pay__title">
              {t.pay.title}
            </h2>
            <p className="pay__demo">
              <ShieldCheck size={16} strokeWidth={2} aria-hidden />
              <span>{t.pay.demo}</span>
            </p>

            {/* the plan being bought: its name, and the labelled sample price */}
            <div className="pay__plan">
              <span className="pay__plan-name">
                {tier.name} <span className="pay__plan-period">· {period}</span>
              </span>
              <span className="pay__plan-price">
                <span className="pay__sample">{t.pricing.sample}</span>
                <b dir="ltr">{price}</b>
              </span>
            </div>

            {/* the card fills in as the visitor types */}
            <div className="pay__plastic" aria-hidden>
              <span className="pay__plastic-brand">{t.brand}</span>
              <span className="pay__plastic-chip" />
              <span className="pay__plastic-no" dir="ltr">
                {grouped(form.card)}
              </span>
              <span className="pay__plastic-row">
                <span>{form.name || t.pay.name}</span>
                <span dir="ltr">{form.exp || '••/••'}</span>
              </span>
            </div>

            <label className="pay__field">
              <span className="pay__label">{t.pay.name}</span>
              <input className="pay__input" type="text" value={form.name} onChange={set('name')} placeholder={t.pay.namePh} autoComplete="off" spellCheck={false} data-pay="name" />
            </label>
            <label className="pay__field">
              <span className="pay__label">{t.pay.card}</span>
              <input className="pay__input" type="text" inputMode="numeric" dir="ltr" value={form.card} onChange={set('card')} placeholder="0000 0000 0000 0000" autoComplete="off" spellCheck={false} data-pay="card" />
            </label>
            <div className="pay__two">
              <label className="pay__field">
                <span className="pay__label">{t.pay.exp}</span>
                <input className="pay__input" type="text" dir="ltr" value={form.exp} onChange={set('exp')} placeholder="00/00" autoComplete="off" spellCheck={false} data-pay="exp" />
              </label>
              <label className="pay__field">
                <span className="pay__label">{t.pay.cvc}</span>
                <input className="pay__input" type="text" inputMode="numeric" dir="ltr" value={form.cvc} onChange={set('cvc')} placeholder="000" autoComplete="off" spellCheck={false} data-pay="cvc" />
              </label>
            </div>

            <Pill type="submit" variant="ink" size="lg" className="pay__submit" disabled={phase === 'paying'} data-pay="submit">
              {phase === 'paying' ? (
                <>
                  <span className="pay__spin" aria-hidden />
                  <span>{t.pay.paying}</span>
                </>
              ) : (
                <>
                  <span>
                    {t.pay.pay} <b dir="ltr">{price}</b>
                  </span>
                  <span className="pay__chip" aria-hidden>
                    <ArrowRight size={18} strokeWidth={2.2} className="flip-rtl" />
                  </span>
                </>
              )}
            </Pill>
          </form>
        ) : (
          <div className="pay__done" role="status">
            <h2 id={titleId} className="sr-only">
              {t.pay.receipt}
            </h2>
            {/* the printer: a slot, and the paper that comes out of it line by line */}
            <div className="pay__printer" aria-hidden>
              <span className="pay__slot" />
            </div>
            <div className="pay__roll">
              <div className="pay__paper" data-pay="receipt">
                <p className="pay__r-brand">{t.brand}</p>
                <p className="pay__r-kind">{t.pay.receipt}</p>
                <dl className="pay__r-meta">
                  <div>
                    <dt>{t.pay.no}</dt>
                    <dd dir="ltr">{bill.no}</dd>
                  </div>
                  <div>
                    <dt>{t.pay.date}</dt>
                    <dd>{bill.date}</dd>
                  </div>
                </dl>
                <hr />
                <div className="pay__r-line">
                  <span>
                    {tier.name} · {period}
                  </span>
                  <b dir="ltr">{price}</b>
                </div>
                <div className="pay__r-line pay__r-muted">
                  <span>{t.pay.method}</span>
                  <span>
                    {t.pay.cardWord} <span dir="ltr">•••• {last || '••••'}</span>
                  </span>
                </div>
                <hr />
                <div className="pay__r-line pay__r-total">
                  <span>{t.pay.total}</span>
                  <b dir="ltr">{price}</b>
                </div>
                <span className="pay__r-bars" style={{ '--seed': bill.no.length } as CSSProperties} />
                <span className="pay__stamp">{t.pay.sample}</span>
              </div>
            </div>
            <p className="pay__thanks">{t.pay.thanks}</p>
            <Pill variant="ink" size="lg" className="pay__go" onClick={shut} data-pay="done">
              <BookOpen size={19} strokeWidth={2} aria-hidden />
              {t.pay.done}
            </Pill>
          </div>
        )}
      </div>
    </div>
  )
}
