import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Container, Eyebrow, Pill } from '@/design/ui'
import { story } from '@/content/story'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { beats } from './beats'

/** Reduced motion: one still of the wind scene and the three ways as a plain list. Nothing moves, nothing is hidden. */
export function StillStory() {
  const scene = story.scenes[5]
  return (
    <section id="ways" className="relative bg-night py-16 sm:py-24" aria-labelledby="ways-title">
      <Container className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <figure className="grain relative aspect-[4/3] overflow-hidden rounded-[28px] sm:aspect-video lg:col-span-7">
          <img src={asset(scene.img)} alt={scene.title[locale]} width={1344} height={752} decoding="async" className="h-full w-full object-cover object-[42%_50%]" />
        </figure>
        <div className="lg:col-span-5">
          <h2 id="ways-title">
            <Eyebrow>{t.scroll.kicker}</Eyebrow>
          </h2>
          <ol className="mt-4 divide-y divide-white/10">
            {beats.map((b, i) => (
              <li key={i} data-beat={i} className="flex flex-col items-start gap-4 py-7 first:pt-4 last:pb-0">
                <div className="flex items-baseline gap-4">
                  <span className="text-[13px] font-semibold tabular-nums text-maple-soft" aria-hidden>
                    {num(i + 1).padStart(2, num(0))}
                  </span>
                  <h3 className="text-[clamp(2.75rem,5.6vw,4.5rem)] font-black leading-[1.05] tracking-[-0.03em] text-white">{b.word}</h3>
                </div>
                <p className="t-lede max-w-[28rem] text-paper/75">{b.line}</p>
                <Pill variant={i === 0 ? 'solid' : 'glass'} size="md" onClick={b.run}>
                  <b.Icon size={18} strokeWidth={2.2} aria-hidden />
                  {b.cta}
                  {b.down ? <ArrowDown size={16} strokeWidth={2.2} aria-hidden /> : <ArrowUpRight size={16} strokeWidth={2.2} className="flip-rtl" aria-hidden />}
                </Pill>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
