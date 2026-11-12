import { story } from '../../../src/content/story'
import type { Clip, Film, Grade, Stage } from '../engine/stage'
import { clamp, easeOutBack, ramp } from '../engine/math'
import { TextBlock, arNum, box, type Cue } from '../kit/type'
import { bookShot } from '../shots/book'
import { footageShot, TALL_CARD } from '../shots/footage'
import { gustShot } from '../shots/gust'
import { playShot } from '../shots/play'
import { titleShot } from '../shots/title'
import TL from './trailer.timeline.json'

/**
 * The trailer, one source for both cuts (16:9 and 9:16). Sixteen bars of a 3/4 lullaby at 80 bpm; every
 * picture change is on a bar line (trailer.timeline.json, shared with the music).
 *
 *   bars 1–2    her title over falling leaves
 *   bars 3–9    her world: the footage and a code-made gust of name papers, cut to her own lines
 *               (quoted verbatim from src/content/story.ts)
 *   bars 10–14  one story, three ways: the book opens, the film plays, Sari runs in the game
 *   bars 15–16  her closing line, then the title and the site's name
 *
 * Words that are not hers come from the site's own copy (src/i18n/copy.ts).
 */
const SITE = {
  brand: 'وقت الحكاية',
  titleA: 'أوراق الخريف',
  titleB: 'والطيور المهاجرة',
  kicker: story.kicker.ar,
  ways: 'حكاية واحدة · ثلاث طرق',
  read: { word: 'اقرأ', line: 'كتاب يُفتح بين يديك، وصوره تتحرّك.' },
  watch: { word: 'شاهد', line: 'الحكاية نفسها فيلمًا قصيرًا، بالوجوه نفسها.' },
  play: { word: 'العب', line: 'اركض مع ساري واجمع أوراق الأسماء.' },
  papers: 'الأوراق',
  autumn: 'ما أجمل الخريف!', // her words (scene 12), also the site's footer line
}
const cue = (i: number) => story.scenes[i].cue.ar

const B = TL.bar
const at = (name: keyof typeof TL.cuts) => TL.cuts[name] * B

async function build(stage: Stage, params: URLSearchParams): Promise<Film> {
  const { W, H, tall } = stage
  const posterMode = params.get('comp') === 'trailer-poster'

  const title = await titleShot(stage, 'open')
  const end = await titleShot(stage, 'close')
  const v01 = footageShot(stage, { clip: 'v01', startFrame: 2, dur: B, from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.46, cy: 0.48, zoom: 1.1 }, tallFrom: { cx: 0.25, zoom: 1.0 }, tallTo: { cx: 0.27, zoom: 1.06 }, leafSeed: 3, leaves: 14 })
  const v04 = footageShot(stage, { clip: 'v04', startFrame: 0, dur: B, from: { cx: 0.5, cy: 0.52, zoom: 1.04 }, to: { cx: 0.52, cy: 0.54, zoom: 1.1 }, tallFrom: { cx: 0.52, zoom: 1.0 }, tallTo: { cx: 0.6, zoom: 1.05 }, leafSeed: 5, leaves: 18 })
  const v06 = footageShot(stage, { clip: 'v06', startFrame: 0, dur: B, from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.5, cy: 0.47, zoom: 1.09 }, tallFrom: { cx: 0.44, zoom: 1.0 }, tallTo: { cx: 0.5, zoom: 1.05 }, leafSeed: 7, leaves: 30 })
  const gust = await gustShot(stage)
  const v08 = footageShot(stage, { clip: 'v08', startFrame: 30, dur: B, from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.54, cy: 0.5, zoom: 1.1 }, tallFrom: { cx: 0.64, zoom: 1.0 }, tallTo: { cx: 0.66, zoom: 1.06 }, leafSeed: 9, leaves: 44 })
  const v12 = footageShot(stage, { clip: 'v12', startFrame: 4, dur: 2 * B, from: { cx: 0.5, cy: 0.5, zoom: 1.02 }, to: { cx: 0.52, cy: 0.46, zoom: 1.08 }, tallFrom: { cx: 0.3, zoom: 1.0 }, tallTo: { cx: 0.62, zoom: 1.04 }, leafSeed: 13, leaves: 16 })
  const book = await bookShot(stage, at('watch') - at('read'))
  // the film, shown as a film: a 16:9 screen on the phone, letterboxed on the wide cut
  const FILM_CARD = { x: 40, y: 430, w: 1000, h: 563 }
  const v11 = footageShot(stage, { clip: 'v11', startFrame: 6, dur: B, from: { cx: 0.5, cy: 0.5, zoom: 1.03 }, to: { cx: 0.5, cy: 0.5, zoom: 1.09 }, tallFrom: { cx: 0.5, zoom: 1.0 }, tallTo: { cx: 0.5, zoom: 1.05 }, card: FILM_CARD, leafSeed: 17, leaves: 20 })
  const play = await playShot(stage, TL.beat, at('end') - at('play'))

  const clips: Clip[] = [
    { shot: title, start: at('title'), end: at('v01') },
    { shot: v01, start: at('v01'), end: at('v04') },
    { shot: v04, start: at('v04'), end: at('v06') },
    { shot: v06, start: at('v06'), end: at('gust') },
    { shot: gust, start: at('gust'), end: at('v08') },
    { shot: v08, start: at('v08'), end: at('v12') },
    { shot: v12, start: at('v12'), end: at('read') },
    { shot: book, start: at('read'), end: at('watch') },
    { shot: v11, start: at('watch'), end: at('play') },
    { shot: play, start: at('play'), end: at('end') },
    { shot: end, start: at('end'), end: TL.duration + 1 },
  ]

  /* ── type ─────────────────────────────────────────────────────────────── */
  const cx = W / 2
  const texts: Array<{ block: TextBlock; cue: Cue }> = []
  const add = (block: TextBlock, c: Cue) => {
    texts.push({ block, cue: c })
    return block
  }
  const CREAM = '#f6f0e4'
  const MAPLE = '#f4a35e'

  // scrims: under the quotes (wide), and behind the three-ways label
  const scrim = box(stage, `left:0;right:0;bottom:0;height:${tall ? H * 0.34 : H * 0.42}px;background:linear-gradient(to top, rgba(18,10,5,${tall ? 0.8 : 0.72}), rgba(18,10,5,0.4) 45%, rgba(18,10,5,0));opacity:0;`)
  const sideScrim = tall ? null : box(stage, `top:0;bottom:0;right:0;width:${W * 0.6}px;background:linear-gradient(to left, rgba(18,10,5,0.74), rgba(18,10,5,0.36) 48%, rgba(18,10,5,0));opacity:0;`)
  // cinema bars for the film beat (wide cut)
  const barH = (H - W / 2.2) / 2
  const barTop = tall ? null : box(stage, `left:0;right:0;top:0;height:${barH}px;background:#0b0705;transform:translateY(-100%);`)
  const barBot = tall ? null : box(stage, `left:0;right:0;bottom:0;height:${barH}px;background:#0b0705;transform:translateY(100%);`)

  // title
  const titleY = tall ? H * 0.43 : H * 0.5
  const kickerStyle = { font: 'ui' as const, size: tall ? 44 : 40, weight: 600, color: '#ffd9ae', shadow: true }
  const titleStyle = { font: 'display' as const, size: tall ? 128 : 150, weight: 800, lineHeight: 1.18, shadow: '0 4px 40px rgba(18,10,5,0.55), 0 2px 6px rgba(18,10,5,0.45)' }
  add(new TextBlock(stage, SITE.kicker, kickerStyle, cx, titleY - (tall ? 250 : 215)), { in: 0.55, out: 3.95, mode: 'block', rise: 0.7 })
  add(new TextBlock(stage, [SITE.titleA, SITE.titleB], titleStyle, cx, titleY), { in: 0.7, out: 3.95, stagger: 0.2, rise: 0.8 })

  // her lines over her world
  const quoteStyle = { font: 'story' as const, size: tall ? 62 : 60, weight: 600, lineHeight: 1.6, width: tall ? 930 : 1500, shadow: true }
  const quoteY = tall ? TALL_CARD.y + TALL_CARD.h + 190 : H - 132
  const q = (text: string, tin: number, tout: number) => add(new TextBlock(stage, text, quoteStyle, cx, quoteY), { in: tin, out: tout, stagger: 0.1, rise: 0.5, fall: 0.3 })
  q(cue(0), at('v01') + 0.2, at('v06') - 0.45)
  q(cue(5), at('v06') + 0.15, at('v08') - 0.45)
  q(cue(7), at('v08') + 0.15, at('v12') - 0.4)
  q(cue(11), at('v12') + 0.2, at('read') - 0.5)

  // the title stays, small, above the picture on the phone
  if (tall) add(new TextBlock(stage, `${SITE.titleA} ${SITE.titleB}`, { font: 'display', size: 40, weight: 700, color: CREAM, opacity: 0.92, shadow: true }, cx, 138), { in: at('v01') + 0.1, out: at('end') - 0.4, mode: 'block', rise: 0.6 })

  // one story, three ways
  const wx = tall ? cx : W - 120
  const align = tall ? ('center' as const) : ('right' as const)
  const wordY = tall ? 1440 : H - 290
  const lineY = tall ? 1590 : H - 150
  const waysY = tall ? 1310 : H - 415
  const wordStyle = { font: 'display' as const, size: tall ? 150 : 170, weight: 800, align, width: 900, shadow: true, lineHeight: 1.1 }
  const lineStyle = { font: 'ui' as const, size: tall ? 44 : 42, weight: 500, align, width: 900, shadow: true, color: CREAM, lineHeight: 1.5 }
  add(new TextBlock(stage, SITE.ways, { font: 'ui', size: tall ? 36 : 32, weight: 600, align, width: 900, color: MAPLE, shadow: true }, wx, waysY), { in: at('read') + 0.15, out: at('end') - 0.45, mode: 'block', rise: 0.6 })
  const way = (w: { word: string; line: string }, a: number, b: number) => {
    add(new TextBlock(stage, w.word, wordStyle, wx, wordY), { in: a + 0.12, out: b - 0.36, rise: 0.55, fall: 0.28 })
    add(new TextBlock(stage, w.line, lineStyle, wx, lineY), { in: a + 0.38, out: b - 0.36, stagger: 0.07, rise: 0.5, fall: 0.28 })
  }
  way(SITE.read, at('read'), at('watch'))
  way(SITE.watch, at('watch'), at('play'))
  way(SITE.play, at('play'), at('end'))

  // game counter
  const hud = box(
    stage,
    `top:${tall ? 250 : 70}px;${tall ? `left:${cx - 170}px` : 'left:90px'};width:340px;height:84px;border-radius:42px;background:rgba(18,12,8,0.5);border:1.5px solid rgba(255,255,255,0.22);` +
      `display:flex;align-items:center;justify-content:center;gap:18px;direction:rtl;font:600 38px 'Rubik Variable';color:${CREAM};opacity:0;box-shadow:0 10px 40px rgba(18,10,5,0.35);`,
  )
  hud.innerHTML = `<span style="display:inline-block;width:34px;height:26px;border-radius:5px;background:#fbf5e8;transform:rotate(-8deg)"></span><span>${SITE.papers}</span><span id="hud-n" style="display:inline-block;color:${MAPLE};min-width:92px;text-align:center"></span>`
  const hudN = hud.querySelector('#hud-n') as HTMLSpanElement

  // closing: her line, then the title and the name of the site, on a soft shade so the type holds on the painting
  const E = at('end')
  const endShade = box(stage, `left:${cx - (tall ? 620 : 900)}px;top:${(tall ? H * 0.24 : H * 0.42) - (tall ? 560 : 470)}px;width:${tall ? 1240 : 1800}px;height:${tall ? 1120 : 940}px;background:radial-gradient(closest-side, rgba(24,12,6,0.62), rgba(24,12,6,0.4) 55%, rgba(24,12,6,0));opacity:0;`)
  add(new TextBlock(stage, SITE.autumn, { font: 'story', size: tall ? 120 : 132, weight: 700, shadow: true, lineHeight: 1.4 }, cx, tall ? H * 0.235 : H * 0.36), { in: E + 0.25, out: E + B - 0.4, stagger: 0.22, rise: 0.8, fall: 0.4 })
  const endY = tall ? H * 0.215 : H * 0.385
  add(new TextBlock(stage, SITE.kicker, kickerStyle, cx, endY - (tall ? 250 : 215)), { in: E + B + 0.1, out: 999, mode: 'block', rise: 0.7 })
  add(new TextBlock(stage, [SITE.titleA, SITE.titleB], titleStyle, cx, endY), { in: E + B + 0.15, out: 999, stagger: 0.16, rise: 0.7 })
  const rule = box(stage, `left:${cx - 60}px;top:${endY + (tall ? 196 : 205)}px;width:120px;height:5px;border-radius:3px;background:#d9541e;opacity:0;`)
  add(new TextBlock(stage, SITE.brand, { font: 'display', size: tall ? 58 : 54, weight: 700, shadow: true }, cx, endY + (tall ? 262 : 280)), { in: E + B + 0.7, out: 999, mode: 'block', rise: 0.7 })
  add(new TextBlock(stage, SITE.ways, { font: 'ui', size: tall ? 36 : 32, weight: 500, color: '#ffd9ae', shadow: true }, cx, endY + (tall ? 336 : 352)), { in: E + B + 0.9, out: 999, mode: 'block', rise: 0.7 })

  return {
    duration: posterMode ? 1 / TL.fps : TL.duration,
    clips: posterMode ? [{ shot: end, start: 0, end: 1, offset: B + 2 }] : clips,
    frame(timeIn: number, grade: Grade) {
      const time = posterMode ? TL.duration - 0.05 : timeIn
      for (const t of texts) t.block.update(time, t.cue)
      const quotes = Math.min(ramp(time, at('v01'), at('v01') + 0.5), 1 - ramp(time, at('read') - 0.5, at('read')))
      const ways = Math.min(ramp(time, at('read'), at('read') + 0.4), 1 - ramp(time, at('end') - 0.4, at('end')))
      const gustOn = Math.min(ramp(time, at('gust') - 0.1, at('gust') + 0.25), 1 - ramp(time, at('v08') - 0.25, at('v08')))
      scrim.style.opacity = String(tall ? Math.max(gustOn * 0.85, ways) : quotes)
      if (sideScrim) sideScrim.style.opacity = String(ways)
      if (barTop && barBot) {
        const k = Math.min(ramp(time, at('watch') - 0.02, at('watch') + 0.45), 1 - ramp(time, at('play') - 0.3, at('play')))
        barTop.style.transform = `translateY(${-100 + k * 100}%)`
        barBot.style.transform = `translateY(${100 - k * 100}%)`
      }
      // counter
      const tp = time - at('play')
      const inPlay = time >= at('play') && time < at('end')
      hud.style.opacity = String(inPlay ? Math.min(ramp(tp, 0.1, 0.5), 1 - ramp(time, at('end') - 0.35, at('end'))) : 0)
      if (inPlay) {
        const n = play.collected(tp)
        hudN.textContent = `${arNum(n)} / ${arNum(play.total)}`
        // a small bounce each time a paper is taken
        let since = 9
        for (let k = 0; k < play.total; k++) {
          const d = tp - (TL.beat + k * TL.beat)
          if (d >= 0) since = Math.min(since, d)
        }
        const pop = 1 + 0.22 * (1 - easeOutBack(clamp(since / 0.35)))
        hudN.style.transform = `scale(${pop.toFixed(3)})`
      }
      endShade.style.opacity = String(ramp(time, E + 0.05, E + 0.7))
      rule.style.opacity = String(ramp(time, E + B + 0.5, E + B + 1.0))
      rule.style.transform = `scaleX(${ramp(time, E + B + 0.5, E + B + 1.1).toFixed(3)})`
      grade.vignette = 0.34
      grade.glow = 0.12
    },
  }
}

export const wide = { W: 1920, H: 1080, fps: TL.fps, build }
export const tall = { W: 1080, H: 1920, fps: TL.fps, build }
export const poster = { W: 1920, H: 1080, fps: TL.fps, build }
