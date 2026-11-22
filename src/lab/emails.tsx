import { useEffect, useState } from 'react'
import { render, toPlainText } from 'react-email'
import { buildEmail } from '@/emails/render'
import { sampleParams } from '@/emails/samples'
import { isMarketing, TEMPLATES, type TemplateId } from '@/emails/types'
import { ENDONYM, LANGS, type Lang } from '@/i18n/config'

/**
 * Lab: every email in every language, rendered the way it is sent (dev builds only, like the rest of /lab).
 * The "preview" transport (src/emails/preview-transport.ts) writes the same HTML to disk; nothing is sent from here.
 * English labels only: lab pages never ship.
 */
export default function LabEmails() {
  const [template, setTemplate] = useState<TemplateId>('confirm_email')
  const [lang, setLang] = useState<Lang>('ar')
  const [out, setOut] = useState<{ subject: string; preview: string; html: string; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    const built = buildEmail(template, lang, sampleParams(lang)[template] as never)
    render(built.element).then((html) => {
      if (alive) setOut({ subject: built.subject, preview: built.preview, html, text: toPlainText(html, { selectors: [{ selector: 'h1', options: { uppercase: false } }] }) })
    })
    return () => void (alive = false)
  }, [template, lang])

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Emails</h1>
      <p className="max-w-prose text-sm text-ink-muted">Sample data only. Service emails carry facts, never an offer; the news email is marked and has a one-click unsubscribe.</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <select value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)} className="min-h-11 rounded-control border border-ink/40 bg-surface px-2" data-testid="lab-email-template">
            {TEMPLATES.map((t) => <option key={t} value={t}>{t}{isMarketing(t) ? ' (news)' : ''}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Language
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="min-h-11 rounded-control border border-ink/40 bg-surface px-2" data-testid="lab-email-lang">
            {LANGS.map((l) => <option key={l} value={l}>{ENDONYM[l]}</option>)}
          </select>
        </label>
      </div>
      {out && (
        <div className="flex flex-col gap-4">
          <dl className="grid gap-1 text-sm">
            <dt className="font-medium">Subject</dt>
            <dd dir="auto" data-testid="lab-email-subject">{out.subject}</dd>
            <dt className="font-medium">Preview line</dt>
            <dd dir="auto">{out.preview}</dd>
          </dl>
          <div className="flex flex-wrap gap-4">
            <iframe title="Email at phone width" srcDoc={out.html} className="h-[900px] w-[390px] max-w-full rounded-control border border-line bg-white" />
            <pre dir="auto" className="max-h-[900px] min-w-0 flex-1 overflow-auto whitespace-pre-wrap rounded-control border border-line bg-surface p-3 text-xs">{out.text}</pre>
          </div>
        </div>
      )}
    </main>
  )
}
