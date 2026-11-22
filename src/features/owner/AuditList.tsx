import { useOwner } from './context'
import type { AuditRow } from './data'
import { ENDONYM, isLang } from '@/i18n/config'
import { formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'

/** The audit log in plain words: when, and what was added, changed or published. */
export function AuditList({ rows, empty }: { rows: AuditRow[]; empty: string }) {
  const { lang } = useLang()
  const { od } = useOwner()
  const c = od.changes
  if (!rows.length) return <p className="text-ink-muted">{empty}</p>
  return (
    <ol className="flex flex-col divide-y divide-line" data-testid="audit-list">
      {rows.map((r) => {
        const action = c.actions[r.action as keyof typeof c.actions] ?? r.action
        const target = c.targets[r.target as keyof typeof c.targets] ?? c.targets.other
        const langs = r.detail.split(',').filter(isLang)
        const langDetail = langs.length && langs.length === r.detail.split(',').length ? langs : []
        return (
          <li key={r.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
            <span className="shrink-0 text-sm text-ink-muted sm:w-48">{formatDate(r.at, lang, true)}</span>
            <span>
              {action}: {target}
              {langDetail.length > 0 && <> · {langDetail.map((l, i) => <span key={l}>{i > 0 && ', '}<bdi lang={l}>{ENDONYM[l]}</bdi></span>)}</>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
