import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Check } from 'lucide-react'
import type { LeavesHandle } from '@/design/Leaves'
import { Container, Eyebrow } from '@/design/ui'
import { cn } from '@/lib/cn'
import { exposeQA } from '@/lib/qa'
import { sfx } from '@/audio/synth'
import { story } from '@/content/story'
import { locale, num } from '@/i18n/locale'
import { t } from '@/i18n/copy'
import { useSiteStore } from '@/store/useSiteStore'
import { leavesOf, progressOf, useProfileStore, type Activity } from '@/store/useProfileStore'
import { KINDS, LEAF_TONE } from './art'
import { DOOR_ICON, Maple, Scene, type Flags } from './Scene'
import { readSeen, writeSeen } from './seen'
import { strings } from './strings'
import './tree.css'

const key = (what: Activity | 'all') => `${story.id}:${what}`
const flags = (fn: (k: Activity) => boolean): Flags => ({ read: fn('read'), watched: fn('watched'), played: fn('played') })
const same = (a: Flags, b: Flags) => KINDS.every((k) => a[k] === b[k])
const reducedNow = () => document.documentElement.hasAttribute('data-reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Each leaf opens its own door: the book where the child left it, the film, the game. */
function openDoor(kind: Activity) {
  const site = useSiteStore.getState()
  if (kind === 'read') site.openBook(progressOf(story.id).scene)
  else if (kind === 'watched') site.openFilm(0)
  else site.openGame()
}

/**
 * "My tree": the reward that brings a child back, taken from the story. A bare autumn tree gains a leaf for each
 * thing finished (read, watched, played). Each leaf falls into place the first time it is seen; with all three,
 * the migrating birds cross the sky and Sari stands by the tree in a crown of leaves.
 */
export function MyTree() {
  const progress = useProfileStore((s) => s.progress[story.id])
  const overlay = useSiteStore((s) => s.overlay)
  const reduced = useSiteStore((s) => s.tier === 'reduced')
  const real = useMemo(() => flags((k) => !!progress?.[k]), [progress])

  // What the tree shows. It holds still while the book, the film or the game covers it, so a new leaf arrives when the child is looking.
  const [earned, setEarned] = useState(real)
  useEffect(() => {
    if (!overlay) setEarned((prev) => (same(prev, real) ? prev : real))
  }, [overlay, real])
  const count = leavesOf({ ...earned, scene: 0, letters: [] })
  const all = count === 3

  const seen = useRef<Set<string> | null>(null)
  if (!seen.current) seen.current = readSeen()
  const [bloomed, setBloomed] = useState<Flags>(() => flags((k) => earned[k] && seen.current!.has(key(k))))
  const [still] = useState<Flags>(bloomed)
  const [party, setParty] = useState(() => all && seen.current!.has(key('all')))
  const [sari, setSari] = useState<'3d' | 'picture' | null>(null)

  const stage = useRef<HTMLDivElement>(null)
  const leaves = useRef<LeavesHandle>(null)
  const leafEls = useRef<Partial<Record<Activity, HTMLButtonElement | null>>>({})
  const leafRef = useCallback((kind: Activity, el: HTMLButtonElement | null) => void (leafEls.current[kind] = el), [])
  const burstAt = useCallback((el: HTMLElement | null | undefined, n = 12) => {
    const box = stage.current?.getBoundingClientRect()
    const r = el?.getBoundingClientRect()
    if (box && r) leaves.current?.burst(r.left - box.left + r.width / 2, r.top - box.top + r.height / 2, n)
  }, [])

  // Arrivals: every earned leaf the child has not yet watched land falls from the sky, one after the other.
  useLayoutEffect(() => {
    const s = seen.current!
    for (const k of KINDS) if (!earned[k]) s.delete(key(k))
    if (!all) s.delete(key('all'))
    setBloomed((b) => {
      const next = flags((k) => b[k] && earned[k])
      return same(b, next) ? b : next
    })
    if (!all) setParty(false)
    const fresh = KINDS.filter((k) => earned[k] && !s.has(key(k)))
    const freshAll = all && !s.has(key('all'))
    const land = (k: Activity) => {
      s.add(key(k))
      writeSeen(s)
      setBloomed((b) => ({ ...b, [k]: true }))
    }
    const celebrate = () => {
      s.add(key('all'))
      writeSeen(s)
      setParty(true)
    }
    if (!fresh.length && !freshAll) return void writeSeen(s)
    if (reduced || reducedNow()) {
      fresh.forEach(land)
      if (freshAll) celebrate()
      return
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.6 })
      fresh.forEach((k, i) => {
        const el = leafEls.current[k]
        const fly = el?.querySelector<HTMLElement>('.tree-leaf-fly')
        if (!el || !fly) return land(k)
        const at = i * 0.85
        const side = i % 2 ? -1 : 1
        const size = el.offsetWidth
        // It falls the way leaves fall in the film: down, swaying, turning. Only the inner part moves, from its
        // own resting place, so the leaf always lands exactly where it hangs.
        tl.call(() => el.classList.add('is-flying'), [], at)
        tl.fromTo(fly, { y: -5.2 * size }, { y: 0, duration: 1.35, ease: 'power1.in' }, at)
        tl.fromTo(fly, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' }, at)
        tl.fromTo(fly, { x: 0.9 * size * side }, { x: 0, duration: 1.35, ease: 'sine.inOut' }, at)
        tl.fromTo(fly, { rotation: -150 * side }, { rotation: 0, duration: 1.35, ease: 'power2.out' }, at)
        tl.fromTo(fly, { scale: 1.25 }, { scale: 1.25, duration: 1.3, ease: 'none' }, at)
        tl.to(fly, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.45)' }, at + 1.3)
        tl.call(() => (el.classList.remove('is-flying'), land(k), sfx.chime(), burstAt(el, 14)), [], at + 1.33)
      })
      if (freshAll)
        tl.call(
          () => {
            celebrate()
            sfx.win()
            const box = stage.current?.getBoundingClientRect()
            if (box) leaves.current?.burst(box.width / 2, box.height * 0.38, 26)
          },
          [],
          fresh.length ? '+=0.1' : 0.2,
        )
    }, stage)
    return () => {
      ctx.revert()
      for (const k of KINDS) leafEls.current[k]?.classList.remove('is-flying')
    }
  }, [earned, all, reduced, burstAt])

  const onLeaf = useCallback(
    (kind: Activity) => {
      const el = leafEls.current[kind]
      if (!earned[kind]) return openDoor(kind)
      // an earned leaf is a small toy: it rustles
      sfx.pop()
      burstAt(el, 8)
      const fly = el?.querySelector('.tree-leaf-fly')
      if (fly && !reducedNow()) gsap.fromTo(fly, { rotation: -22 }, { rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' })
    },
    [earned, burstAt],
  )

  const letters = useMemo(() => progress?.letters ?? [], [progress])
  useEffect(() => {
    exposeQA({
      tree: {
        leaves: () => leavesOf(useProfileStore.getState().progress[story.id]),
        state: () => ({ earned, bloomed, party, sari, shown: count, letters: [...letters], seen: [...seen.current!] }),
      },
    })
  }, [earned, bloomed, party, sari, count, letters])

  // the counter and the rows tick when a leaf has landed, not before
  const lit = KINDS.filter((k) => bloomed[k])
  const status = party || lit.length === 3 ? t.app.tree.all : lit.length === 0 ? t.app.tree.empty : lit.length === 1 ? strings.one : strings.two
  const firstOpen = KINDS.find((k) => !bloomed[k])
  const verb = (k: Activity) => t.app.story[k === 'read' ? 'read' : k === 'watched' ? 'watch' : 'play'].t

  return (
    <section id="tree" className="relative min-h-[100svh] bg-paper pb-[132px] pt-[84px] text-ink lg:pb-24 lg:pt-[124px]" data-leaves={count} data-party={party}>
      <Container className="max-w-[1180px]">
        <div className="grid gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-y-8">
          <header className="lg:pt-6">
            <Eyebrow tone="light" className="tree-eyebrow">
              {story.title[locale]}
            </Eyebrow>
            <h1 className="t-h2 mt-3 lg:mt-4">{t.app.tree.title}</h1>
            <p className="t-lede mt-2 max-w-[26rem] text-balance text-ink-2/80 lg:mt-4">{t.app.tree.sub}</p>
          </header>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Scene ref={stage} earned={earned} bloomed={bloomed} still={still} party={party} count={count} leafRef={leafRef} onLeaf={onLeaf} onSari={setSari} leaves={leaves}>
              <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-4 sm:top-4">
                <p key={status} className="view-in min-w-0 text-balance ps-1 pt-1 text-[16px] font-bold leading-snug text-white [text-shadow:0_1px_12px_rgba(70,25,30,.6)] sm:text-[20px]" data-tree-status>
                  {status}
                </p>
                {/* how many leaves, as leaves: the pips fill from the start side as each leaf lands */}
                <div className="glass flex h-11 flex-none items-center gap-1.5 rounded-full px-3.5 text-white" data-tree-count={lit.length} role="img" aria-label={`${t.app.home.leaves}: ${num(lit.length)} ${t.book.of} ${num(3)}`}>
                  {KINDS.map((k, i) => (
                    <Maple key={k} kind={lit[i] ?? k} on={i < lit.length} className="h-[22px] w-[22px]" />
                  ))}
                  {lit.length > 0 && (
                    <span className="ms-1 whitespace-nowrap text-[14px] font-semibold tabular-nums" aria-hidden>
                      {num(lit.length)} {t.book.of} {num(3)}
                    </span>
                  )}
                </div>
              </div>
              {party && (
                <p className="glass view-in absolute bottom-3 end-3 z-10 rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold text-white sm:bottom-4 sm:end-4" data-tree-crown>
                  {t.app.tree.crown}
                </p>
              )}
            </Scene>
          </div>

          <div className="lg:col-start-1">
            <ul className="grid gap-3">
              {KINDS.map((k) => {
                const on = bloomed[k]
                const Icon = DOOR_ICON[k]
                return (
                  <li key={k}>
                    <button
                      type="button"
                      onClick={() => openDoor(k)}
                      data-row={k}
                      data-on={on}
                      className={cn(
                        'group flex min-h-[84px] w-full items-center gap-3.5 rounded-[26px] py-3 pe-3 ps-4 text-start transition-[scale,background-color,box-shadow] duration-200 ease-out active:scale-[0.985]',
                        on ? 'bg-white/75 shadow-soft hover:bg-white' : 'bg-white/40 shadow-[0_0_0_1px_rgba(26,18,11,.09)] hover:bg-white/70',
                      )}
                    >
                      <span className={cn('shrink-0', !on && 'opacity-70')} style={on ? undefined : { color: LEAF_TONE[k].b }}>
                        <Maple kind={k} on={on} className="h-12 w-12" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-bold leading-tight sm:text-[17px]">{t.app.tree[k]}</span>
                        <span className={cn('mt-1 flex items-center gap-1.5 text-[14px]', on ? 'font-semibold text-[#b9450f]' : 'text-ink-2/70')}>
                          {on && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
                          {on ? t.app.story.done : t.app.tree.go}
                        </span>
                      </span>
                      {on ? (
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-ink/15 text-ink-2 transition-colors group-hover:bg-ink group-hover:text-paper" aria-label={verb(k)}>
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full px-5 text-[17px] font-bold transition-colors',
                            k === firstOpen ? 'bg-ink text-paper group-hover:bg-ink-2' : 'border border-ink/25 text-ink group-hover:bg-ink/5',
                          )}
                        >
                          <Icon className="h-6 w-6" aria-hidden />
                          {verb(k)}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Only the yard game (?game=yard) teaches letters; Friends Island does not, so the panel shows only when there are some. */}
            {letters.length > 0 && <div className="mt-8 lg:mt-10" data-tree-letters>
              <h2 className="t-h3">{t.app.tree.letters}</h2>
              {letters.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {letters.map((l, i) => (
                    <span key={l} className="tree-tile grid h-16 w-16 place-items-center rounded-[18px] bg-white text-[30px] font-extrabold text-ink" style={{ '--tilt': ((i * 37) % 9) - 4, '--edge': LEAF_TONE[KINDS[i % 3]].a } as React.CSSProperties} data-letter={l}>
                      {l}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[16px] leading-relaxed text-muted" data-tree-letters-empty>
                  {strings.lettersEmpty}
                </p>
              )}
            </div>}
          </div>
        </div>
      </Container>
    </section>
  )
}
