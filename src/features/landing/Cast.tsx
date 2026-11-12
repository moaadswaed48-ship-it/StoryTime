import type { CSSProperties } from 'react'
import { Rotate3d } from 'lucide-react'
import { BlurWords, Eyebrow, Reveal } from '@/design/ui'
import { Stage } from '@/features/sari/Stage'
import '@/features/sari/sari.css'
import { t } from '@/i18n/copy'
import { asset, assetAbs } from '@/lib/asset'

const C = t.landing.cast
/** Sari and Amir have portraits; Teacher Layla is shown as she appears in the first picture of the story (a crop of it). */
const FACES: Array<{ src?: string; crop?: CSSProperties }> = [
  { src: asset('app/avatars/sari.webp') },
  { src: asset('app/avatars/amir.webp') },
  { crop: { backgroundImage: `url("${assetAbs('story/k01-sm.webp')}")`, backgroundSize: '830%', backgroundPosition: '85% 12%' } },
]

/**
 * The characters. Sari stands on the stage in 3D (turn him, make him wave or run); beside him the three people
 * of the first story, each with one line taken from the story itself. Nothing is invented about them.
 */
export function Cast() {
  return (
    <section id="cast" className="sari sheet grain lp-cast" aria-label={C.title}>
      <div className="sari-inner">
        <div className="sari-copy">
          <Reveal>
            <Eyebrow>{C.eyebrow}</Eyebrow>
          </Reveal>
          <BlurWords as="h2" text={C.title} className="lp-cast__title" delay={80} />
          <Reveal delay={220}>
            <p className="lp-cast__lede">{C.lede}</p>
          </Reveal>
          <ul className="lp-people">
            {C.people.map((p, i) => (
              <Reveal as="li" key={p.name} delay={320 + i * 100} className="lp-person">
                {FACES[i].src ? <img className="lp-person__face" src={FACES[i].src} alt="" width={64} height={64} loading="lazy" decoding="async" /> : <span className="lp-person__face" style={FACES[i].crop} aria-hidden />}
                <span className="lp-person__txt">
                  <span className="lp-person__head">
                    <b>{p.name}</b>
                    <small>{p.role}</small>
                  </span>
                  <span className="lp-person__line">{p.line}</span>
                </span>
                {i === 0 && (
                  <span className="lp-person__tag">
                    <Rotate3d size={14} strokeWidth={2} aria-hidden />
                    {C.tag3d}
                  </span>
                )}
              </Reveal>
            ))}
          </ul>
        </div>
        <Stage calm />
      </div>
    </section>
  )
}
