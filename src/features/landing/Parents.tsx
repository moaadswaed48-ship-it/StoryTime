import { AudioLines, Hourglass, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
import { BlurWords, Reveal } from '@/design/ui'
import { t } from '@/i18n/copy'
import { asset } from '@/lib/asset'

const P = t.landing.parents
/** One sign per question of `t.landing.parents.items`, in copy order: time · voice · safety · together. */
const ICONS: LucideIcon[] = [Hourglass, AudioLines, ShieldCheck, UsersRound]

/**
 * For the parent. The four things a mother or father asks before handing a child a screen, each in their own
 * words, each answered with something that is really in the product (nothing here is a promise about results).
 * Wide screens: the heading and a picture of story time in class stay beside the answers as they pass.
 */
export function Parents() {
  return (
    <section id="parents" className="lp-why" aria-label={`${P.titleA} ${P.titleB}`}>
      <div className="lp-why__in">
        <div className="lp-why__head">
          <Reveal>
            <p className="lp-kicker">
              <i aria-hidden />
              {P.kicker}
            </p>
          </Reveal>
          <h2 className="lp-h2">
            <BlurWords text={P.titleA} className="lp-h2__a" />
            <BlurWords text={P.titleB} className="lp-h2__b" delay={160} />
          </h2>
          <Reveal delay={220}>
            <p className="lp-lede">{P.lede}</p>
          </Reveal>
          <Reveal delay={320} className="lp-why__pic">
            <img src={asset('story/k01.webp')} alt="" width={1344} height={752} loading="lazy" decoding="async" draggable={false} />
            <span className="lp-why__tag lp-glass">{P.picture}</span>
          </Reveal>
        </div>
        <ol className="lp-why__list">
          {P.items.map((it, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal as="li" key={it.q} className="lp-why__row" delay={i * 80}>
                <span className="lp-why__icon" aria-hidden>
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                <div className="lp-why__txt">
                  <p className="lp-why__q">{it.q}</p>
                  <h3 className="lp-why__a">{it.a}</h3>
                  <p className="lp-why__s">{it.s}</p>
                </div>
              </Reveal>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
