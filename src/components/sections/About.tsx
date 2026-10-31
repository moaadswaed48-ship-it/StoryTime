import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { site } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { useReveal } from '@/app/useReveal'
import { Section, Eyebrow, Heading } from './Section'

export function About() {
  const ref = useRef<HTMLElement>(null)
  const tier = useSiteStore((s) => s.tier)
  useReveal(ref)
  useGSAP(
    () => {
      if (tier === 'reduced') return
      gsap.fromTo('.about-art', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 } })
    },
    { scope: ref, dependencies: [tier] },
  )
  return (
    <Section id="about" ref={ref} className="bg-haze py-24 lg:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-5" data-reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-paper-deep">
            <img src="/hero/hero-1280.jpg" alt="" className="about-art absolute inset-0 h-[120%] w-full object-cover object-[80%_40%]" loading="lazy" decoding="async" width="1280" height="827" />
          </div>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7" data-reveal>
          <Eyebrow>About</Eyebrow>
          <Heading>{site.about.heading}</Heading>
          {site.about.paragraphs.map((p, i) => (
            <p key={i} className="mt-5 max-w-[60ch] text-lg leading-relaxed text-body">
              {p}
            </p>
          ))}
          <p className="mt-6 font-accent text-2xl italic text-ink-soft">{site.about.signature}</p>
        </div>
      </div>
    </Section>
  )
}
