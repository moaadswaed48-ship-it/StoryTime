import { useCallback, useEffect, useState } from 'react'
import { AuditList } from '@/features/owner/AuditList'
import { ownerError, useOwner } from '@/features/owner/context'
import type { AuditRow } from '@/features/owner/data'
import { useLang } from '@/i18n/use-dict'
import { Button, Notice, Spinner } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

/** The audit log: every change to stories and files, newest first. */
export default function OwnerChanges() {
  const { dict } = useLang()
  const { od, api } = useOwner()
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    setError(null)
    api.listAudit().then(setRows, (e) => setError(ownerError(od, e)))
  }, [api, od])
  useEffect(load, [load])
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={od.changes.title} lead={od.changes.lead} />
      {error && <Notice tone="error" title={error} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />}
      {!rows && !error && <Spinner label={dict.account.states.loading} />}
      {rows && <AuditList rows={rows.slice(0, 200)} empty={od.changes.empty} />}
    </div>
  )
}
