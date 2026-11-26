import { useCallback, useEffect, useState } from 'react'
import { ownerError, useOwner } from '@/features/owner/context'
import type { ContactMessage, Inbox } from '@/features/owner/data'
import { Email, MailLink, StateBadge } from '@/features/owner/ui'
import { ENDONYM } from '@/i18n/config'
import { fmt, formatDate } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button, ChoiceGroup, FieldError, Notice, Spinner } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

type Show = 'open' | 'all'

/**
 * The contact-form inbox (owner's area, part 2): newest first, the number still to handle, and a mark per message.
 * Nothing is emailed by the site: "Write back by email" opens the owner's own email app.
 */
export default function OwnerMessages() {
  const { lang, dict } = useLang()
  const { od, api } = useOwner()
  const t = od.messages
  const [inbox, setInbox] = useState<Inbox | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [show, setShow] = useState<Show>('open')
  const [busy, setBusy] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; text: string } | null>(null)

  const load = useCallback(() => {
    setError(null)
    api.listMessages().then(setInbox, (e) => setError(ownerError(od, e)))
  }, [api, od])
  useEffect(load, [load])

  async function toggle(m: ContactMessage) {
    setBusy(m.id)
    setRowError(null)
    try {
      await api.setMessageHandled(m.id, !m.handledAt)
      setInbox(await api.listMessages())
    } catch (e) {
      setRowError({ id: m.id, text: ownerError(od, e) })
    } finally {
      setBusy(null)
    }
  }

  const list = inbox ? (show === 'open' ? inbox.messages.filter((m) => !m.handledAt) : inbox.messages) : []

  return (
    <div className="flex flex-col gap-6" data-testid="owner-messages">
      <PageTitle title={t.title} lead={t.lead} />
      {error && <Notice tone="error" title={error} action={<Button variant="secondary" onClick={load}>{od.errors.retry}</Button>} />}
      {!inbox && !error && <Spinner label={dict.account.states.loading} />}
      {inbox && (
        <>
          <p role="status" className="-mt-2 text-lg font-semibold" data-testid="unhandled-count">
            {inbox.unhandled ? fmt(t.unhandledCount, { n: inbox.unhandled }) : t.allHandled}
          </p>
          <ChoiceGroup<Show>
            legend={t.filterLegend}
            name="show"
            value={show}
            onChange={setShow}
            columns={2}
            compact
            options={[
              { value: 'open', label: `${t.filterOpen} (${inbox.unhandled})` },
              { value: 'all', label: `${t.filterAll} (${inbox.messages.length})` },
            ]}
          />
          {!list.length ? (
            <p className="rounded-control border border-dashed border-ink/40 p-6 text-ink-muted" data-testid="messages-empty">
              {inbox.messages.length ? t.emptyOpen : t.empty}
            </p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="message-list">
              {list.map((m) => (
                <li key={m.id} className="flex min-w-0 flex-col gap-3 rounded-control border border-line bg-surface p-4" data-testid="message" data-handled={m.handledAt ? 'yes' : 'no'}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StateBadge done={!!m.handledAt}>{m.handledAt ? fmt(t.handledOn, { date: formatDate(m.handledAt, lang) }) : t.filterOpen}</StateBadge>
                    <span className="text-sm text-ink-muted">{fmt(t.received, { date: formatDate(m.createdAt, lang, true) })}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="font-semibold">{m.name ? <bdi>{m.name}</bdi> : <span className="text-ink-muted">{t.noName}</span>}</p>
                    <p className="text-start"><Email value={m.email} /></p>
                    <p className="text-sm text-ink-muted">{fmt(t.writtenIn, { lang: ENDONYM[m.lang] })}</p>
                  </div>
                  <p dir="auto" className="whitespace-pre-wrap break-words text-start" data-testid="message-text">{m.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={m.handledAt ? 'secondary' : 'primary'} busy={busy === m.id} onClick={() => void toggle(m)} data-testid="toggle-handled">
                      {m.handledAt ? t.markOpen : t.markHandled}
                    </Button>
                    <MailLink to={m.email}>{t.reply}</MailLink>
                  </div>
                  {rowError?.id === m.id && <FieldError id={`msg-${m.id}-err`}>{rowError.text}</FieldError>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
