import { useRef, type KeyboardEvent } from 'react'
import { t } from '@/i18n/copy'

/**
 * Monthly / yearly: a segmented control in a glass pill with a thumb that slides under the chosen side.
 * It is a radio group: arrows, Home and End move the choice. The saving is a small sticker on the yearly side.
 */
export function BillingToggle({ yearly, onChange, tone = 'night' }: { yearly: boolean; onChange: (yearly: boolean) => void; /** `paper`: a flat track for light grounds instead of glass. */ tone?: 'night' | 'paper' }) {
  const root = useRef<HTMLDivElement>(null)

  const pick = (next: boolean) => {
    if (next !== yearly) onChange(next)
    root.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next ? 1 : 0]?.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    const rtl = document.documentElement.dir === 'rtl'
    if (e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) pick(!yearly)
    else if (e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) pick(!yearly)
    else if (e.key === 'Home') pick(false)
    else if (e.key === 'End') pick(true)
    else return
    e.preventDefault()
  }

  return (
    <div ref={root} className={tone === 'paper' ? 'pl-toggle pl-toggle--paper' : 'pl-toggle glass'} role="radiogroup" aria-label={`${t.pricing.monthly} · ${t.pricing.yearly}`} data-yearly={yearly ? '' : undefined} onKeyDown={onKey}>
      <span className="pl-toggle__thumb" aria-hidden />
      <button type="button" role="radio" aria-checked={!yearly} tabIndex={yearly ? -1 : 0} className="pl-toggle__opt" data-value="monthly" onClick={() => onChange(false)}>
        {t.pricing.monthly}
      </button>
      <button type="button" role="radio" aria-checked={yearly} tabIndex={yearly ? 0 : -1} className="pl-toggle__opt" data-value="yearly" onClick={() => onChange(true)}>
        {t.pricing.yearly}
        <span className="pl-toggle__save">{t.pricing.save}</span>
      </button>
    </div>
  )
}
