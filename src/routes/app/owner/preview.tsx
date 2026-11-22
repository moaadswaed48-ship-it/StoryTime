import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ownerError, useOwner, useOwnerDict } from '@/features/owner/context'
import type { OwnerStory } from '@/features/owner/data'
import { toStoryContent } from '@/features/owner/data/preview'
import { possibleLangs } from '@/features/owner/data/rules'
import type { PageZone, StoryContent } from '@/data/types'
import { dirOf, ENDONYM, isLang, type Lang } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Notice, Spinner, TextLink } from '@/ui/controls'

/**
 * The story as a family receives it: the same StoryContent the data layer hands the family screens, in the language
 * chosen, built from the saved story. The family reader (page curl, read-along) is the other builder's; until it can
 * be embedded here this shows the same content in a plain book, film and activity view, in that language's direction.
 */
export default function OwnerPreview() {
  const { id = '' } = useParams()
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const [params, setParams] = useSearchParams()
  const [story, setStory] = useState<OwnerStory | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    api.getStory(id).then(async (s) => {
      if (!alive) return
      setStory(s)
      const ids = [...s.pages.map((p) => p.pictureId), ...Object.values(s.films).flatMap((f) => [f.videoId, f.captionsId]), ...s.activity.steps.map((st) => st.mediaId)].filter((x): x is string => !!x)
      const pairs = await Promise.all(ids.map(async (m) => [m, await api.mediaUrl(m).catch(() => '')] as const))
      if (alive) setUrls(Object.fromEntries(pairs.filter(([, u]) => u)))
    }, (e) => alive && setError(ownerError(od, e)))
    return () => void (alive = false)
  }, [api, id, od])

  const langs = story ? possibleLangs(story) : []
  const asked = params.get('l')
  const view: Lang = isLang(asked) && langs.includes(asked) ? asked : langs.includes(lang) ? lang : (langs[0] ?? lang)
  const content = useMemo(() => (story ? toStoryContent(story, view, (m) => (m ? urls[m] ?? null : null)) : null), [story, view, urls])
  const p = od.preview
  // The family view speaks the language being previewed, as it would for a family; the frame around it does not.
  const family = useOwnerDict(view).od?.preview ?? p

  if (error) return <Notice tone="error" title={error} />
  if (!story || !content) return <Spinner label={dict.account.states.loading} />

  return (
    <div className="flex flex-col gap-6" data-testid="owner-preview">
      <TextLink to={localPath(lang, `app/owner/story/${id}`)}>{od.editor.back}</TextLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{p.title}</h1>
        <p className="text-ink-muted">{p.lead}</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{p.langLegend}</legend>
        <div className="flex flex-wrap gap-2">
          {langs.map((l) => (
            <label key={l} className="flex min-h-12 cursor-pointer items-center rounded-control border border-ink/30 px-4 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
              <input type="radio" name="preview-lang" className="sr-only" checked={view === l} onChange={() => setParams({ l }, { replace: true })} />
              <span lang={l}>{ENDONYM[l]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <FamilyView content={content} labels={family} />
    </div>
  )
}

/** One phone-width column in the story's own language and direction: title, book pages, film, activity. */
function FamilyView({ content, labels: p }: { content: StoryContent; labels: ReturnType<typeof useOwner>['od']['preview'] }) {
  const l = content.lang
  return (
    <article lang={l} dir={dirOf(l)} className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-[1.5rem] border border-ink/20 bg-paper p-4 shadow-sm" data-testid="family-view">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-ink-muted">{content.credit === 'author' ? p.authorCredit : p.storytimeCredit}</p>
        <h2 className="text-2xl font-semibold">{content.title || '—'}</h2>
      </header>

      <section aria-label={p.book} className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">{p.book}</h3>
        {content.pages.map((pg) => (
          <figure key={pg.pageNo} className="flex flex-col gap-1" data-testid={`preview-page-${pg.pageNo}`}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line/50">
              {pg.pictureUrl ? <img src={pg.pictureUrl} alt="" className="absolute inset-0 size-full object-cover" /> : <p className="grid size-full place-items-center text-sm text-ink-muted">{p.noPicture}</p>}
              <div className="absolute flex items-center rounded-lg bg-paper/90 p-3" style={zoneStyle(pg.zone)}>
                <p className="text-lg leading-snug">{pg.display || <span className="text-sm text-ink-muted">{p.noWords}</span>}</p>
              </div>
            </div>
            <figcaption className="text-xs text-ink-muted">{fmt(p.page, { n: pg.pageNo, total: content.pages.length })}</figcaption>
          </figure>
        ))}
      </section>

      <section aria-label={p.film} className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{p.film}</h3>
        {content.film?.videoUrl ? (
          <video controls playsInline preload="metadata" poster={content.film.posterUrl ?? undefined} className="w-full rounded-xl bg-black" data-testid="preview-film">
            <source src={content.film.videoUrl} />
            {content.film.captionsUrl && <track kind="captions" src={content.film.captionsUrl} srcLang={content.film.captionsLang} label={p.captions} default />}
          </video>
        ) : (
          <p className="text-ink-muted">{p.noFilm}</p>
        )}
      </section>

      <section aria-label={p.activity} className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">{p.activity}</h3>
        {content.activity ? (
          <>
            <p className="text-lg font-medium">{content.activity.title}</p>
            <p>{content.activity.goal}</p>
            {content.activity.materials.length > 0 && (
              <div>
                <p className="font-medium">{p.materials}</p>
                <ul className="list-disc ps-5">{content.activity.materials.map((m) => <li key={m.id}>{m.label}</li>)}</ul>
              </div>
            )}
            {content.activity.steps.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-medium">{p.steps}</p>
                <ol className="grid grid-cols-2 gap-3">
                  {content.activity.steps.map((st) => (
                    <li key={st.n} className="flex flex-col gap-1">
                      <div className="aspect-square overflow-hidden rounded-lg bg-line/50">
                        {st.loopUrl ? <video src={st.loopUrl} autoPlay muted loop playsInline className="size-full object-cover" /> : st.pictureUrl ? <img src={st.pictureUrl} alt="" className="size-full object-cover" /> : null}
                      </div>
                      <p className="text-sm"><span className="font-semibold">{st.n}.</span> {st.caption}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {content.activity.safety && <p><span className="font-medium">{p.safety}: </span>{content.activity.safety}</p>}
            {content.activity.forAdult && <details><summary className="min-h-11 cursor-pointer font-medium">{p.forAdult}</summary><p className="whitespace-pre-line">{content.activity.forAdult}</p></details>}
            {content.activity.inClass && <details><summary className="min-h-11 cursor-pointer font-medium">{p.inClass}</summary><p className="whitespace-pre-line">{content.activity.inClass}</p></details>}
          </>
        ) : (
          <p className="text-ink-muted">{p.noActivity}</p>
        )}
      </section>
    </article>
  )
}

/** Places the words on the picture with logical sides, so "start" is the right in Arabic and Hebrew. */
function zoneStyle(z: PageZone | null): React.CSSProperties {
  const zone = z ?? { side: 'full', v: 'bottom', size: 'm' }
  const w = zone.side === 'full' ? 'calc(100% - 1rem)' : zone.size === 's' ? '42%' : zone.size === 'm' ? '52%' : '64%'
  const minH = zone.size === 's' ? '22%' : zone.size === 'm' ? '32%' : '45%'
  return {
    width: w, minHeight: minH, margin: 0,
    insetInlineStart: zone.side === 'end' ? 'auto' : '0.5rem',
    insetInlineEnd: zone.side === 'end' ? '0.5rem' : 'auto',
    top: zone.v === 'top' ? '0.5rem' : zone.v === 'middle' ? '50%' : 'auto',
    bottom: zone.v === 'bottom' ? '0.5rem' : 'auto',
    transform: zone.v === 'middle' ? 'translateY(-50%)' : undefined,
  }
}
