import { useEffect, useId, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Plus } from 'lucide-react'
import { enterApp } from '@/app/router'
import { BlurWords, Reveal } from '@/design/ui'
import { t } from '@/i18n/copy'
import { cn } from '@/lib/cn'
import { useSiteStore } from '@/store/useSiteStore'

const F = t.landing.faq
/** How long an answer takes to open (matches landing.css). */
const OPEN_MS = 420

/**
 * Questions parents ask. Each answer is a fact of the product as it is today (see `t.landing.faq`): ages, how many
 * stories exist, devices, languages, the classroom, and what in this preview is a demo. Closed by default except
 * the first, so the list is one glance long; an answer opens in place.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const id = useId()
  const first = useRef(true)

  // the page below (the way in) is measured by ScrollTrigger: tell it when this list has changed height
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const done = window.setTimeout(() => {
      useSiteStore.getState().lenis?.resize()
      ScrollTrigger.refresh()
    }, OPEN_MS + 40)
    return () => window.clearTimeout(done)
  }, [open])

  return (
    <section id="faq" className="lp-faq" aria-label={F.title}>
      <div className="lp-faq__in">
        <div className="lp-faq__head">
          <Reveal>
            <p className="lp-kicker">
              <i aria-hidden />
              {F.kicker}
            </p>
          </Reveal>
          <BlurWords as="h2" text={F.title} className="lp-h2 lp-h2--one" delay={80} />
          <Reveal delay={200}>
            <p className="lp-lede">{F.lede}</p>
          </Reveal>
          <Reveal delay={280}>
            <button type="button" className="lp-btn lp-faq__enter" data-enter="faq" onClick={() => enterApp()}>
              {t.landing.closing.enter}
              <span className="lp-btn__arrow" aria-hidden>
                <ArrowRight size={16} strokeWidth={2.4} className="flip-rtl" />
              </span>
            </button>
          </Reveal>
        </div>

        <ul className="lp-faq__list">
          {F.items.map((it, i) => {
            const on = open === i
            return (
              <Reveal as="li" key={it.q} className={cn('lp-q', on && 'is-open')} delay={i * 60}>
                <h3 className="lp-q__head">
                  <button type="button" id={`${id}-q${i}`} aria-expanded={on} aria-controls={`${id}-a${i}`} onClick={() => setOpen(on ? null : i)}>
                    <span>{it.q}</span>
                    <i aria-hidden>
                      <Plus size={18} strokeWidth={2.2} />
                    </i>
                  </button>
                </h3>
                <div id={`${id}-a${i}`} className="lp-q__body" role="region" aria-labelledby={`${id}-q${i}`} inert={!on}>
                  <div>
                    <p>{it.a}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
