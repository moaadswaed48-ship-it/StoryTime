import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, MessageCircle, X } from 'lucide-react'
import { bookById, books, matchesFilter, site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { formatPrice } from '@/lib/formatPrice'
import { CoverImage } from '@/components/ui/CoverImage'
import { LinkButton } from '@/components/ui/Button'
import { whatsappHref } from '@/components/sections/Order'
import { cn } from '@/lib/cn'

/** Native <dialog> that opens whenever a book becomes active (from the 3D shelf, the DOM rack, cards or a deep link). */
export function BookPreviewDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const activeId = useSiteStore((s) => s.shelf.activeId)
  const filter = useSiteStore((s) => s.shelf.filter)
  const closeBook = useSiteStore((s) => s.closeBook)
  const openBook = useSiteStore((s) => s.openBook)
  const returnEl = useSiteStore((s) => s.returnFocusEl)
  const lenis = useSiteStore((s) => s.lenis)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const book = activeId ? bookById.get(activeId) : undefined
  const visible = books.filter((b) => matchesFilter(b, filter))
  const pos = book ? visible.findIndex((b) => b.id === book.id) : -1

  // open / close follow the store
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (activeId && !d.open) {
      setExpanded(false)
      d.showModal()
      lenis?.stop()
      history.replaceState(null, '', `#book=${activeId}`)
    } else if (!activeId && d.open) d.close()
  }, [activeId, lenis])

  // deep links: on load and whenever the hash changes while the page is open
  useEffect(() => {
    const fromHash = () => {
      const m = location.hash.match(/#book=([a-z0-9-]+)/)
      if (m && bookById.has(m[1]) && useSiteStore.getState().shelf.activeId !== m[1]) openBook(m[1])
    }
    const t = setTimeout(fromHash, 600)
    window.addEventListener('hashchange', fromHash)
    return () => {
      clearTimeout(t)
      window.removeEventListener('hashchange', fromHash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onClose = () => {
    lenis?.start()
    if (location.hash.startsWith('#book=')) history.replaceState(null, '', location.pathname + location.search)
    closeBook()
    const el = returnEl ?? document.querySelector<HTMLElement>('.shelf-wrap')
    el?.focus({ preventScroll: true })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#book=${book?.id}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }

  const paras = book ? book.firstPage.text.split(/\n\n+/) : []
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      aria-labelledby="pv-title"
      className={cn(
        'm-0 w-full max-w-none border-0 bg-transparent p-0 text-ink backdrop:bg-transparent',
        'fixed inset-x-0 bottom-0 top-auto max-h-[86svh] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:max-h-none lg:w-[min(520px,46vw)]',
      )}
    >
      {book && (
        <div className="flex max-h-[86svh] flex-col rounded-t-[28px] bg-paper shadow-[0_-10px_60px_rgba(16,20,24,.25)] lg:h-full lg:max-h-none lg:rounded-none lg:rounded-l-[28px]">
          <div className="flex items-start gap-4 px-6 pt-6 lg:px-8 lg:pt-8">
            <CoverImage book={book} className="w-[72px] shrink-0" eager />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-moss">
                Ages {book.ageRange[0]}–{book.ageRange[1]} · {book.pages} pages · {book.readingTime}
              </p>
              <h2 id="pv-title" className="mt-1 text-2xl font-semibold leading-tight tracking-[-0.02em]">
                {book.title}
              </h2>
              <p className="text-body">
                {book.author}
                {book.illustrator ? ` · illustrated by ${book.illustrator}` : ''}
              </p>
              <p className="mt-1 text-lg font-semibold">{formatPrice(book.price.amount)}</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} autoFocus className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink" aria-label={site.dialog.close}>
              <X size={20} aria-hidden />
            </button>
          </div>
          <article className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-5 lg:px-8" data-lenis-prevent>
            <h3 className="font-accent text-2xl italic text-ink-soft">{book.firstPage.heading}</h3>
            <div className="mt-3 space-y-4 text-[17px] leading-[1.75] text-ink-soft">
              {(expanded ? paras : paras.slice(0, 1)).map((p, i) => (
                <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-accent first-letter:text-[3em] first-letter:leading-[0.85] first-letter:text-ink' : ''}>
                  {p}
                </p>
              ))}
            </div>
            {!expanded && paras.length > 1 && (
              <button type="button" onClick={() => setExpanded(true)} className="mt-4 text-sm font-semibold text-moss underline-offset-4 hover:underline">
                {site.dialog.readMore} →
              </button>
            )}
          </article>
          <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 px-6 py-4 lg:px-8">
            <LinkButton href={whatsappHref(book.title)} target="_blank" rel="noopener" className="h-12 px-6">
              <MessageCircle size={18} aria-hidden /> {site.dialog.order}
            </LinkButton>
            <button type="button" onClick={copy} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft" aria-live="polite">
              <Copy size={16} aria-hidden /> {copied ? 'Link copied' : site.order.copy}
            </button>
            <span className="ml-auto inline-flex gap-1">
              <button type="button" disabled={pos <= 0} onClick={() => openBook(visible[pos - 1].id)} aria-label={site.dialog.prev} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white disabled:opacity-30">
                <ChevronLeft size={20} aria-hidden />
              </button>
              <button type="button" disabled={pos < 0 || pos >= visible.length - 1} onClick={() => openBook(visible[pos + 1].id)} aria-label={site.dialog.next} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white disabled:opacity-30">
                <ChevronRight size={20} aria-hidden />
              </button>
            </span>
          </div>
        </div>
      )}
    </dialog>
  )
}
