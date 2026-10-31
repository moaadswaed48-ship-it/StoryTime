import { useRef, useState } from 'react'
import { Copy, Mail, MessageCircle } from 'lucide-react'
import { site, bookById } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { useReveal } from '@/app/useReveal'
import { Section, Eyebrow, Heading } from './Section'
import { LinkButton } from '@/components/ui/Button'

export function whatsappHref(title?: string) {
  const text = site.order.whatsapp.message.replace('{title}', title ?? 'a book')
  const num = site.order.whatsapp.number.replace(/\D/g, '')
  return num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : `mailto:${site.order.email}?subject=${encodeURIComponent(text)}`
}

export function Order() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const activeId = useSiteStore((s) => s.shelf.activeId)
  const [copied, setCopied] = useState(false)
  const active = activeId ? bookById.get(activeId) : undefined
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#book=${active?.id ?? ''}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <Section id="order" ref={ref} className="bg-paper py-24 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6" data-reveal>
          <Eyebrow>Order</Eyebrow>
          <Heading>{site.order.heading}</Heading>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-body">{site.order.sub}</p>
          <p className="mt-4 max-w-[56ch] text-[15px] text-body">{site.order.note}</p>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-6 lg:items-start lg:pt-10" data-reveal>
          <LinkButton href={whatsappHref(active?.title)} target="_blank" rel="noopener">
            <MessageCircle size={18} aria-hidden /> {site.dialog.order}
          </LinkButton>
          <a href={`mailto:${site.order.email}`} className="inline-flex items-center gap-2 text-ink underline-offset-4 hover:underline">
            <Mail size={18} aria-hidden /> {site.order.email}
          </a>
          <button type="button" onClick={copy} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft" aria-live="polite">
            <Copy size={16} aria-hidden /> {copied ? 'Link copied' : site.order.copy}
          </button>
        </div>
      </div>
    </Section>
  )
}
