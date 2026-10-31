import { useRef } from 'react'
import { site } from '@/content/loadBooks'
import { useReveal } from '@/app/useReveal'
import { Section, Eyebrow, Heading } from './Section'

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  return (
    <Section id="how" ref={ref} className="bg-paper py-24 lg:py-32">
      <div className="max-w-[60ch]" data-reveal>
        <Eyebrow>How it works</Eyebrow>
        <Heading>{site.howItWorks.heading}</Heading>
        <p className="mt-5 text-lg leading-relaxed text-body">{site.howItWorks.sub}</p>
      </div>
      <ol className="mt-14 grid gap-10 md:grid-cols-3 lg:mt-20">
        {site.howItWorks.steps.map((s, i) => (
          <li key={s.title} data-reveal className="relative border-t border-ink/15 pt-6">
            <span className="font-accent text-4xl italic text-moss">0{i + 1}</span>
            <h3 className="mt-3 text-xl font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-body">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
