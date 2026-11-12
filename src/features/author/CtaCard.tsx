import { forwardRef, type CSSProperties } from 'react'
import { ArrowUpRight, BookOpen, Play } from 'lucide-react'
import { go } from '@/app/router'
import { story } from '@/content/story'
import { Pill, Reveal } from '@/design/ui'
import { QuietFilm, type QuietFilmHandle } from '@/features/footer/QuietFilm'
import { t } from '@/i18n/copy'
import { asset } from '@/lib/asset'
import { useSiteStore } from '@/store/useSiteStore'

/** Scene 8, "leaves like rain": the camera stands still and only the leaves move — a background that stays quiet. */
const SCENE = story.scenes[7]
/** The copy is two short sentences; each gets its own line. (No look-behind: older Safari cannot parse it.) */
const LINES = t.author.ctaTitle.match(/[^.?!؟]+[.?!؟]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [t.author.ctaTitle]

/**
 * The invitation that closes the section: the falling-leaves clip behind a panel of dark glass.
 * The panel sits where the picture is calm (the open sky and the yard, on the picture's left), in both languages.
 * On phones the scene stands whole on top and the glass is a sheet rising over its foot.
 */
export const CtaCard = forwardRef<QuietFilmHandle>(function CtaCard(_, ref) {
  const openBook = useSiteStore((s) => s.openBook)
  const openFilm = useSiteStore((s) => s.openFilm)
  return (
    <Reveal className="aut-cta">
      {/* phones: the same picture, turned over and out of focus, carries on under the glass (the image is only asked for there) */}
      <span className="aut-cta__amb" style={{ '--amb': `url("${asset(SCENE.thumb)}")` } as CSSProperties} aria-hidden />
      <div className="aut-cta__film grain" aria-hidden>
        <div className="aut-cta__zoom">
          <QuietFilm ref={ref} clip={SCENE.clip!} poster={SCENE.img} posterSm={SCENE.thumb} sizes="(min-width: 1320px) 1208px, 94vw" />
        </div>
      </div>
      <div className="aut-cta__panel glass-ink">
        <h3 className="aut-cta__title">
          {LINES.map((line, i) => (
            <span key={i} className={i === LINES.length - 1 ? 'is-ask' : undefined}>
              {line}
            </span>
          ))}
        </h3>
        <div className="aut-cta__pills">
          <Pill variant="solid" size="md" className="aut-cta__pill" data-act="read" onClick={() => openBook(0)}>
            <BookOpen size={18} strokeWidth={2.1} aria-hidden />
            {t.author.ctaRead}
          </Pill>
          <Pill variant="glass" size="md" className="aut-cta__pill" data-act="watch" onClick={() => openFilm(0)}>
            <Play size={14} fill="currentColor" strokeWidth={0} aria-hidden />
            {t.author.ctaWatch}
          </Pill>
          {/* the quiet third way, next to them: the author's desk (a small outline pill) */}
          <Pill variant="outline" size="sm" className="aut-cta__studio" data-act="studio" onClick={() => go('studio')}>
            <span>{t.app.grown.studio}</span>
            <ArrowUpRight size={15} strokeWidth={2.2} className="flip-rtl" aria-hidden />
          </Pill>
        </div>
      </div>
    </Reveal>
  )
})
