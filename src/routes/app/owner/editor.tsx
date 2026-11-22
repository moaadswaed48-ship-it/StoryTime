import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBlocker, useParams } from 'react-router'
import { ownerError, problemText, useOwner } from '@/features/owner/context'
import type { AuditRow, OwnerStory, StoryDraft } from '@/features/owner/data'
import { blockingGaps, possibleLangs, publishProblems, sharedGaps, signoffValid, softGaps, targetLangs } from '@/features/owner/data/rules'
import { DEFAULT_ZONE } from '@/features/owner/data/types'
import { FileField, LangGrid, LangText, ZonePicker } from '@/features/owner/ui'
import { AuditList } from '@/features/owner/AuditList'
import { AGE_GROUPS } from '@/data/types'
import { ENDONYM, type Lang } from '@/i18n/config'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Button, ButtonLink, Checkbox, Notice, Section, Spinner, TextLink } from '@/ui/controls'

const newKey = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
const toDraft = (s: OwnerStory): StoryDraft => JSON.parse(JSON.stringify({ groups: s.groups, pages: s.pages, texts: s.texts, films: s.films, activity: s.activity }))

/**
 * Create and edit one story: age groups and trial marks, titles, pages (picture, where the words sit, words in four
 * languages), the film per language, the activity, then check each language and publish.
 * Edits stay on screen until "Save changes"; files are stored as soon as they are chosen.
 */
export default function OwnerEditor() {
  const { id = '' } = useParams()
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const [story, setStory] = useState<OwnerStory | null>(null)
  const [draft, setDraft] = useState<StoryDraft | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [audit, setAudit] = useState<AuditRow[] | null>(null)

  const load = useCallback(() => {
    setLoadError(null)
    api.getStory(id).then((s) => {
      setStory(s)
      setDraft(toDraft(s))
    }, (e) => setLoadError(ownerError(od, e)))
    api.listAudit(id).then(setAudit, () => setAudit([]))
  }, [api, id, od])
  useEffect(load, [load])

  const dirty = !!story && !!draft && JSON.stringify(toDraft(story)) !== JSON.stringify(draft)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(od.editor.leaveWarning)) blocker.proceed()
    else blocker.reset()
  }, [blocker, od])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (loadError) return <Notice tone="error" title={loadError} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />
  if (!story || !draft) return <Spinner label={dict.account.states.loading} />

  const langs = possibleLangs(story)
  const locked = story.textLocked
  const edit = (fn: (d: StoryDraft) => void) => {
    setMessage(null)
    setDraft((d) => {
      const next = JSON.parse(JSON.stringify(d)) as StoryDraft
      fn(next)
      return next
    })
  }
  const after = async (p: Promise<OwnerStory>, done?: string) => {
    setSaving(true)
    setMessage(null)
    try {
      const s = await p
      setStory(s)
      setDraft(toDraft(s))
      if (done) setMessage({ tone: 'success', text: done })
      api.listAudit(id).then(setAudit, () => {})
      return true
    } catch (e) {
      setMessage({ tone: 'error', text: ownerError(od, e) })
      return false
    } finally {
      setSaving(false)
    }
  }
  const save = () => after(api.saveStory(id, draft), od.editor.saved)
  const e = od.editor
  const titleOf = story.texts[lang]?.title || story.texts.ar.title || story.texts.en.title || od.list.untitled

  return (
    <div className="flex flex-col gap-6 pb-28" data-testid="owner-editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TextLink to={localPath(lang, 'app/owner')}>{e.back}</TextLink>
        <ButtonLink variant="secondary" to={localPath(lang, `app/owner/story/${id}/preview`)} data-testid="open-preview">{e.preview}</ButtonLink>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-balance">{titleOf}</h1>
        <p className="text-ink-muted" data-testid="story-status">
          {story.status === 'published' ? fmt(od.publish.isPublished, { langs: targetLangs(story, story.publishLangs).map((l) => ENDONYM[l]).join(', ') }) : od.publish.isDraft}
        </p>
        {story.status === 'published' && <Notice tone="warning">{e.publishedWarning}</Notice>}
        {locked && <Notice tone="info">{e.lockedNote}</Notice>}
      </div>

      <Section title={e.sections.groups}>
        <p className="text-ink-muted">{e.groupsLead}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {AGE_GROUPS.map((g) => {
            const row = draft.groups.find((x) => x.group === g)
            return (
              <div key={g} className="flex flex-col rounded-control border border-line p-3">
                <Checkbox
                  label={<span className="font-medium">{dict.commerce.groups[g]}</span>}
                  checked={!!row}
                  onChange={(ev) => edit((d) => {
                    d.groups = ev.target.checked ? [...d.groups, { group: g, trial: false }] : d.groups.filter((x) => x.group !== g)
                  })}
                />
                {row && (
                  <Checkbox
                    label={<span className="text-sm">{e.trialToggle}</span>}
                    checked={row.trial}
                    onChange={(ev) => edit((d) => void (d.groups.find((x) => x.group === g)!.trial = ev.target.checked))}
                  />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-sm text-ink-muted">{e.trialLimit}</p>
      </Section>

      <Section title={e.sections.titles}>
        <LangGrid langs={langs}>
          {(l) => (
            <div className="flex flex-col gap-3">
              <LangText lang={l} label={e.titleLabel} required readOnly={locked && l === 'ar'} value={draft.texts[l].title} onChange={(v) => edit((d) => void (d.texts[l].title = v))} testId={`title-${l}`} />
              <LangText lang={l} label={e.teaserLabel} note={e.teaserHint} value={draft.texts[l].teaser} onChange={(v) => edit((d) => void (d.texts[l].teaser = v))} />
            </div>
          )}
        </LangGrid>
      </Section>

      <Section title={e.sections.pages}>
        <ol className="flex flex-col gap-6">
          {draft.pages.map((p, i) => (
            <li key={p.key} className="flex flex-col gap-4 rounded-control border border-ink/20 p-3 sm:p-4" data-testid={`page-${i + 1}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{fmt(e.pageN, { n: i + 1 })}</h3>
                {!locked && draft.pages.length > 1 && (
                  <Button variant="quiet" onClick={() => window.confirm(fmt(e.removeConfirm, { n: i + 1 })) && edit((d) => void d.pages.splice(i, 1))}>{e.removePage}</Button>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <FileField purpose="page" label={e.picture} hint={e.pictureHint} currentId={p.pictureId} testId={`page-${i + 1}-picture`} onUploaded={(rec) => edit((d) => void (d.pages[i]!.pictureId = rec.id))} />
                <ZonePicker name={`zone-${p.key}`} zone={p.zone} onChange={(z) => edit((d) => void (d.pages[i]!.zone = z))} />
              </div>
              <LangGrid langs={langs}>
                {(l) => {
                  const words = draft.texts[l].pages[p.key] ?? { text: '', speech: '' }
                  const set = (k: 'text' | 'speech') => (v: string) => edit((d) => void (d.texts[l].pages[p.key] = { ...(d.texts[l].pages[p.key] ?? { text: '', speech: '' }), [k]: v }))
                  return (
                    <div className="flex flex-col gap-2">
                      <LangText lang={l} label={e.text} multiline rows={4} required readOnly={locked && l === 'ar'} value={words.text} onChange={set('text')} testId={`page-${i + 1}-text-${l}`} />
                      <details open={!!words.speech} className="rounded-control border border-line px-3 py-1">
                        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">{e.speech}</summary>
                        <LangText lang={l} label="" note={e.speechHint} multiline rows={3} readOnly={locked && l === 'ar'} value={words.speech} onChange={set('speech')} />
                      </details>
                    </div>
                  )
                }}
              </LangGrid>
            </li>
          ))}
        </ol>
        {!locked && (
          <div>
            <Button variant="secondary" data-testid="add-page" onClick={() => edit((d) => void d.pages.push({ key: newKey(), pictureId: null, zone: { ...DEFAULT_ZONE } }))}>{e.addPage}</Button>
          </div>
        )}
      </Section>

      <Section title={e.sections.film}>
        <p className="text-ink-muted">{e.filmLead}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {langs.map((l) => (
            <fieldset key={l} className="flex flex-col gap-3">
              <legend className="mb-2 font-semibold" lang={l}>{ENDONYM[l]}</legend>
              <FileField purpose="film" label={e.filmFile} currentId={draft.films[l].videoId} testId={`film-${l}`} onUploaded={(rec) => edit((d) => void (d.films[l].videoId = rec.id))} />
              <FileField purpose="captions" label={e.captionsFile} hint={e.captionsHint} currentId={draft.films[l].captionsId} testId={`captions-${l}`} onUploaded={(rec) => edit((d) => void (d.films[l].captionsId = rec.id))} />
            </fieldset>
          ))}
        </div>
      </Section>

      <Section title={e.sections.activity}>
        <p className="text-ink-muted">{e.activityLead}</p>
        <LangGrid langs={langs}>
          {(l) => {
            const a = draft.texts[l].activity
            const set = (k: 'title' | 'goal' | 'safety' | 'forAdult' | 'inClass') => (v: string) => edit((d) => void (d.texts[l].activity[k] = v))
            return (
              <div className="flex flex-col gap-3">
                <LangText lang={l} label={e.activityTitle} value={a.title} onChange={set('title')} />
                <LangText lang={l} label={e.goal} value={a.goal} onChange={set('goal')} />
                <LangText lang={l} label={e.materials} note={e.materialsHint} multiline rows={4} value={a.materials.join('\n')} onChange={(v) => edit((d) => void (d.texts[l].activity.materials = v.split('\n')))} />
                <LangText lang={l} label={e.safety} multiline rows={2} value={a.safety} onChange={set('safety')} />
                <LangText lang={l} label={e.forAdult} multiline rows={5} value={a.forAdult} onChange={set('forAdult')} />
                <LangText lang={l} label={e.inClass} multiline rows={3} value={a.inClass} onChange={set('inClass')} />
              </div>
            )
          }}
        </LangGrid>
        <h3 className="mt-2 text-lg font-semibold">{e.stepsTitle}</h3>
        <ol className="flex flex-col gap-4">
          {draft.activity.steps.map((st, i) => (
            <li key={st.key} className="flex flex-col gap-3 rounded-control border border-ink/20 p-3" data-testid={`step-${i + 1}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold">{fmt(e.stepN, { n: i + 1 })} {st.loop && <span className="ms-2 rounded-full border border-ink/40 px-2 py-0.5 text-xs">{e.loopBadge}</span>}</h4>
                <Button variant="quiet" onClick={() => edit((d) => void d.activity.steps.splice(i, 1))}>{e.removeStep}</Button>
              </div>
              <FileField purpose="step" label={e.stepMedia} hint={e.stepMediaHint} currentId={st.mediaId} onUploaded={(rec) => edit((d) => void (d.activity.steps[i] = { ...d.activity.steps[i]!, mediaId: rec.id, loop: rec.kind === 'video' }))} />
              <LangGrid langs={langs}>
                {(l) => <LangText lang={l} label={e.stepCaption} required value={draft.texts[l].activity.steps[st.key] ?? ''} onChange={(v) => edit((d) => void (d.texts[l].activity.steps[st.key] = v))} />}
              </LangGrid>
            </li>
          ))}
        </ol>
        <div>
          <Button variant="secondary" onClick={() => edit((d) => void d.activity.steps.push({ key: newKey(), mediaId: null, loop: false }))}>{e.addStep}</Button>
        </div>
      </Section>

      <PublishSection story={story} dirty={dirty} busy={saving} run={after} />

      <Section title={e.sections.history}>
        <p className="text-ink-muted">{e.historyLead}</p>
        {audit ? <AuditList rows={audit.slice(0, 15)} empty={e.historyEmpty} /> : <Spinner small />}
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p role="status" className={`text-sm ${message?.tone === 'error' ? 'font-medium text-red-800' : message ? 'text-green-900' : 'text-ink-muted'}`} data-testid="save-state">
            {message?.text ?? (dirty ? e.unsaved : '')}
          </p>
          <Button onClick={save} busy={saving} disabled={!dirty} data-testid="save-story">{e.save}</Button>
        </div>
      </div>
    </div>
  )
}

/** Each language's state, "mark as checked", the languages to publish in, and what still stands in the way. */
function PublishSection({ story, dirty, busy, run }: { story: OwnerStory; dirty: boolean; busy: boolean; run: (p: Promise<OwnerStory>, done?: string) => Promise<boolean> }) {
  const { lang } = useLang()
  const { od, api } = useOwner()
  const p = od.publish
  const langs = possibleLangs(story)
  const [scope, setScope] = useState<'all' | 'only'>(story.publishLangs ? 'only' : 'all')
  const [only, setOnly] = useState<Lang[]>(story.publishLangs ?? langs.filter((l) => signoffValid(story, l)))
  const chosen = scope === 'all' || story.credit === 'author' ? null : only
  const problems = useMemo(() => publishProblems(story, chosen), [story, chosen])
  const soft = useMemo(() => targetLangs(story, chosen).flatMap((l) => softGaps(story, l)), [story, chosen])
  const shared = sharedGaps(story).length

  return (
    <Section title={od.editor.sections.publish}>
      <p className="text-ink-muted">{p.lead}</p>
      <ul className="flex flex-col divide-y divide-line border-y border-line" data-testid="lang-table" aria-label={p.colLang}>
        {langs.map((l) => {
          const gaps = blockingGaps(story, l).length + shared
          const so = story.signoffs[l]
          const valid = signoffValid(story, l)
          const state = valid ? fmt(p.stateChecked, { date: formatDate(so!.at, lang) }) : so ? p.stateStale : gaps ? fmt(p.stateMissing, { n: gaps }) : p.stateReady
          return (
            <li key={l} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2" data-testid={`signoff-${l}`}>
              <span className="flex flex-col">
                <span className="font-medium" lang={l}>{ENDONYM[l]}</span>
                <span className={`text-sm ${valid ? 'text-green-900' : so ? 'text-amber-900' : 'text-ink-muted'}`}>{state}</span>
              </span>
              {valid ? (
                <Button variant="quiet" disabled={busy} onClick={() => void run(api.withdrawSignOff(story.id, l))}>{p.withdraw}</Button>
              ) : (
                <Button variant="secondary" disabled={busy || dirty || blockingGaps(story, l).length > 0} onClick={() => void run(api.signOff(story.id, l))} data-testid={`signoff-${l}-button`}>{p.signOff}</Button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-sm text-ink-muted">{p.signOffHint}</p>

      {story.credit === 'author' ? (
        <p>{p.authorOnlyArabic}</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">{p.scopeLegend}</legend>
          <label className="flex min-h-12 items-center gap-3"><input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')} className="size-5 accent-ink" />{p.scopeAll}</label>
          <label className="flex min-h-12 items-center gap-3"><input type="radio" name="scope" checked={scope === 'only'} onChange={() => setScope('only')} className="size-5 accent-ink" data-testid="scope-only" />{p.scopeOnly}</label>
          {scope === 'only' && (
            <div className="flex flex-wrap gap-x-4 ps-8">
              {langs.map((l) => (
                <Checkbox key={l} label={<span lang={l}>{ENDONYM[l]}</span>} checked={only.includes(l)} onChange={(ev) => setOnly((o) => (ev.target.checked ? [...o, l] : o.filter((x) => x !== l)))} data-testid={`only-${l}`} />
              ))}
            </div>
          )}
        </fieldset>
      )}

      {problems.length > 0 && (
        <Notice tone="warning" title={p.problemsTitle}>
          <ul className="list-disc ps-5" data-testid="publish-problems">{problems.map((x, i) => <li key={i}>{problemText(od, x)}</li>)}</ul>
        </Notice>
      )}
      {soft.length > 0 && (
        <details className="rounded-control border border-line px-3 py-1">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">{p.softTitle} ({soft.length})</summary>
          <ul className="list-disc pb-2 ps-5 text-sm">{soft.map((x, i) => <li key={i}>{problemText(od, x)}</li>)}</ul>
        </details>
      )}
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || dirty || problems.length > 0} onClick={() => void run(api.publish(story.id, chosen), p.publishedDone)} data-testid="publish">{p.publish}</Button>
        {story.status === 'published' && <Button variant="secondary" disabled={busy} onClick={() => void run(api.unpublish(story.id), p.unpublishedDone)} data-testid="unpublish">{p.unpublish}</Button>}
      </div>
    </Section>
  )
}
