import { site } from '@/content/loadBooks'
import { MotionToggle } from '@/components/chrome/MotionToggle'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-ink/10 bg-paper py-12">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 lg:flex-row lg:items-start lg:justify-between lg:px-12">
        <div>
          <p className="text-lg font-bold tracking-[-0.02em] text-ink">{site.brand.name}</p>
          <p className="mt-1 text-sm text-body">{site.brand.tagline}</p>
          <p className="mt-4 max-w-[52ch] text-xs text-body">{site.footer.legal}</p>
        </div>
        <ul className="flex flex-col gap-1 text-xs text-body" aria-label="Credits">
          {site.footer.credits.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <MotionToggle />
      </div>
    </footer>
  )
}
