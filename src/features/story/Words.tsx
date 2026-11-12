import { RotateCw } from 'lucide-react'
import { words } from '@/content/learning'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/cn'

/**
 * Words from the story. The front of a card is the word and a round piece of the scene where it appears;
 * tapping turns the card over to the author's own sentence (verbatim in Arabic, our draft translation in English).
 */
export function Words({ flipped, onFlip }: { flipped: Set<string>; onFlip: (id: string) => void }) {
  return (
    <ul className="words">
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
                    <RotateCw size={14} strokeWidth={2.4} />
                  </span>
                </span>
                <span className="word__face word__back" aria-hidden={!on}>
                  <span className="word__again">{w.word[locale]}</span>
                  <span className="word__quote font-story" lang={locale}>
                    {w.quote[locale]}
                  </span>
                  <span className="word__from">
                    {t.book.page} {num(w.scene + 1)}
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
