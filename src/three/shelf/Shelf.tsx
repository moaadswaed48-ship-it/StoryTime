import { useEffect, useMemo, useRef } from 'react'
import { asset } from '@/lib/asset'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { easing } from 'maath'
import { books as catalog, matchesFilter } from '@/content/loadBooks'
import { useSiteStore } from '@/store/useSiteStore'
import { mulberry32 } from '@/lib/seeded'
import { clamp } from '@/lib/clamp'
import { exposeQA } from '@/three/shared/qa'
import { makeBlockGeometry, makeBoardGeometry, BOOK } from './bookGeometry'
import { BookMesh, type BookHandle } from './Book'
import { makeRailBooks, startLanding, nudge, advance, isSettled, layoutSlots, type RailBook } from './rail'
import type { ShelfBus } from './bus'

type Mode = 'dormant' | 'landing' | 'settling' | 'browsing' | 'dragging' | 'flinging' | 'elevating' | 'preview' | 'lowering'

const FEEL = { K_DECAY: 5, W: 10, BIAS: 0.14, RUBBER: 0.55, V_STOP: 0.02, TAP_PX: 3 }
const _col = new THREE.Color()
const DIM = new THREE.Color('#b9b9b9')
const WHITE = new THREE.Color('#ffffff')
const STAGE = { lift: 0.3, forward: 0.9 }

/** The row of books: landing shuffle → settle → drag/fling/snap/wheel/keys → tap → elevate → cover opens → preview. */
export function Shelf({ bus }: { bus: ShelfBus }) {
  const tier = useSiteStore((s) => s.tier)
  const setPhase = useSiteStore((s) => s.setPhase)
  const setIndex = useSiteStore((s) => s.setIndex)
  const openBook = useSiteStore((s) => s.openBook)
  const requestSpin = useSiteStore((s) => s.requestSpin)
  const filter = useSiteStore((s) => s.shelf.filter)
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera

  const block = useMemo(() => makeBlockGeometry(), [])
  const board = useMemo(() => makeBoardGeometry(), [])
  const normalMap = useTexture(asset('textures/book_hardcover_01_nor_gl_1k.jpg'))
  const groupRef = useRef<THREE.Group>(null)
  const handles = useRef<(BookHandle | null)[]>([])

  const rail = useMemo<RailBook[]>(() => makeRailBooks(catalog.map((b) => b.id), catalog.map(() => BOOK.W), BOOK.PITCH), [])
  const jitter = useMemo(() => {
    const r = mulberry32(2024)
    return catalog.map(() => ({ yaw: (r() - 0.5) * 0.12, lean: -0.14 + (r() - 0.5) * 0.05 }))
  }, [])

  const sim = useRef({
    mode: 'dormant' as Mode,
    acc: 0,
    clock: { t: 0 },
    settledFor: 0,
    landedOnce: false,
    seenEnters: 0,
    seed: 1337,
    gx: 0,
    gTarget: 0,
    gv: 0,
    g0: 0,
    dragId: 0,
    index: 0,
    activeIdx: -1,
    downIdx: -1,
    elevT: 0,
    spinIdx: -1,
    spinFrom: 0,
    spinT: 0,
    wheelQuiet: 0,
    lastActiveId: null as string | null,
    lastSpinId: null as string | null,
    repackUntil: 0,
  })
  const atlasSize = typeof window !== 'undefined' && (window.innerWidth < 768 || window.devicePixelRatio <= 1.5) ? 768 : 1024

  // ---------- helpers (sim-space) ----------
  const visibleIdx = () => rail.map((b, i) => (b.hidden ? -1 : i)).filter((i) => i >= 0)
  const slotOf = (i: number) => rail[i].slot
  const gFor = (i: number) => -slotOf(i)
  const bounds = () => {
    const v = visibleIdx()
    if (!v.length) return { min: 0, max: 0 }
    return { min: gFor(v[v.length - 1]), max: gFor(v[0]) }
  }
  const nearestIdx = (g: number) => {
    const v = visibleIdx()
    let best = v[0] ?? 0
    let bd = Infinity
    for (const i of v) {
      const d = Math.abs(gFor(i) - g)
      if (d < bd) {
        bd = d
        best = i
      }
    }
    return best
  }
  const rubber = (g: number) => {
    const { min, max } = bounds()
    if (g > max) return max + Math.log1p((g - max) / FEEL.RUBBER) * FEEL.RUBBER
    if (g < min) return min - Math.log1p((min - g) / FEEL.RUBBER) * FEEL.RUBBER
    return g
  }
  const setMode = (m: Mode) => {
    const s = sim.current
    if (s.mode === m) return
    s.mode = m
    setPhase(m)
  }
  const settleTo = (i: number, v = 0) => {
    const s = sim.current
    s.index = i
    s.gTarget = gFor(i)
    s.gv = v
    setMode('flinging')
    bus.index = i
    setIndex(i)
  }
  const stepBy = (by: number) => {
    const v = visibleIdx()
    if (!v.length) return
    const pos = Math.max(0, v.indexOf(sim.current.index))
    settleTo(v[clamp(pos + by, 0, v.length - 1)])
  }
  const begin = (kind: 'landing' | 'nudge', seed = sim.current.seed) => {
    const s = sim.current
    if (tier === 'reduced' && kind === 'landing') {
      setMode('browsing')
      return
    }
    if (kind === 'landing') startLanding(rail, seed)
    else nudge(rail, seed + s.seenEnters, 0.15)
    s.clock.t = 0
    s.acc = 0
    s.settledFor = 0
    setMode(kind === 'landing' ? 'landing' : 'settling')
  }
  const worldPerPx = () => {
    const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    return (2 * halfH * (size.width / Math.max(1, size.height))) / Math.max(1, size.width)
  }

  // ---------- filters → hidden flags + re-pack ----------
  useEffect(() => {
    const s = sim.current
    let changed = false
    rail.forEach((b, i) => {
      const hidden = !matchesFilter(catalog[i], filter)
      if (hidden !== b.hidden) changed = true
      b.hidden = hidden
    })
    if (!changed) return
    layoutSlots(rail, BOOK.PITCH)
    bus.count = visibleIdx().length
    s.repackUntil = s.clock.t + 0.6
    const v = visibleIdx()
    if (v.length && (!v.includes(s.index) || s.activeIdx < 0)) {
      const first = v.includes(s.index) ? s.index : v[0]
      if (s.mode === 'browsing' || s.mode === 'flinging') settleTo(first)
      else s.index = first
    }
    if (s.mode === 'browsing') setMode('settling')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  useEffect(() => {
    bus.count = visibleIdx().length
    exposeQA({
      shelf: {
        phase: () => sim.current.mode,
        index: () => sim.current.index,
        positions: () => rail.map((b) => [b.x, b.y]),
        groupX: () => sim.current.gx,
        settleNow: () => {
          for (const b of rail) {
            b.x = b.slot; b.v = 0; b.y = 0; b.vy = 0; b.landed = true; b.rotZ = 0; b.tilt = 0
          }
          const s = sim.current
          s.landedOnce = true
          s.gx = s.gTarget = gFor(nearestIdx(s.gx))
          s.gv = 0
          s.index = nearestIdx(s.gx)
          bus.index = s.index
          setIndex(s.index)
          setMode('browsing')
        },
        relaunch: (seed = 1337) => begin('landing', seed),
        open: (id: string) => openBook(id),
        spin: (id: string) => requestSpin(id),
        hidden: () => rail.map((b) => b.hidden),
        stepBy,
        time: () => sim.current.clock.t,
        wpp: () => worldPerPx(),
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- per-frame integrator ----------
  useFrame((_, delta) => {
    const s = sim.current
    const dt = Math.min(delta, 1 / 30)
    const store = useSiteStore.getState()
    const activeId = store.shelf.activeId
    const spinId = store.shelf.spinId
    const wpp = worldPerPx()
    bus.wpp = wpp

    // section entered?
    if (bus.enters !== s.seenEnters) {
      s.seenEnters = bus.enters
      if (!s.landedOnce) {
        s.landedOnce = true
        begin('landing')
      } else if (tier !== 'reduced' && s.mode === 'browsing') begin('nudge')
    }

    // commands from the DOM (keys, buttons, mirror list)
    while (bus.commands.length) {
      const c = bus.commands.shift()!
      if (s.mode === 'landing') continue
      if (c.type === 'step') stepBy(c.by)
      else if (c.type === 'home') settleTo(visibleIdx()[0] ?? 0)
      else if (c.type === 'end') settleTo(visibleIdx().at(-1) ?? 0)
      else if (c.type === 'snapTo') {
        const i = catalog.findIndex((b) => b.id === c.id)
        if (i >= 0 && !rail[i].hidden) settleTo(i)
      } else if (c.type === 'openCentred') openBook(catalog[s.index].id)
    }

    // open / close requests from the store (dialog, hero buttons, mirror list, deep links)
    if (activeId !== s.lastActiveId) {
      s.lastActiveId = activeId
      if (activeId) {
        const i = catalog.findIndex((b) => b.id === activeId)
        if (i >= 0 && !(s.mode === 'landing')) {
          if (rail[i].hidden) store.setFilter({ query: '', ages: null, tags: [] })
          s.activeIdx = i
          s.elevT = 0
          settleTo(i)
          setMode('elevating')
          handles.current[i]?.ensurePage()
        }
      } else if (s.activeIdx >= 0) {
        setMode('lowering')
        s.spinIdx = -1
      }
    }
    // 360° flourish from the hero
    if (spinId !== s.lastSpinId) {
      s.lastSpinId = spinId
      if (spinId) {
        const i = catalog.findIndex((b) => b.id === spinId)
        if (i >= 0 && s.mode !== 'landing') {
          s.spinIdx = i
          s.spinT = 0
          s.spinFrom = handles.current[i]?.group.rotation.y ?? 0
          s.activeIdx = i
          s.elevT = 0
          settleTo(i)
          setMode('elevating')
          handles.current[i]?.ensurePage()
        }
      }
    }

    if (!bus.visible && s.mode !== 'elevating' && s.mode !== 'lowering') return

    // ---- landing / settling (rail sim) ----
    if (s.mode === 'landing' || s.mode === 'settling') {
      s.acc = advance(rail, s.acc, dt, s.clock)
      if (isSettled(rail)) {
        s.settledFor += dt
        if (s.settledFor > 0.3 || s.clock.t > 2.5) {
          setMode('browsing')
          s.index = nearestIdx(s.gx)
          bus.index = s.index
          setIndex(s.index)
        }
      } else s.settledFor = 0
      // pointer-down interrupts settling
      if (s.mode === 'settling' && bus.drag.active) {
        for (const b of rail) {
          b.v = 0; b.vy = 0; b.y = 0; b.landed = true
        }
        setMode('browsing')
      }
    } else if (s.repackUntil > s.clock.t) {
      s.acc = advance(rail, s.acc, dt, s.clock)
    }

    // ---- drag / fling / wheel ----
    const d = bus.drag
    const canBrowse = s.mode === 'browsing' || s.mode === 'flinging' || s.mode === 'dragging'
    if (canBrowse) {
      if (d.active && d.id !== s.dragId) {
        s.dragId = d.id
        s.g0 = s.gx
        s.gv = 0
        setMode('dragging')
      }
      if (s.mode === 'dragging') {
        if (d.active) {
          s.gTarget = rubber(s.g0 + d.dxPx * wpp)
          const prev = s.gx
          s.gx += (s.gTarget - s.gx) * (1 - Math.exp(-40 * dt))
          s.gv = (s.gx - prev) / Math.max(dt, 1e-4)
        } else if (d.released) {
          d.released = false
          const v = d.vxPxMs * 1000 * wpp
          const { min, max } = bounds()
          const landing = clamp(s.gx + v / FEEL.K_DECAY, min, max)
          const cur = nearestIdx(s.gx)
          let target = nearestIdx(landing)
          if (target === cur && Math.abs(v) > 0.6) {
            // bias one slot in the fling direction
            const vis = visibleIdx()
            const pos = vis.indexOf(cur)
            target = vis[clamp(pos + (v > 0 ? -1 : 1), 0, vis.length - 1)]
          }
          settleTo(target, v)
        }
      }
      if (bus.wheelDx) {
        s.gTarget = rubber((s.mode === 'flinging' ? s.gTarget : s.gx) - bus.wheelDx * wpp)
        bus.wheelDx = 0
        s.wheelQuiet = 0.14
        s.gv = 0
        setMode('flinging')
        s.index = nearestIdx(s.gTarget)
      } else if (s.wheelQuiet > 0) {
        s.wheelQuiet -= dt
        if (s.wheelQuiet <= 0) settleTo(nearestIdx(s.gTarget))
      }
      if (s.mode === 'flinging') {
        const W = FEEL.W
        s.gv += (-(W * W) * (s.gx - s.gTarget) - 2 * W * s.gv) * dt
        s.gx += s.gv * dt
        if (Math.abs(s.gv) < FEEL.V_STOP && Math.abs(s.gx - s.gTarget) < 1e-3 && s.wheelQuiet <= 0) {
          s.gx = s.gTarget
          s.gv = 0
          setMode('browsing')
        }
      }
    }

    // ---- elevate / preview / lower ----
    if (s.mode === 'elevating' || s.mode === 'preview') {
      // keep the row centred on the active book (shifted left on desktop where the sheet covers the right)
      const W = FEEL.W
      const target = s.gTarget + bus.focusShiftPx * wpp
      s.gv += (-(W * W) * (s.gx - target) - 2 * W * s.gv) * dt
      s.gx += s.gv * dt
      s.elevT += dt
      if (s.mode === 'elevating' && s.elevT > 0.25) setMode('preview')
    }
    if (s.mode === 'lowering') {
      s.elevT += dt
      if (s.elevT > 0.5) {
        s.activeIdx = -1
        s.spinIdx = -1
        if (s.lastSpinId) requestSpin(null)
        setMode('browsing')
      }
    }
    if (s.mode === 'lowering' && s.elevT < 0.01) s.elevT = 0.01

    // ---- write sim → scene ----
    const g = groupRef.current
    if (g) g.position.x = s.gx
    const active = s.activeIdx
    for (let i = 0; i < rail.length; i++) {
      const h = handles.current[i]
      const b = rail[i]
      if (!h) continue
      const grp = h.group
      const isActive = i === active && (s.mode === 'elevating' || s.mode === 'preview')
      const px = b.x
      const py = b.hidden ? -1.6 : b.y + (isActive ? STAGE.lift : 0)
      const pz = isActive ? STAGE.forward : active >= 0 && s.mode !== 'lowering' ? -0.12 : 0
      if (isActive) {
        easing.damp3(grp.position, [px, py, pz], 0.18, dt)
        easing.dampE(grp.rotation, [-0.06, 0, 0], 0.18, dt)
        easing.damp3(grp.scale, [1.06, 1.06, 1.06], 0.18, dt)
      } else {
        grp.position.x = px
        easing.damp(grp.position, 'y', py, b.hidden ? 0.35 : 0.08, dt)
        easing.damp(grp.position, 'z', pz, 0.25, dt)
        const tiltTarget = (b.landed ? clamp(-b.v * 0.45, -0.3, 0.3) + b.tilt : b.rotZ) + clamp(-s.gv * 0.12, -0.08, 0.08)
        easing.dampAngle(grp.rotation, 'z', tiltTarget, 0.12, dt)
        easing.damp(grp.rotation, 'x', jitter[i].lean, 0.2, dt)
        easing.damp3(grp.scale, [1, 1, 1], 0.2, dt)
      }
      // yaw: 360° flourish or rest
      if (i === s.spinIdx && s.mode !== 'lowering') {
        s.spinT += dt
        const k = Math.min(1, s.spinT / 1.1)
        const e = 1 - Math.pow(1 - k, 3)
        grp.rotation.y = s.spinFrom + e * Math.PI * 2
        if (k >= 1 && !useSiteStore.getState().shelf.activeId) {
          grp.rotation.y = jitter[i].yaw
          s.spinIdx = -1
          openBook(catalog[i].id)
        }
      } else if (isActive) easing.dampAngle(grp.rotation, 'y', 0, 0.18, dt)
      else easing.dampAngle(grp.rotation, 'y', jitter[i].yaw, 0.2, dt)
      // cover hinge
      const openCover = isActive && s.mode === 'preview' && s.spinIdx < 0
      easing.dampAngle(h.hinge.rotation, 'y', openCover ? -2.4 : 0, 0.28, dt)
      // dim siblings while a book is up
      const dim = active >= 0 && i !== active && s.mode !== 'lowering'
      _col.copy(dim ? DIM : WHITE)
      for (const m of h.materials) if (m.map) easing.dampC(m.color, _col, 0.25, dt)
    }
  })

  const onTap = (i: number, delta: number) => {
    const s = sim.current
    if (delta > FEEL.TAP_PX || s.downIdx !== i) return
    if (s.mode === 'landing' || s.mode === 'elevating' || s.mode === 'preview' || s.mode === 'lowering') return
    if (rail[i].hidden) return
    if (s.mode === 'flinging' && Math.abs(s.gv) > 0.5) {
      settleTo(nearestIdx(s.gx)) // first tap stops a flick
      return
    }
    openBook(catalog[i].id)
  }

  return (
    <group ref={groupRef}>
      {catalog.map((book, i) => (
        <BookMesh
          key={book.id}
          ref={(h) => {
            handles.current[i] = h
          }}
          book={book}
          block={block}
          board={board}
          normalMap={normalMap}
          yaw={jitter[i].yaw}
          lean={jitter[i].lean}
          atlasSize={atlasSize}
          onPointerDown={() => (sim.current.downIdx = i)}
          onClick={(delta) => onTap(i, delta)}
        />
      ))}
    </group>
  )
}
