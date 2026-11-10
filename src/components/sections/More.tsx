import { useRef, useState } from 'react'
import { Languages, Sparkles, Users, ShieldCheck, BookA, School, Check, X } from 'lucide-react'
import { t } from '@/i18n/copy'
import { useReveal } from '@/app/useReveal'
import { useSiteStore } from '@/store/useSiteStore'
import { sfx } from '@/audio/synth'
import { asset } from '@/lib/asset'
import { story } from '@/content/story'
import { MotionToggle } from '@/components/chrome/MotionToggle'
import { Section, Heading } from './Section'

const ICONS = [BookA, Sparkles, Users, ShieldCheck, Languages, School]

export function Learn() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  return (
    <Section id="learn" ref={ref} className="bg-gradient-to-b from-[#8a5a8c] to-[#3d3a6b] py-20 text-white lg:py-28">
      <div className="max-w-[60ch]" data-reveal>
        <p className="text-sm font-semibold text-[#ffd98a]">{t.learn.eyebrow}</p>
        <Heading className="font-display !text-white">{t.learn.heading}</Heading>
        <p className="mt-4 text-lg text-white/80">{t.learn.sub}</p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.learn.cards.map((c, i) => {
          const I = ICONS[i]
          return (
            <li key={c.t} data-reveal className="rounded-3xl border border-white/15 bg-white/10 p-6 transition-transform duration-300 hover:-translate-y-1">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd98a] text-[#3d2a5b]">
                <I size={22} aria-hidden />
              </span>
              <h3 className="mt-4 text-xl font-bold">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-white/80">{c.s}</p>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

export function Plans() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  const setLoginOpen = useSiteStore((s) => s.setLoginOpen)
  return (
    <Section id="plans" ref={ref} className="bg-gradient-to-b from-[#3d3a6b] to-[#232a52] py-20 text-white lg:py-28">
      <div className="max-w-[60ch]" data-reveal>
        <p className="text-sm font-semibold text-[#ffd98a]">{t.plans.eyebrow}</p>
        <Heading className="font-display !text-white">{t.plans.heading}</Heading>
        <p className="mt-4 text-lg text-white/80">{t.plans.sub}</p>
      </div>
      <ul className="mt-10 grid gap-5 lg:grid-cols-3">
        {t.plans.tiers.map((p) => (
          <li key={p.t} data-reveal className={`flex flex-col rounded-3xl p-7 ${'hot' in p && p.hot ? 'bg-[#fff8ea] text-ink shadow-[0_24px_60px_rgba(0,0,0,.35)] lg:-translate-y-3' : 'border border-white/15 bg-white/10'}`}>
            <h3 className="text-2xl font-bold">{p.t}</h3>
            <p className={`mt-1 text-sm font-semibold ${'hot' in p && p.hot ? 'text-[#b4541a]' : 'text-[#ffd98a]'}`}>{p.p}</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {p.f.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={18} className="mt-1 shrink-0 text-[#e2711d]" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setLoginOpen(true)} className={`mt-7 h-12 rounded-full text-sm font-bold ${'hot' in p && p.hot ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
              {t.plans.cta}
            </button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function Author() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  return (
    <Section id="author" ref={ref} className="bg-[#232a52] py-20 text-white lg:py-24">
      <div className="mx-auto grid max-w-[1000px] items-center gap-8 rounded-[32px] border border-white/15 bg-white/10 p-7 md:grid-cols-[220px_1fr] lg:p-10" data-reveal>
        <img src={asset(story.cover)} alt="" className="mx-auto w-[200px] rotate-[-3deg] rounded-xl shadow-2xl" loading="lazy" />
        <div>
          <p className="text-sm font-semibold text-[#ffd98a]">{t.author.eyebrow}</p>
          <h2 className="font-display mt-2 text-[clamp(1.8rem,3.4vw,2.8rem)] font-bold leading-tight">{t.author.heading}</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/85">{t.author.text}</p>
          <p className="font-display mt-5 text-xl text-[#ffd98a]">— {t.author.name}</p>
        </div>
      </div>
    </Section>
  )
}

export function Goodnight() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#232a52] to-[#0d1230] px-5 pb-10 pt-24 text-center text-white">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 12% 22%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 28% 62%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 46% 18%, #ffe9b0 50%, transparent 51%), radial-gradient(1px 1px at 63% 48%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 78% 26%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 90% 66%, #ffe9b0 50%, transparent 51%), radial-gradient(1px 1px at 36% 82%, #fff 50%, transparent 51%)' }} />
      <div className="relative mx-auto h-24 w-24 rounded-full bg-[#ffe9b0] shadow-[0_0_80px_20px_rgba(255,233,176,.35)]" aria-hidden style={{ animation: 'float-y 4s ease-in-out infinite alternate' }}>
        <div className="absolute -top-1 h-24 w-24 rounded-full bg-[#1a2046] ltr:left-7 rtl:right-7" />
      </div>
      <h2 className="font-display relative mt-8 text-[clamp(2.2rem,6vw,4.5rem)] font-bold">{t.night.heading}</h2>
      <p className="relative mt-3 text-lg text-white/75">{t.night.sub}</p>
      <div className="relative mt-10 flex flex-col items-center gap-3 text-sm text-white/55">
        <MotionToggle />
        <p>{t.night.legal}</p>
      </div>
    </footer>
  )
}

/** Demo login: prefilled fake credentials, nothing is sent anywhere. */
export function DemoLogin() {
  const open = useSiteStore((s) => s.loginOpen)
  const setOpen = useSiteStore((s) => s.setLoginOpen)
  const setLoggedIn = useSiteStore((s) => s.setLoggedIn)
  const openReader = useSiteStore((s) => s.openReader)
  const [ok, setOk] = useState(false)
  if (!open) return null
  const close = () => {
    setOpen(false)
    setOk(false)
  }
  return (
    <div className="overlay-in fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5" role="dialog" aria-modal="true" aria-label={t.login.title} onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <form
        className="relative w-full max-w-sm rounded-3xl bg-[#fff8ea] p-7 text-ink shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault()
          setLoggedIn(true)
          setOk(true)
          sfx.win()
        }}
      >
        <button type="button" onClick={close} className="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5" aria-label={t.reader.close}>
          <X size={18} aria-hidden />
        </button>
        <h2 className="font-display text-2xl font-bold">{t.login.title}</h2>
        <p className="mt-1 text-xs font-semibold text-[#b4541a]">{t.login.demo}</p>
        {ok ? (
          <div className="mt-6 text-center">
            <p className="text-lg font-bold">{t.login.welcome}</p>
            <button type="button" className="mt-5 h-12 w-full rounded-full bg-ink text-sm font-bold text-white" onClick={() => (close(), openReader('read', 0))}>
              {t.stage.read}
            </button>
          </div>
        ) : (
          <>
            <label className="mt-5 block text-sm font-semibold">
              {t.login.email}
              <input readOnly dir="ltr" value="demo@storytime.example" className="mt-1 h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-start" />
            </label>
            <label className="mt-3 block text-sm font-semibold">
              {t.login.pass}
              <input readOnly dir="ltr" value="123456" className="mt-1 h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-start" />
            </label>
            <button type="submit" className="mt-6 h-12 w-full rounded-full bg-ink text-sm font-bold text-white" data-testid="login-submit">
              {t.login.submit}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
