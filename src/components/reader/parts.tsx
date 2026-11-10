import { useState, type ReactNode } from 'react'
import { locale } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import { story, spreadText, type Spread } from '@/content/story'
import { asset } from '@/lib/asset'
import { sfx } from '@/audio/synth'

const LEAF_COLORS = ['#e2711d', '#f4a72c', '#c8421f', '#f2c14e']
function LeafSvg({ c, s }: { c: string; s: string }) {
  return (
    <svg style={{ width: s, height: 'auto' }} viewBox="0 0 40 60" aria-hidden>
      <path d="M20 2 C38 14 34 38 20 46 C6 38 2 14 20 2Z" fill={c} />
      <path d="M20 8 V58" stroke="#7a3b10" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 20 L29 14 M20 28 L11 22 M20 34 L28 29" stroke="#7a3b10" strokeWidth="1.2" opacity=".6" />
    </svg>
  )
}
function CardSvg({ ch, s }: { ch: string; s: string }) {
  return (
    <svg style={{ width: s, height: 'auto' }} viewBox="0 0 40 50" aria-hidden>
      <rect x="2" y="2" width="36" height="46" rx="5" fill="#fffdf6" stroke="#d9c9a8" strokeWidth="1.5" />
      <text x="20" y="34" textAnchor="middle" fontSize="24" fontWeight="700" fill="#b4541a" fontFamily="'Noto Naskh Arabic', Georgia, serif">{ch}</text>
    </svg>
  )
}
function BirdsSvg({ s }: { s: string }) {
  const pts = [[50, 12], [38, 22], [62, 22], [26, 32], [74, 32], [14, 42], [86, 42]]
  return (
    <svg style={{ width: s, height: 'auto' }} viewBox="0 0 100 55" aria-hidden>
      {pts.map(([x, y], i) => (
        <path key={i} d={`M${x - 6} ${y + 3} Q${x - 3} ${y - 3} ${x} ${y + 1} Q${x + 3} ${y - 3} ${x + 6} ${y + 3}`} fill="none" stroke="#4a3a35" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  )
}

const CARDS = locale === 'ar' ? ['ح', 'أ', 'س', 'د'] : ['H', 'A', 'S', 'D']
/** Paper pieces that stand up out of the page when it becomes the active one. */
export function Popups({ index }: { index: number }) {
  const kind = index >= 1 && index <= 4 ? 'cards' : index === 11 ? 'birds' : 'leaves'
  const slots = [6, 24, 44, 66, 84]
  return (
    <>
      {kind === 'birds' && (
        <div className="popup" style={{ insetInlineStart: '22%', bottom: '70%', transitionDelay: '0.35s' }}>
          <BirdsSvg s="34cqw" />
        </div>
      )}
      {slots.map((x, i) => (
        <div key={i} className="popup" style={{ left: `${x}%`, transitionDelay: `${0.25 + i * 0.09}s` }}>
          {kind === 'cards' && i % 2 === 1 ? <CardSvg ch={CARDS[(i + index) % CARDS.length]} s={`${10 + (i % 3) * 1.5}cqw`} /> : <LeafSvg c={LEAF_COLORS[(i + index) % 4]} s={`${8 + ((i * 7 + index) % 4) * 1.6}cqw`} />}
        </div>
      ))}
    </>
  )
}

export function Art({ s, index, active, onBurst }: { s: Spread; index: number; active: boolean; onBurst?: (e: React.PointerEvent) => void }) {
  return (
    <div className={`relative h-full w-full overflow-hidden [container-type:inline-size] ${active ? 'is-active' : ''}`} onPointerDown={onBurst}>
      <img src={asset(s.img)} alt="" className="h-full w-full object-cover" draggable={false} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" />
      <Popups index={index} />
    </div>
  )
}

export function Words({ s, small }: { s: Spread; small?: boolean }) {
  const [on, setOn] = useState<string | null>(null)
  return (
    <div className={`story-text font-story font-medium text-[#3a2a1c] ${small ? 'text-[9px] leading-[1.75] lg:text-[11.5px]' : 'text-[clamp(16px,2.75vmin,27px)] leading-[1.95]'}`} lang={locale}>
      {spreadText(s, locale).map((p, pi) => (
        <p key={pi}>
          {p.split(' ').map((w, wi) => {
            const k = `${pi}-${wi}`
            return (
              <span key={k}>
                <span
                  className={`w ${on === k ? 'on' : ''}`}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setOn(k)
                    sfx.pop()
                  }}
                >
                  {w}
                </span>{' '}
              </span>
            )
          })}
        </p>
      ))}
      {t.reader.draft && <p className="mt-2 font-sans text-[11px] text-[#9a8a70]">{t.reader.draft}</p>}
    </div>
  )
}

export function CoverFace({ small }: { small?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f3d9a4]">
      <img src={asset(story.cover)} alt="" className="h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-[#fff4d8]/95 via-[#fff4d8]/70 to-transparent px-[7%] pb-[14%] pt-[7%] text-center">
        <p className={`font-semibold text-[#a4521a] ${small ? 'text-[10px]' : 'text-[clamp(11px,1.6vmin,16px)]'}`}>{story.kicker[locale]}</p>
        <h3 className={`font-display mt-1 font-bold leading-[1.35] text-[#5b2a0c] ${small ? 'text-[17px]' : 'text-[clamp(20px,3.6vmin,40px)]'}`}>{story.title[locale]}</h3>
      </div>
      <p className={`absolute inset-x-0 bottom-[4%] text-center font-semibold text-white drop-shadow ${small ? 'text-[9px]' : 'text-[clamp(10px,1.4vmin,14px)]'}`}>{t.brand}</p>
    </div>
  )
}

export function PaperPage({ children, n }: { children: ReactNode; n?: number }) {
  return (
    <div className="paper flex h-full w-full flex-col px-[8%] py-[7%]">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
        {children}
      </div>
      {n !== undefined && <p className="pt-2 text-center text-xs text-[#a8967a]">{n}</p>}
    </div>
  )
}
