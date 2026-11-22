import { memo, type CSSProperties, type ReactNode } from 'react'
import { dirOf, type Lang } from '@/i18n/config'
import type { ZoneLayout } from '@/reader/zone'
import { INK, PAPER, TEXT_WEIGHT, washStyle } from './paint'

/**
 * One page as real DOM: the picture filling the page, the paper wash, and the words over it as selectable text that
 * a screen reader reads. Each word is its own span so the read-along can mark the word being said. The lines are
 * the ones the layout computed, so they match the painted page used while turning.
 */
export type PageModel =
  | { kind: 'story'; pageNo: number; text: string; picture: string | null; layout: ZoneLayout }
  | { kind: 'title'; title: string; credit: string; picture: string | null }
  | { kind: 'end' }
  | { kind: 'blank' }

type Box = { left: number; top: number; width: number; height: number }

export const PageView = memo(function PageView({ page, box, lang, activeWord, end, onImageError, hidden }: {
  page: PageModel
  box: Box
  lang: Lang
  /** Index of the word being read on this page, or -1. */
  activeWord: number
  /** The end page's content (buttons), drawn by the reader. */
  end?: ReactNode
  onImageError?: (url: string) => void
  hidden?: boolean
}) {
  const dir = dirOf(lang)
  const common = 'absolute overflow-hidden'
  const style = { ...box, background: PAPER, color: INK, visibility: hidden ? 'hidden' : undefined } as CSSProperties
  if (page.kind === 'blank') return <div className={common} style={style} aria-hidden="true" />
  if (page.kind === 'end') {
    return (
      <div className={`${common} pointer-events-auto flex flex-col items-center justify-start gap-6 px-6 pt-[22%] text-center`} style={style} dir={dir} data-testid="end-page">
        {end}
      </div>
    )
  }
  if (page.kind === 'title') {
    return (
      <div className={common} style={style} dir={dir} data-testid="title-page">
        {page.picture && <img src={page.picture} alt="" draggable={false} className="absolute inset-0 size-full object-cover opacity-[0.22]" />}
        <div className="absolute inset-x-[10%] top-[42%] flex -translate-y-1/2 flex-col items-center gap-3 text-center">
          <h2 className="leading-tight font-semibold" lang={lang} style={{ fontSize: Math.round(Math.min(44, Math.max(26, box.width * 0.075))) }}>{page.title}</h2>
          <p className="text-ink/70">{page.credit}</p>
        </div>
      </div>
    )
  }
  const l = page.layout
  let k = 0
  return (
    <div className={common} style={style} data-page-no={page.pageNo}>
      {page.picture && <img src={page.picture} alt="" draggable={false} className="absolute inset-0 size-full object-cover" onError={() => onImageError?.(page.picture!)} />}
      <div aria-hidden="true" className="absolute" style={washStyle(l)} />
      <div
        className="pointer-events-auto absolute select-text"
        style={{ left: l.box.x, top: l.box.y, width: l.box.w, height: l.box.h, padding: `${l.padY}px ${l.padX}px`, overflowY: l.overflow ? 'auto' : 'visible' }}
        lang={lang}
        dir={dir}
        data-testid="page-text"
        data-font-size={l.fontSize}
        data-min-font={l.minFont}
      >
        <p style={{ fontSize: l.fontSize, lineHeight: `${l.lineHeight}px`, fontWeight: TEXT_WEIGHT }}>
          {l.lines.map((line, li) => (
            <span key={li} className="block whitespace-nowrap">
              {line.split(' ').map((word, wi, all) => {
                const index = k++
                return (
                  <span key={wi}>
                    <span data-w={index} className={`rounded-[0.3em] [box-decoration-break:clone] transition-colors duration-150 motion-reduce:transition-none ${index === activeWord ? 'bg-[#ffd98a]' : ''}`}>{word}</span>
                    {wi < all.length - 1 ? ' ' : ''}
                  </span>
                )
              })}
              {li < l.lines.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
})
