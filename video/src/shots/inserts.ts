import * as THREE from 'three'
import { clamp, drift, easeInOutCubic, easeOutCubic, hash, lerp, ramp, smooth, window4 } from '../engine/math'
import type { Shot, Stage } from '../engine/stage'
import { LeafField, type LeafState } from '../kit/leaves'
import { PaperSet, lyingQuat } from '../kit/papers'
import { Plate, sitePicture } from '../kit/plate'
import { Sari, sariLights } from '../kit/sari'
import { blurredCopy, imageTexture } from '../kit/textures'
import { Sparks, blobShadow, makeGlow, makeRing } from '../kit/world'
import { makeYard } from './yard'

/**
 * Code-made shots for the six scenes that have no footage. Each one animates the things her text is
 * about — the name papers, a stick, a leaf, a crown — in a real 3D set lit like the paintings, and cuts
 * with the scene's painting. No invented acting for Amir or the teacher; Sari appears as the site's model.
 */

const _e = new THREE.Euler()
/** The same far background for every close-up: the kindergarten building and trees of the wide painting, no figures. */
const YARD = { cx: 0.22, cy: 0.56, zoom: 2.3, blur: 5, exposure: 0.9 }
const _q = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()

/* ── scene 2 · the papers are laid out, and the first one is turned ─────── */
export async function layShot(stage: Stage, dur: number): Promise<Shot> {
  const yard = await makeYard(stage, { picture: 'k08', clear: 1.9, seed: 2, backdrop: YARD })
  const set = new PaperSet(yard.light)
  yard.scene.add(set.group)
  const N = 12
  const names = [0, 1, 2, 4, 3, 3, 0, 1, 2, 4, 0, 1]
  for (let k = 0; k < N; k++) set.add(names[k], 0.5)
  const FLIP = 5
  const tFlip = dur - 1.5
  return {
    render(t, target) {
      const k = smooth(clamp(t / dur))
      yard.cam.position.set(lerp(1.25, 0.25, k) + drift(t * 0.3, 1) * 0.02, lerp(0.95, 1.6, k), lerp(2.3, 2.3, k))
      yard.cam.lookAt(lerp(0.15, 0, k), 0, lerp(0.15, 0.05, k))
      const focus = yard.cam.position.length()
      set.focus = focus
      set.focusRange = 1.3
      set.papers.forEach((p, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const x = (1.5 - col) * 0.62 + (hash(i, 3) - 0.5) * 0.05
        const z = (row - 1) * 0.5 + (hash(i, 4) - 0.5) * 0.04
        const yaw = (hash(i, 5) - 0.5) * 0.2
        const land = 0.45 + i * 0.26
        const u = clamp((t - (land - 0.55)) / 0.55)
        const e = easeOutCubic(u)
        const settle = Math.sin(Math.PI * clamp((t - land) / 0.3)) * 0.012
        let y = 0.008 + i * 0.0006 + (1 - e) * 0.8 + settle
        let flip = 0
        p.bend = (1 - e) * 0.3
        p.wave = (1 - e) * 0.5
        if (i === FLIP) {
          const v = clamp((t - tFlip) / 0.85)
          flip = easeInOutCubic(v)
          y += Math.sin(Math.PI * v) * 0.34
          p.bend += Math.sin(Math.PI * v) * 0.3
        }
        p.pos.set(x + (1 - e) * 0.22, y, z - (1 - e) * 0.3)
        lyingQuat(p.quat, yaw + (1 - e) * 0.6, flip, 0)
        // tip forward while it is carried down
        p.quat.multiply(_q.setFromEuler(_e.set((1 - e) * -0.6, 0, (1 - e) * 0.25)))
        p.alpha = ramp(u, 0, 0.3)
      })
      set.update(t, yard.cam)
      yard.update(t, focus, 1.3)
      yard.draw(target, t)
    },
  }
}

/* ── scene 3 · "wait your turn" ─────────────────────────────────────────── */
export async function waitShot(stage: Stage, dur: number): Promise<Shot> {
  const yard = await makeYard(stage, { picture: 'k08', clear: 0.2, seed: 3, backdrop: YARD, fov: 28 })
  const sari = await Sari.create()
  const shadow = blobShadow()
  sari.group.position.set(-0.45, 0, -0.5)
  sari.group.rotation.y = 0.42
  shadow.position.set(-0.38, 0.004, -0.55)
  shadow.scale.set(0.9, 1, 0.62)
  const set = new PaperSet(yard.light)
  yard.scene.add(sari.group, shadow, sariLights(), set.group)
  for (let k = 0; k < 9; k++) set.add(k % 5, 0.46)
  const EAGER = 7 // the paper someone cannot wait to turn (front row, in the foreground)
  const eagerPos = new THREE.Vector3()
  return {
    aa: true,
    render(t, target) {
      const k = smooth(clamp(t / dur))
      yard.cam.position.set(0.95 + drift(t * 0.3, 2) * 0.015, 0.56 + k * 0.05, 3.05 - k * 0.3)
      yard.cam.lookAt(-0.12, 0.52, -0.2)
      const lift = window4(t, 0.2, 0.75, 1.2, 1.6) * 0.95 + window4(t, 3.05, 3.2, 3.35, 3.65) * 0.3
      set.papers.forEach((p, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        p.pos.set(-0.25 + col * 0.6 + (hash(i, 6) - 0.5) * 0.05, 0.008 + i * 0.0006 + (i === EAGER ? lift * 0.03 : 0), 0.45 + row * 0.5 + (hash(i, 7) - 0.5) * 0.04)
        lyingQuat(p.quat, (hash(i, 8) - 0.5) * 0.22, 0, 0)
        p.corner = i === EAGER ? lift : 0
        p.bend = i === EAGER ? lift * 0.12 : 0
        if (i === EAGER) eagerPos.copy(p.pos)
      })
      const wave = window4(t, 0.95, 1.5, 3.7, 4.4)
      sari.pose({ run: 0, wave, t: t + 1, look: 0.3, lookUp: -0.2 + wave * 0.08 })
      // focus: first on the impatient paper in front, then pulled to Sari as he raises his hand
      const pull = smooth(ramp(t, 0.85, 1.6, (x) => x))
      const focus = lerp(yard.cam.position.distanceTo(eagerPos), yard.cam.position.distanceTo(sari.group.position), pull)
      set.focus = focus
      set.focusRange = 0.75
      set.update(t, yard.cam)
      yard.update(t, focus, 0.9)
      yard.draw(target, t)
    },
  }
}

/* ── scene 5 · the stick taps, and — hop! — the paper turns ─────────────── */
export async function stickShot(stage: Stage, dur: number, tap: number): Promise<Shot> {
  const yard = await makeYard(stage, { picture: 'k08', clear: 1.1, seed: 5, backdrop: YARD, fov: 30, falling: 26 })
  const set = new PaperSet(yard.light)
  const paper = set.add(1, 0.56) // «أحمد»
  const P = new THREE.Vector3(-0.42, 0, 0.14)
  const geo = new THREE.CylinderGeometry(0.02, 0.011, 1.1, 10)
  geo.translate(0, 0.55, 0)
  const stick = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x7a4a26 }))
  stick.rotation.set(-0.35, 0, 0.8)
  const rings = [makeRing(), makeRing()]
  const flash = makeGlow(0xffb24a, 1.2, 0)
  flash.position.copy(P).setY(0.05)
  const sparks = new Sparks(70, 0.07)
  yard.scene.add(set.group, stick, sariLights(), ...rings, flash, sparks.points)
  const hop = tap + 0.1
  const FLY = 0.85
  return {
    aa: true,
    render(t, target) {
      const read = smooth(ramp(t, hop + FLY - 0.1, dur, (x) => x))
      yard.cam.position.set(lerp(0.3, 0.16, read) + drift(t * 0.3, 4) * 0.012, lerp(0.42, 0.86, read), lerp(1.95, 1.5, read))
      yard.cam.lookAt(lerp(-0.12, 0.08, read), lerp(0.14, 0.0, read), lerp(0.05, 0, read))
      // the stick: held, lifted, brought down on the beat, a small rebound, then taken away
      let h = 0.42 + ramp(t, tap - 0.5, tap - 0.12) * 0.2
      if (t > tap - 0.12) h = 0.62 * (1 - ramp(t, tap - 0.12, tap, (x) => x * x))
      if (t > tap) h = Math.abs(Math.sin((t - tap) * 14)) * 0.05 * Math.exp(-(t - tap) * 7)
      const away = smooth(ramp(t, tap + 0.9, tap + 1.9, (x) => x))
      stick.position.set(P.x - away * 1.6, h + away * 0.9, P.z - away * 0.3)
      stick.rotation.z = 0.8 + away * 0.3
      // light
      rings.forEach((r, i) => {
        const u = clamp((t - tap - i * 0.14) / 0.95)
        const e = easeOutCubic(u)
        r.position.set(P.x, 0.006 + i * 0.001, P.z)
        r.scale.setScalar(0.12 + e * (1.5 + i * 0.5))
        ;(r.material as THREE.MeshBasicMaterial).opacity = u > 0 && u < 1 ? (1 - u) * 0.95 : 0
      })
      ;(flash.material as THREE.SpriteMaterial).opacity = t > tap ? Math.exp(-(t - tap) * 3.2) * 0.9 : 0
      flash.scale.setScalar(1.0 + ramp(t, tap, tap + 0.6) * 1.2)
      // the paper: hop, one and a half turns, land name-up
      const v = clamp((t - hop) / FLY)
      const landed = clamp((t - hop - FLY) / 0.28)
      paper.pos.set(0.1 + v * 0.03, 0.01 + 0.62 * 4 * v * (1 - v) + Math.sin(Math.PI * landed) * 0.03, 0.02)
      lyingQuat(paper.quat, 0.14 + v * 0.1, v * 3, 0)
      paper.bend = Math.sin(Math.PI * v) * 0.26 + Math.sin(Math.PI * landed) * 0.08
      paper.wave = Math.sin(Math.PI * v) * 0.5
      const focus = yard.cam.position.distanceTo(paper.pos)
      set.focus = focus
      set.focusRange = 1.0
      set.update(t, yard.cam)
      // sparks: thrown up from the tap, drawn across to the paper, twinkling out
      sparks.update((i) => {
        const born = tap + hash(i, 1) * 0.55
        const life = 1.2 + hash(i, 2) * 1.3
        const u = (t - born) / life
        if (u <= 0 || u >= 1) return [0, -5, 0, 0]
        const a = hash(i, 3) * 6.283 + u * 2.5
        const rad = 0.08 + u * (0.25 + hash(i, 4) * 0.5)
        const cx = lerp(P.x, 0.1, smooth(u))
        const tw = 0.55 + 0.45 * Math.sin(t * (9 + hash(i, 5) * 9) + i)
        return [cx + Math.cos(a) * rad, 0.05 + u * (0.5 + hash(i, 6) * 0.7), P.z * (1 - u) + Math.sin(a) * rad * 0.7, Math.sin(Math.PI * u) ** 0.7 * tw]
      })
      yard.update(t, focus, 1.0)
      yard.draw(target, t)
    },
  }
}

/* ── scene 7 · among the papers, one leaf ───────────────────────────────── */
export async function leafShot(stage: Stage, _dur: number): Promise<Shot> {
  const yard = await makeYard(stage, { picture: 'k08', clear: 0.2, seed: 7, backdrop: YARD, fov: 32, falling: 30, haze: [5, 14] })
  const set = new PaperSet(yard.light)
  for (let k = 0; k < 14; k++) set.add(k % 5, 0.46)
  const heroAt = (t: number, out: THREE.Vector3) => out.set(-0.55 + 0.55 * Math.sin(1.5 * t) + 0.13 * t, 2.55 - 0.37 * t + Math.abs(Math.sin(1.5 * t)) * 0.05, 0.6 + 0.28 * Math.cos(1.1 * t))
  const hero = new LeafField(
    {
      count: 1,
      seed: 77,
      renderOrder: 9,
      maxBlur: 0.4,
      colorOf: () => ['#f08a1c', '#c9321a'],
      place: (_i: number, t: number, s: LeafState) => {
        heroAt(t, s.pos)
        _e.set(-0.55 + Math.sin(3 * t + 1) * 0.28, 0.6 + t * 0.5, Math.cos(1.5 * t) * 0.75, 'YXZ')
        s.quat.setFromEuler(_e)
        s.size = 0.8
        s.curl = 0.45
      },
    },
    yard.light,
  )
  yard.scene.add(set.group, hero.group)
  const hp = new THREE.Vector3()
  return {
    render(t, target) {
      heroAt(t, hp)
      yard.cam.position.set(0.1 + hp.x * 0.6 + drift(t * 0.3, 6) * 0.02, hp.y + 0.1, 2.55)
      yard.cam.lookAt(hp.x * 0.85, hp.y - 0.04, 0.6)
      const focus = yard.cam.position.distanceTo(hp)
      // the game papers drift down around it and come to rest
      set.papers.forEach((p, i) => {
        const r = (n: number) => hash(i, 70 + n)
        const land = 0.6 + r(1) * 6.5
        const h = Math.max(0, (land - t) * 0.5)
        const air = clamp(h / 0.35)
        const x = (r(2) - 0.5) * 4.4 + Math.sin(t * (1 + r(3)) + r(4) * 6) * 0.22 * air
        const z = (r(5) - 0.5) * 3.2 - 0.3 + Math.cos(t * (0.8 + r(6)) + r(7) * 6) * 0.15 * air
        p.pos.set(x, 0.01 + i * 0.0007 + h, z)
        lyingQuat(p.quat, r(8) * 6.283, r(9) < 0.5 ? 0 : 1, 0)
        p.quat.multiply(_q.setFromEuler(_e.set(Math.sin(t * 1.7 + r(10) * 6) * 0.6 * air, 0, Math.cos(t * 1.3 + r(11) * 6) * 0.5 * air)))
        p.bend = 0.18 * air * Math.sin(t * 2 + i)
        p.wave = 0.4 * air
        p.dapple = 1 - air * 0.6
      })
      set.focus = focus
      set.focusRange = 1.2
      set.update(t, yard.cam)
      hero.setFocus(focus, 3)
      hero.update(t, yard.cam)
      yard.update(t, focus, 1.2)
      yard.draw(target, t)
    },
  }
}

/* ── scene 9 · "as if nature were painting a picture just for them" ─────── */
export async function pictureShot(stage: Stage, dur: number): Promise<Shot> {
  const yard = await makeYard(stage, { picture: 'k08', clear: 2.6, seed: 9, backdrop: YARD, fov: 32, falling: 24, haze: [9, 22] })
  yard.ground.uniforms.uPool.value.set(0, 0, 2.4, 0.3)
  const RINGS = 7
  const counts = [1, 12, 19, 26, 33, 40, 47]
  const palette: Array<[string, string]> = [
    ['#f7cf45', '#f6b529'],
    ['#f7cf45', '#f09a22'],
    ['#f6b529', '#e8791a'],
    ['#f08a1c', '#d9541e'],
    ['#e2531a', '#c9321a'],
    ['#c9321a', '#8e1a10'],
    ['#b8230f', '#7a160c'],
  ]
  const ringOf: number[] = []
  const slot: number[] = []
  counts.forEach((n, j) => {
    for (let m = 0; m < n; m++) {
      ringOf.push(j)
      slot.push(m)
    }
  })
  const total = ringOf.length
  const target = new THREE.Vector3()
  const field = new LeafField(
    {
      count: total,
      seed: 91,
      renderOrder: 7,
      maxBlur: 3,
      colorOf: (i) => palette[ringOf[i]],
      place: (i: number, t: number, s: LeafState) => {
        const j = ringOf[i]
        const n = counts[j]
        const a = j === 0 ? 0 : (slot[i] / n) * 6.283 + j * 0.37
        const rj = j === 0 ? 0 : 0.18 + j * 0.235
        const start = 0.25 + j * 0.3 + hash(i, 2) * 0.3
        const u = clamp((t - start) / 1.7)
        const e = easeOutCubic(u)
        // spiral in from a wide whirl above the ground
        const ang = a + (1 - e) * (2.6 + hash(i, 3))
        const rad = rj * (1 + (1 - e) * 1.6) + (1 - e) * 1.2
        target.set(Math.cos(ang) * rad, 0.05 - j * 0.005 + (1 - e) ** 1.4 * (1.6 + hash(i, 4) * 1.2), Math.sin(ang) * rad)
        s.pos.copy(target)
        // at rest: flat, tip pointing outward
        _q.setFromEuler(_e.set(-Math.PI / 2 + (hash(i, 5) - 0.5) * 0.12, Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 'YXZ'))
        _q2.setFromEuler(_e.set(t * (2 + hash(i, 6) * 2) + i, t * 1.3 + i * 2, hash(i, 7) * 6))
        s.quat.copy(_q2).slerp(_q, e * e)
        s.size = (j === 0 ? 0.7 : 0.5 + j * 0.035) * (0.92 + hash(i, 8) * 0.16)
        s.alpha = ramp(u, 0, 0.12)
        s.curl = lerp(0.6, 0.22, e)
      },
    },
    yard.light,
  )
  yard.scene.add(field.group)
  return {
    render(t, target2) {
      const k = smooth(clamp(t / dur))
      const a = -0.25 + t * 0.07
      const d = lerp(2.4, 1.7, k)
      yard.cam.position.set(Math.sin(a) * d, lerp(2.7, 5.3, k), Math.cos(a) * d)
      yard.cam.lookAt(0, 0, lerp(-0.25, 0.05, k))
      const focus = yard.cam.position.length()
      field.setFocus(focus, 1.6)
      field.update(t, yard.cam)
      yard.update(t, focus, 1.8)
      yard.draw(target2, t)
    },
  }
}

/* ── scene 10 · crowns like the crowns of kings, and towers of leaves ───── */
export async function crownShot(stage: Stage, dur: number): Promise<Shot> {
  const yard = await makeYard(stage, { picture: 'k08', clear: 0.3, seed: 10, backdrop: YARD, fov: 28 })
  const sari = await Sari.create()
  const SX = -0.42
  sari.group.position.set(SX, 0, 0)
  sari.group.rotation.y = 0.28
  const shadow = blobShadow()
  shadow.position.set(SX + 0.07, 0.004, -0.05)
  shadow.scale.set(0.9, 1, 0.62)
  const CROWN = 13
  const LAYERS = 10
  const perLayer = (j: number) => 11 - j
  const layerOf: number[] = []
  const slotOf: number[] = []
  for (let j = 0; j < LAYERS; j++)
    for (let m = 0; m < perLayer(j); m++) {
      layerOf.push(j)
      slotOf.push(m)
    }
  const TOWER = layerOf.length
  const TX = 0.98
  const TZ = -0.2
  const warm: Array<[string, string]> = [
    ['#f7cf45', '#f09a22'],
    ['#f6b529', '#e8791a'],
    ['#f08a1c', '#d9541e'],
    ['#e2531a', '#b8230f'],
    ['#c9321a', '#8e1a10'],
  ]
  const tStart = dur * 0.44
  const field = new LeafField(
    {
      count: CROWN + TOWER + 1,
      seed: 101,
      renderOrder: 7,
      maxBlur: 2.5,
      colorOf: (i) => (i < CROWN ? warm[i % 3] : i === CROWN + TOWER ? warm[0] : warm[Math.floor(hash(i, 1) * warm.length)]),
      place: (i: number, t: number, s: LeafState) => {
        if (i < CROWN) {
          // a ring of upright leaves on his curls
          const a = (i / CROWN) * 6.283 + 0.24
          const start = 0.25 + i * 0.1
          const u = clamp((t - start) / 0.95)
          const e = easeOutCubic(u)
          const ang = a + (1 - e) * 2.4
          const rad = 0.165 + (1 - e) * (0.9 + hash(i, 2) * 0.8)
          s.pos.set(SX + 0.0 + Math.cos(ang) * rad, 1.02 + (1 - e) * (hash(i, 3) - 0.3) * 1.0 + Math.sin(t * 2 + i) * 0.004, 0.02 + Math.sin(ang) * rad)
          _q.setFromEuler(_e.set(-0.2, Math.atan2(Math.cos(a), Math.sin(a)), 0, 'YXZ'))
          _q2.setFromEuler(_e.set(t * 3 + i, t * 2 + i * 2, i))
          s.quat.copy(_q2).slerp(_q, e * e)
          s.size = i % 2 ? 0.2 : 0.25
          s.alpha = ramp(u, 0, 0.15)
          s.curl = 0.2
          return
        }
        if (i === CROWN + TOWER) {
          // the leaf on top of the tower
          const u = clamp((t - (tStart + LAYERS * 0.2 + 0.3)) / 0.8)
          const e = easeOutCubic(u)
          s.pos.set(TX, 0.07 + LAYERS * 0.1 + 0.08 + (1 - e) * 1.2, TZ)
          _q.setFromEuler(_e.set(-0.05, 0.3 + (1 - e) * 5, 0, 'YXZ'))
          s.quat.copy(_q)
          s.size = 0.34
          s.alpha = ramp(u, 0, 0.2)
          s.curl = 0.15
          return
        }
        const k = i - CROWN
        const j = layerOf[k]
        const n = perLayer(j)
        const a = (slotOf[k] / n) * 6.283 + j * 0.5
        const R = 0.36 * (1 - j / 10.8)
        const start = tStart + j * 0.2 + hash(i, 4) * 0.15
        const u = clamp((t - start) / 0.8)
        const e = easeOutCubic(u)
        const ang = a + (1 - e) * 3.0
        const rad = R + (1 - e) * (0.7 + hash(i, 5) * 0.6)
        s.pos.set(TX + Math.cos(ang) * rad, 0.07 + j * 0.1 + (1 - e) * (0.5 + hash(i, 6)), TZ + Math.sin(ang) * rad)
        // shingled: face out and up, tip down
        _q.setFromEuler(_e.set(-0.55, Math.atan2(Math.cos(a), Math.sin(a)), Math.PI + (hash(i, 7) - 0.5) * 0.4, 'YXZ'))
        _q2.setFromEuler(_e.set(t * 3 + i, t * 2 + i * 2, i))
        s.quat.copy(_q2).slerp(_q, e * e)
        s.size = 0.38 - j * 0.01
        s.alpha = ramp(u, 0, 0.15)
        s.curl = 0.3
      },
    },
    yard.light,
  )
  yard.scene.add(sari.group, shadow, sariLights(), field.group)
  return {
    aa: true,
    render(t, target) {
      const k = smooth(ramp(t, dur * 0.38, dur * 0.72, (x) => x))
      yard.cam.position.set(lerp(-0.2, 0.42, k) + drift(t * 0.3, 8) * 0.015, lerp(0.98, 0.8, k), lerp(2.25, 3.9, k) - (t / dur) * 0.15)
      yard.cam.lookAt(lerp(SX + 0.02, 0.28, k), lerp(0.86, 0.55, k), 0)
      const proud = window4(t, dur * 0.36, dur * 0.48, dur * 0.86, dur * 0.97)
      sari.pose({ run: 0, wave: proud, t: t + 2, look: lerp(0, 0.3, k), lookUp: window4(t, 0.3, 1.0, 1.5, 2.1) * 0.22 })
      const focus = yard.cam.position.distanceTo(sari.group.position)
      field.setFocus(focus, 2.2)
      field.update(t, yard.cam)
      yard.update(t, focus, 1.6)
      yard.draw(target, t)
    },
  }
}

/* ── the end · the birds leave ──────────────────────────────────────────── */
export async function birdsShot(stage: Stage, dur: number): Promise<Shot> {
  const img = await sitePicture('k12')
  const plate = new Plate(stage, imageTexture(blurredCopy(img, 5, 720), false), img.width / img.height)
  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(34, stage.aspect, 0.1, 200)
  cam.position.set(0, 0, 0)
  cam.lookAt(0, 0.62, -1)
  const mat = new THREE.MeshBasicMaterial({ color: 0x4a2a22, side: THREE.DoubleSide, transparent: true })
  const wingGeo = (side: number) => {
    const g = new THREE.BufferGeometry()
    const s = side
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, -0.07, 0, 0, 0.05, s * 0.17, 0, -0.06, 0, 0, 0.05, s * 0.3, 0, 0.03, s * 0.17, 0, -0.06]), 3))
    return g
  }
  const bodyGeo = new THREE.BufferGeometry()
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.012, -0.17, -0.03, 0, -0.02, 0.03, 0, -0.02, -0.03, 0, -0.02, 0.03, 0, -0.02, 0, 0.004, 0.13]), 3))
  const birds: Array<{ g: THREE.Group; l: THREE.Mesh; r: THREE.Mesh; n: number; side: number }> = []
  const COUNT = 17
  for (let i = 0; i < COUNT; i++) {
    const g = new THREE.Group()
    const l = new THREE.Mesh(wingGeo(-1), mat)
    const r = new THREE.Mesh(wingGeo(1), mat)
    g.add(new THREE.Mesh(bodyGeo, mat), l, r)
    scene.add(g)
    const n = Math.ceil(i / 2)
    birds.push({ g, l, r, n, side: i % 2 ? 1 : -1 })
  }
  const leaves = new LeafField({
    count: 22,
    seed: 121,
    focus: 9,
    focusRange: 1.5,
    place: (i: number, t: number, s: LeafState) => {
      const r = (n: number) => hash(i, 300 + n)
      const fall = (r(1) * 5 + t * (0.45 + r(2) * 0.3)) % 5
      s.pos.set((r(3) - 0.5) * 6 + Math.sin(t * (1 + r(4)) + i) * 0.2 + fall * 0.12, 5.2 - fall * 1.0, -4.5 - r(5) * 2.5)
      s.quat.setFromEuler(_e.set(-0.5 + Math.sin(t * 2 + i) * 0.4, t * (r(6) - 0.5) * 2 + i, Math.cos(t * 1.4 + i) * 0.7, 'YXZ'))
      s.size = 0.26 + r(7) * 0.2
      s.alpha = Math.min(1, fall / 0.5, (5 - fall) / 0.5)
    },
  })
  scene.add(leaves.group)
  const lead = new THREE.Vector3()
  const heading = new THREE.Vector3(-0.2, 0.3, -1).normalize()
  const right = new THREE.Vector3().crossVectors(heading, new THREE.Vector3(0, 1, 0)).normalize()
  return {
    render(t, target) {
      const k = clamp(t / dur)
      plate.look({ cx: lerp(0.73, 0.71, k), cy: lerp(0.41, 0.39, k), zoom: lerp(2.7, 2.55, k), exposure: 0.98 })
      plate.draw(target, true)
      // the flock recedes along its heading; the V opens behind the leader
      lead.set(1.3, 4.6, -8.5).addScaledVector(heading, t * 2.4)
      const far = clamp((-lead.z - 8) / 16)
      mat.opacity = 1 - far * 0.45
      for (const b of birds) {
        const bob = Math.sin(t * 1.3 + b.n * 0.9 + b.side) * 0.05
        b.g.position.copy(lead).addScaledVector(heading, -b.n * 0.5).addScaledVector(right, b.side * b.n * 0.52)
        b.g.scale.setScalar(1.35)
        b.g.position.y += bob - b.n * 0.035
        b.g.lookAt(b.g.position.clone().sub(heading))
        // long glides, a few slow beats: they save their strength for the journey
        const beat = Math.sin(t * 5.2 - b.n * 0.55)
        const flap = 0.16 + 0.38 * beat * (0.35 + 0.65 * smooth(clamp(Math.sin(t * 0.9 - b.n * 0.3) * 1.5)))
        b.l.rotation.z = -flap
        b.r.rotation.z = flap
      }
      leaves.update(t, cam)
      const r = stage.renderer
      r.setRenderTarget(target)
      const auto = r.autoClear
      r.autoClear = false
      r.clearDepth()
      r.render(scene, cam)
      r.autoClear = auto
    },
  }
}
