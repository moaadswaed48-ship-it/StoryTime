import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { fmt } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { Button, Notice, TextField } from '@/ui/controls'

const KEY = 'storytime.gate.passedAt'
const VALID_MS = 10 * 60_000

function passedRecently(): boolean {
  try {
    const t = Number(sessionStorage.getItem(KEY) ?? 0)
    return Date.now() - t < VALID_MS
  } catch {
    return false
  }
}

/** Two numbers whose product a small child cannot work out: 6-9 times 11-19. Never the same as `not`. */
function question(not?: { a: number; b: number }): { a: number; b: number } {
  const a = 6 + Math.floor(Math.random() * 4)
  const b = 11 + Math.floor(Math.random() * 9)
  return not && a === not.a && b === not.b ? question(not) : { a, b }
}

/**
 * The parent gate (product checklist 17): before settings, passes and purchases. A multiplication a small child
 * cannot do, typed as digits, so it works the same in all four languages. Passing it holds for 10 minutes in this tab.
 */
export function ParentGate({ children, inline }: { children: ReactNode; inline?: boolean }) {
  const { dict } = useLang()
  const t = dict.account.gate
  const navigate = useNavigate()
  const [ok, setOk] = useState<boolean | null>(null)
  const [q, setQ] = useState(() => question())
  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)
  const headingId = useId()

  useEffect(() => setOk(passedRecently()), [])

  if (ok === null) return null
  if (ok) return <>{children}</>

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (Number(answer.trim()) === q.a * q.b) {
      try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* a private tab: the gate simply asks again next time */ }
      setOk(true)
    } else {
      setWrong(true)
      setAnswer('')
      setQ(question(q))
    }
  }

  return (
    <section aria-labelledby={headingId} className={`flex w-full max-w-md flex-col gap-5 ${inline ? '' : 'mx-auto py-6'}`} data-testid="parent-gate">
      {inline ? <h3 id={headingId} className="text-lg font-semibold">{t.title}</h3> : <h1 id={headingId} className="text-3xl font-semibold">{t.title}</h1>}
      <p className="text-ink-muted">{t.lead}</p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <TextField
          label={fmt(t.question, { a: q.a, b: q.b })}
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/[^\d]/g, ''))}
          required
          data-testid="gate-answer"
          data-a={q.a}
          data-b={q.b}
        />
        {wrong && <Notice tone="warning">{t.wrong}</Notice>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{t.submit}</Button>
          {!inline && <Button variant="secondary" onClick={() => navigate(-1)}>{t.back}</Button>}
        </div>
      </form>
    </section>
  )
}
