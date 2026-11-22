// The export page for instruction pictures.
//   ?view=card&dir=stage&act=here-you-are&card=s2&lang=en   one card, filling the page width
//   ?view=set&dir=stage&lang=ar&cols=1[&act=…]              a whole set as the site would show it (cols=2 or 3 on a tablet)
//   ?view=cast                                              the instruction cast, for the comparison page
// It exposes window.__inst = { ready, error, seek(t), loop, still, height } for studio/scripts/instructions-export.mjs.
import { DIRECTIONS } from '@/studio/instructions'
import { mountCard, mountSet } from '@/studio/instructions/mount'
import { mountCast } from '@/studio/instructions/cast-sheet'
import type { ActivityId, CardKey } from '@/studio/instructions/types'
import type { Lang } from '@/studio/scene'
import type { DirectionId } from '@/studio/style/instruction-profiles'

const q = new URLSearchParams(location.search)
const stage = document.getElementById('stage')!
const api: Record<string, unknown> = { ready: false, error: null, dirs: Object.keys(DIRECTIONS) }
try {
  const view = q.get('view') ?? 'card'
  const dir = (q.get('dir') ?? 'stage') as DirectionId
  const lang = (q.get('lang') ?? 'en') as Lang
  const dpr = window.devicePixelRatio
  if (view === 'card') {
    const m = mountCard(stage, dir, (q.get('act') ?? 'here-you-are') as ActivityId, (q.get('card') ?? 's1') as CardKey, { lang, dpr })
    Object.assign(api, { seek: m.seek, loop: m.card.loop ?? 0, still: m.card.still ?? 0 })
    if (q.get('t')) m.seek(Number(q.get('t')))
  } else if (view === 'set') {
    const pad = q.get('pad') ?? '16'
    stage.style.cssText = `width:100vw;box-sizing:border-box;padding:0 ${pad}px ${pad}px;background:#f4ecdd`
    const s = mountSet(stage, dir, { lang, dpr, cols: Number(q.get('cols') ?? 1), only: (q.get('act') as ActivityId) || undefined, badge: true })
    Object.assign(api, { seek: (t: number) => s.cards.forEach((c) => c.card.loop && c.seek(t)) })
  } else if (view === 'cast') {
    const m = mountCast(stage, (q.get('dir') as DirectionId) || 'stage', dpr)
    Object.assign(api, { seek: m.seek })
  }
  api.ready = true
} catch (e) {
  api.error = String((e as Error).stack ?? e)
}
;(window as unknown as { __inst: unknown }).__inst = api
