import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ownerError, useOwner } from '@/features/owner/context'
import type { OwnerStorySummary } from '@/features/owner/data'
import { ENDONYM, LANGS } from '@/i18n/config'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { localPath } from '@/seo/paths'
import { Button, Notice, Spinner } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

/** Every story with its state, age groups and what is missing per language. */
export default function OwnerStories() {
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const navigate = useNavigate()
  const [stories, setStories] = useState<OwnerStorySummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setError(null)
    api.listStories().then(setStories, (e) => setError(ownerError(od, e)))
  }, [api, od])
  useEffect(load, [load])

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const s = await api.createStory()
      navigate(localPath(lang, `app/owner/story/${s.id}`))
    } catch (e) {
      setError(ownerError(od, e))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle title={od.list.title} lead={od.list.lead} />
        <Button onClick={create} busy={busy} data-testid="new-story">{od.list.newStory}</Button>
      </div>
      {error && <Notice tone="error" title={error} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />}
      {!stories && !error && <Spinner label={dict.account.states.loading} />}
      {stories && !stories.length && (
        <div className="rounded-control border border-dashed border-ink/40 p-6">
          <p className="text-lg font-semibold">{od.list.empty}</p>
          <p className="mt-1 text-ink-muted">{od.list.emptyLead}</p>
        </div>
      )}
      {stories && stories.length > 0 && (
        <ul className="flex flex-col gap-3" data-testid="owner-story-list">
          {stories.map((s) => {
            const title = s.titles[lang] ?? s.titles.ar ?? s.titles.en ?? Object.values(s.titles)[0] ?? od.list.untitled
            const titleLang = s.titles[lang] ? lang : (Object.keys(s.titles)[0] ?? lang)
            return (
              <li key={s.id} className="rounded-control border border-line bg-surface">
                <Link to={localPath(lang, `app/owner/story/${s.id}`)} className="flex flex-col gap-3 p-4 hover:bg-line/30">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.status === 'published' ? 'bg-green-100 text-green-950' : 'border border-ink/40 text-ink'}`}>
                      {s.status === 'published' ? od.list.published : od.list.draft}
                    </span>
                    {s.credit === 'author' && <span className="rounded-full border border-ink/40 px-2.5 py-0.5 text-xs">{od.list.authorBadge}</span>}
                    <span className="text-lg font-semibold" lang={titleLang}>{title}</span>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {s.groups.length
                      ? s.groups.map((g) => `${dict.commerce.groups[g.group]}${g.trial ? ` (${od.list.trialMark})` : ''}`).join(' · ')
                      : od.list.noGroups}
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label={od.publish.colLang}>
                    {LANGS.map((l) => {
                      const offered = s.credit !== 'author' || l === 'ar'
                      const state = !offered ? od.list.langNotOffered : s.signedOff[l] ? od.list.langChecked : s.missing[l] ? fmt(od.list.langMissing, { n: s.missing[l] }) : od.list.langReady
                      const tone = !offered ? 'text-ink-muted' : s.signedOff[l] ? 'border-green-800 text-green-950' : s.missing[l] ? 'border-amber-700 text-amber-950' : ''
                      return (
                        <li key={l} className={`rounded-control border border-line px-2 py-1 text-sm ${tone}`} data-testid={`lang-state-${l}`}>
                          <span lang={l} className="font-medium">{ENDONYM[l]}</span>: {state}
                        </li>
                      )
                    })}
                  </ul>
                  <p className="text-xs text-ink-muted">{fmt(od.list.updated, { date: formatDate(s.updatedAt, lang, true) })}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
