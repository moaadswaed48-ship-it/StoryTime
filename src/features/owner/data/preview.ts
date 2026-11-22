import type { Lang } from '@/i18n/config'
import type { StoryContent } from '@/data/types'
import { hasActivity } from './rules'
import type { OwnerStory } from './types'

/**
 * Turns the owner's draft into exactly the StoryContent a family's screens receive from the data layer
 * (src/data/types.ts), so the preview shows the same data a family would get. `url` resolves a media id to a link.
 * Read-along audio is not part of the owner's area yet (Stage 10), so it is always null here.
 */
export function toStoryContent(s: OwnerStory, lang: Lang, url: (id: string | null) => string | null): StoryContent {
  const t = s.texts[lang]
  const film = s.films[lang]
  const stepMedia = (id: string | null, loop: boolean) => (loop ? { pictureUrl: null, loopUrl: url(id) } : { pictureUrl: url(id), loopUrl: null })
  return {
    id: s.id,
    lang,
    title: t.title,
    credit: s.credit,
    isSample: false,
    pages: s.pages.map((p, i) => {
      const words = t.pages[p.key]
      return {
        pageNo: i + 1,
        display: words?.text ?? '',
        speech: words?.speech?.trim() ? words.speech : (words?.text ?? ''),
        pictureUrl: url(p.pictureId),
        zone: p.zone,
        readAlong: null,
      }
    }),
    film: film.videoId ? { videoUrl: url(film.videoId), posterUrl: url(s.pages[0]?.pictureId ?? null), captionsUrl: url(film.captionsId), captionsLang: lang } : null,
    activity: hasActivity(s)
      ? {
          title: t.activity.title,
          goal: t.activity.goal,
          minutes: null,
          materials: t.activity.materials.map((label, i) => ({ id: `m${i + 1}`, label, pictureUrl: null })),
          steps: s.activity.steps.map((st, i) => ({ n: i + 1, caption: t.activity.steps[st.key] ?? '', ...stepMedia(st.mediaId, st.loop) })),
          safety: t.activity.safety,
          forAdult: t.activity.forAdult,
          inClass: t.activity.inClass,
        }
      : null,
  }
}
