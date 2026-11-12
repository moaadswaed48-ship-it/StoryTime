import { ArrowRight, CaseSensitive, Check, Leaf, Shapes } from 'lucide-react'
import { enterApp } from '@/app/router'
import { words } from '@/content/learning'
import { BlurWords, Reveal } from '@/design/ui'
import { AVATARS, ReaderAvatar } from '@/features/enter/Avatar'
import { Maple } from '@/features/tree/Maple'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'

const S = t.landing.steps
const KEEP_ICONS = [Leaf, Shapes, CaseSensitive]
/** The words shown as a taste (the story page has all of them, each turning over to the author's sentence). */
const TASTE = ['wind', 'leaf', 'rain', 'crown', 'boat', 'flock']
const CHIPS = words.filter((w) => TASTE.includes(w.id))

/** A real screen of the app (captured from the running app, one set per language) in a thin drawn frame. */
function Shot({ name }: { name: 'reader' | 'tree' }) {
  return (
    <span className="lp-shot">
      <img src={asset(`app/shots/${name}-${locale}.webp`)} alt="" width={780} height={1688} loading="lazy" decoding="async" draggable={false} />
    </span>
  )
}

/**
 * How it works, in three steps, each shown with the real thing: the pictures a child chooses from, the book as it
 * opens on a phone, the tree with its leaves. Then what stays with the child after a story: leaves, words, letters.
 * Nothing here is drawn to look like the app: the screens are screenshots and the avatars are the app's own.
 */
export function Steps() {
  return (
    <section id="how" className="lp-how" aria-label={S.title}>
      <div className="lp-how__in">
        <header className="lp-how__head">
          <div>
            <Reveal>
              <p className="lp-kicker">
                <i aria-hidden />
                {S.kicker}
              </p>
            </Reveal>
            <BlurWords as="h2" text={S.title} className="lp-h2 lp-h2--one" delay={80} />
          </div>
          <Reveal delay={200}>
            <p className="lp-lede">{t.tour.lede}</p>
          </Reveal>
        </header>

        <ol className="lp-steps">
          {S.items.map((it, i) => (
            <Reveal as="li" key={it.t} className="lp-step" delay={i * 110}>
              <div className={`lp-step__art lp-step__art--${i + 1}`} aria-hidden>
                {i === 0 && (
                  <span className="lp-who">
                    {AVATARS.map((a, k) => (
                      <span key={a} className={k === 0 ? 'lp-who__one is-picked' : 'lp-who__one'}>
                        <ReaderAvatar avatar={a} className="lp-who__face" />
                        {k === 0 && (
                          <i>
                            <Check size={13} strokeWidth={3} />
                          </i>
                        )}
                      </span>
                    ))}
                  </span>
                )}
                {i === 1 && <Shot name="reader" />}
                {i === 2 && <Shot name="tree" />}
              </div>
              <div className="lp-step__txt">
                <span className="lp-step__n tnum" aria-hidden>
                  {num(0)}
                  {num(i + 1)}
                </span>
                <h3 className="lp-step__t">{it.t}</h3>
                <p className="lp-step__s">{it.s}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal className="lp-keeps">
          <div className="lp-keeps__head">
            <h3 className="lp-keeps__title">{S.after.title}</h3>
            <span className="lp-keeps__leaves" aria-hidden>
              <Maple kind="read" on />
              <Maple kind="watched" on />
              <Maple kind="played" on />
            </span>
          </div>
          <ul className="lp-keeps__list">
            {S.after.items.map((k, i) => {
              const Icon = KEEP_ICONS[i]
              return (
                <li key={k.t} className="lp-keep">
                  <span className="lp-keep__icon" aria-hidden>
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className="lp-keep__txt">
                    <b>{k.t}</b>
                    <span>{k.s}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="lp-keeps__foot">
            <ul className="lp-chips" aria-label={t.app.story.words}>
              {CHIPS.map((w) => (
                <li key={w.id} className="lp-chip">
                  <img src={asset(`app/words/${w.id}.webp`)} alt="" width={320} height={320} loading="lazy" decoding="async" draggable={false} />
                  {w.word[locale]}
                </li>
              ))}
            </ul>
            {/* the step after the third: the first leaf is one tap away */}
            <button type="button" className="lp-btn lp-btn--light" data-enter="how" onClick={() => enterApp()}>
              {S.after.enter}
              <span className="lp-btn__arrow" aria-hidden>
                <ArrowRight size={16} strokeWidth={2.4} className="flip-rtl" />
              </span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
