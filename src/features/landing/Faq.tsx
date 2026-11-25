/**
 * The questions and answers, shared by the landing page and the Help page. Every question is a real button
 * (<summary>); the answers are in the HTML for search and screen readers.
 */
export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <details key={item.q} className="group rounded-control border border-line bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-ink text-lg leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
          </summary>
          <p className="px-4 pb-4"><Ranges text={item.a} /></p>
        </details>
      ))}
    </div>
  )
}

/** Keeps an age range such as "2–3" on one line, so a phone never breaks it after the dash. */
export function Ranges({ text }: { text: string }) {
  return <>{text.split(/(\d+–\d+)/).map((part, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part))}</>
}
