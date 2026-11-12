import { Play } from 'lucide-react'
import { BlurWords, Eyebrow, Pill, Reveal } from '@/design/ui'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import { Stage } from './Stage'
import './sari.css'

/**
 * "Meet Sari": the story's hero in 3D, on a stage lit like the film.
 * Words on the reading side, the stage on the other; on phones the stage comes first.
 * He looks at the pointer, turns with a drag (and with the scroll), waves when tapped, and when he runs
 * the whole stage rushes past him: leaves, floor and the giant name behind.
 */
export function MeetSari() {
  const openGame = useSiteStore((s) => s.openGame)
  return (
    <section id="sari" className="sari sheet grain" aria-label={t.sari.title}>
      <div className="sari-inner">
        <div className="sari-copy">
          <Reveal>
            <Eyebrow>{t.sari.eyebrow}</Eyebrow>
          </Reveal>
          <BlurWords as="h2" text={t.sari.title} className="sari-title" delay={80} />
          <Reveal delay={220}>
            <p className="sari-text t-lede">{t.sari.text}</p>
          </Reveal>
          <ul className="sari-facts">
            {t.sari.facts.map((f, i) => (
              <Reveal as="li" key={f.k} delay={340 + i * 90} className="sari-fact">
                <span className="sari-fact__k">{f.k}</span>
                <span className="sari-fact__v">{f.v}</span>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={640} className="sari-cta">
            <Pill variant="solid" size="lg" onClick={openGame} data-sari-play>
              <span className="sari-cta__icon" aria-hidden>
                <Play size={13} strokeWidth={0} fill="currentColor" />
              </span>
              {t.game.start}
            </Pill>
          </Reveal>
        </div>
        <Stage />
      </div>
    </section>
  )
}
