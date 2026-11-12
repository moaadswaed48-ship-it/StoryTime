import { RotateCw } from 'lucide-react'
import { useRef } from 'react'
import { words } from '@/content/learning'
import { story } from '@/content/story'
import { useInView } from '@/design/ui'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'
import { excerptCut } from './excerpt'

const CUTS = Object.fromEntries(words.map((w) => [w.id, excerptCut(w.quote.ar, story.scenes[w.scene]?.ar ?? [])]))

/**
 * The form the word takes inside her sentence (a plural, an article, a possessive). It is only used to find the word and
 * give it the accent colour; the sentence itself is printed untouched.
 */
const IN_SENTENCE: Record<string, { ar: string; en: string }> = {
  turn: { ar: 'دورك', en: 'turn' },
  wind: { ar: 'ريح', en: 'wind' },
  leaf: { ar: 'ورقة شجر', en: 'tree leaf' },
  rain: { ar: 'المطر', en: 'rain' },
  crown: { ar: 'تيجانًا', en: 'crowns' },
  boat: { ar: 'قاربًا', en: 'boat' },
  flock: { ar: 'أسراب', en: 'Flocks' },
  autumn: { ar: 'الخريف', en: 'autumn' },
}
function Sentence({ id, text }: { id: string; text: string }) {
  const hit = IN_SENTENCE[id]?.[locale]
  const at = hit ? text.indexOf(hit) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <span className="word__hit">{hit}</span>
      {text.slice(at + hit!.length)}
    </>
  )
}

/**
 * Words from the story. The front of a card is the word and a round piece of the scene where it appears;
 * tapping turns the card over to the author's own sentence (verbatim in Arabic, our draft translation in English).
 */
export function Words({ flipped, onFlip }: { flipped: Set<string>; onFlip: (id: string) => void }) {
  const list = useRef<HTMLUListElement>(null)
  const seen = useInView(list, '0px 0px -25% 0px')
  return (
    <ul ref={list} className={cn('words', seen && flipped.size === 0 && 'is-hinting')}>
      {words.map((w, i) => {
        const on = flipped.has(w.id)
        return (
          <li key={w.id} className="words__cell" style={{ ['--i' as string]: i }}>
            <button type="button" className={cn('word', on && 'is-flipped')} data-word={w.id} aria-pressed={on} onClick={() => onFlip(w.id)}>
              <span className="word__inner">
                <span className="word__face word__front" aria-hidden={on}>
                  <span className="word__pic">
                    <img src={asset(`app/words/${w.id}.webp`)} alt="" width={320} height={320} loading="lazy" decoding="async" draggable={false} />
                  </span>
                  <span className="word__word">{w.word[locale]}</span>
                  <span className="word__turn" aria-hidden>
                    <RotateCw size={17} strokeWidth={2.4} />
                  </span>
                </span>
                <span className="word__face word__back" aria-hidden={!on}>
                  <span className="word__again">{w.word[locale]}</span>
                  <span className="word__quote font-story" lang={locale}>
                    {CUTS[w.id].before && <span className="word__cut">… </span>}
                    <Sentence id={w.id} text={w.quote[locale]} />
                    {CUTS[w.id].after && <span className="word__cut"> …</span>}
                  </span>
                  <span className="word__from">
                    {t.book.page} {num(w.scene + 1)}
                  </span>
                  <span className="word__turn" aria-hidden>
                    <RotateCw size={17} strokeWidth={2.4} />
                  </span>
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
