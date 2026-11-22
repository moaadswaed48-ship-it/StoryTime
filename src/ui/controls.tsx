import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

/**
 * Plain, well-made controls on the neutral tokens. No brand styling yet (Stage 2 restyles them); what is fixed
 * here is behaviour: 48 px touch targets, visible focus, labels above fields, errors tied to their field,
 * logical (start/end) spacing so right-to-left works, and nothing that appears only on hover.
 * Status colours use Tailwind's default palette until the brand defines its own.
 */

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/90',
  secondary: 'border border-ink/70 bg-surface text-ink hover:bg-line/40',
  quiet: 'text-ink underline underline-offset-4 hover:bg-line/40',
  danger: 'bg-red-800 text-white hover:bg-red-900',
}
const BASE = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 text-base font-medium text-center transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60'

export function Button({ variant = 'primary', busy, wide, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean; wide?: boolean }) {
  return (
    <button type="button" {...rest} disabled={rest.disabled || busy} aria-busy={busy || undefined} className={`${BASE} ${VARIANT[variant]} ${wide ? 'w-full' : ''} ${className}`}>
      {busy && <Spinner small />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant = 'primary', wide, className = '', ...rest }: LinkProps & { variant?: Variant; wide?: boolean }) {
  return <Link {...rest} className={`${BASE} ${VARIANT[variant]} ${wide ? 'w-full' : ''} ${className}`} />
}

/** An inline text link with a full-size touch area. */
export function TextLink({ className = '', ...rest }: LinkProps) {
  return <Link {...rest} className={`inline-flex min-h-11 items-center underline underline-offset-4 ${className}`} />
}

export function Spinner({ small, label }: { small?: boolean; label?: string }) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex items-center gap-3">
      <span aria-hidden="true" className={`${small ? 'size-4' : 'size-7'} animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none`} />
      {label && <span>{label}</span>}
    </span>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string | null; optionalLabel?: string }

/** A labelled text input. The hint and the error are read out with the field. */
export function TextField({ label, hint, error, optionalLabel, className = '', ...input }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-medium">
        {label}
        {optionalLabel && <span className="ms-2 text-sm font-normal text-ink-muted">({optionalLabel})</span>}
      </label>
      {hint && <p id={hintId} className="text-sm text-ink-muted">{hint}</p>}
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        className={`min-h-12 w-full rounded-control border bg-surface px-4 text-base ${input.dir === 'ltr' ? 'rtl:text-right' : ''} ${error ? 'border-red-700' : 'border-ink/40'}`}
      />
      {error && <FieldError id={errId!}>{error}</FieldError>}
    </div>
  )
}

/** A password field with a show/hide button (a real button, not hover) and an optional strength line. */
export function PasswordField({ label, hint, error, showLabel, hideLabel, strength, ...input }: FieldProps & { showLabel: string; hideLabel: string; strength?: string | null }) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const strId = strength ? `${id}-str` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">{label}</label>
      {hint && <p id={hintId} className="text-sm text-ink-muted">{hint}</p>}
      <div className="flex items-stretch gap-2">
        <input
          id={id}
          {...input}
          type={shown ? 'text' : 'password'}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, strId, errId].filter(Boolean).join(' ') || undefined}
          className={`min-h-12 min-w-0 flex-1 rounded-control border bg-surface px-4 text-base rtl:text-right ${error ? 'border-red-700' : 'border-ink/40'}`}
        />
        <button type="button" onClick={() => setShown((v) => !v)} aria-pressed={shown} aria-controls={id} className="min-h-12 shrink-0 rounded-control border border-ink/40 bg-surface px-3 text-sm">
          {shown ? hideLabel : showLabel}
        </button>
      </div>
      {strength && <p id={strId} className="text-sm text-ink-muted" aria-live="polite">{strength}</p>}
      {error && <FieldError id={errId!}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-2 text-sm font-medium text-red-800">
      <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-red-800 text-[10px] font-bold text-white">!</span>
      <span>{children}</span>
    </p>
  )
}

/** A tick box whose whole row (48 px high) is the touch target. */
export function Checkbox({ label, error, children, ...input }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string | null; children?: ReactNode }) {
  const id = useId()
  const errId = error ? `${id}-err` : undefined
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
        <input id={id} type="checkbox" {...input} aria-invalid={error ? true : undefined} aria-describedby={errId} className="mt-0.5 size-6 shrink-0 accent-ink" />
        <span>{label}</span>
      </label>
      {children}
      {error && <FieldError id={errId!}>{error}</FieldError>}
    </div>
  )
}

/** A choice between a few options as large cards (radio buttons). */
export function ChoiceGroup<T extends string>({ legend, name, value, options, onChange, error, columns = 1, compact, legendClass = 'font-medium' }: {
  legend: string
  name: string
  value: T | null
  options: { value: T; label: string; hint?: string; lang?: string }[]
  onChange: (v: T) => void
  error?: string | null
  columns?: 1 | 2 | 3
  /** Short labels: keep the columns on phones too. */
  compact?: boolean
  legendClass?: string
}) {
  const id = useId()
  const errId = error ? `${id}-err` : undefined
  const cols = columns === 3 ? (compact ? 'grid-cols-3' : 'sm:grid-cols-3') : columns === 2 ? (compact ? 'grid-cols-2' : 'sm:grid-cols-2') : ''
  return (
    <fieldset aria-describedby={errId} className="flex flex-col gap-2">
      <legend className={`mb-2 ${legendClass}`}>{legend}</legend>
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className={`flex min-h-14 cursor-pointer items-start rounded-control border border-ink/30 bg-surface ${compact ? 'gap-2 p-3' : 'gap-3 p-4'} has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-1 size-5 shrink-0 accent-ink focus-visible:outline-none" />
            <span className="flex flex-col gap-0.5" lang={o.lang}>
              <span className="font-medium">{o.label}</span>
              {o.hint && <span className="text-sm text-ink-muted">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <FieldError id={errId!}>{error}</FieldError>}
    </fieldset>
  )
}

type Tone = 'info' | 'success' | 'warning' | 'error'
const TONE: Record<Tone, string> = {
  info: 'border-ink/30 bg-surface',
  success: 'border-green-800 bg-green-50 text-green-950',
  warning: 'border-amber-700 bg-amber-50 text-amber-950',
  error: 'border-red-800 bg-red-50 text-red-950',
}

/** A message box. Errors and confirmations are announced (role alert / status). */
export function Notice({ tone = 'info', title, children, action, className = '' }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex flex-col gap-2 rounded-control border-s-4 border p-4 ${TONE[tone]} ${className}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className="flex flex-col gap-2">{children}</div>}
      {action && <div className="flex flex-wrap gap-2 pt-1">{action}</div>}
    </div>
  )
}

/** The visible "placeholder" mark (CLAUDE.md rule 4). */
export function PlaceholderTag({ children }: { children: string }) {
  return <span className="inline-flex items-center rounded-full border border-dashed border-ink-muted px-2.5 py-0.5 text-xs font-medium text-ink-muted">{children}</span>
}

/** A titled block of a page. */
export function Section({ title, children, id, className = '' }: { title: string; children: ReactNode; id?: string; className?: string }) {
  const hid = useId()
  return (
    <section id={id} aria-labelledby={hid} className={`flex flex-col gap-4 rounded-control border border-line bg-surface p-5 ${className}`}>
      <h2 id={hid} className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}
