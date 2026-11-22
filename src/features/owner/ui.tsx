import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { dirOf, ENDONYM, type Lang } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import { FieldError, Spinner } from '@/ui/controls'
import { limitsText, ownerError, uploadRefusal, useOwner } from './context'
import { OwnerError } from './data'
import { UPLOAD_LIMITS } from './data/rules'
import { ZONE_SIDES, ZONE_SIZES, ZONE_VS, type MediaRecord, type MediaSource, type TextZone, type UploadPurpose } from './data/types'

/**
 * Building blocks of the owner's editor. Plain and large: labels above fields, 48 px targets, a visible marker on
 * every missing translation, right-to-left fields for Arabic and Hebrew.
 */

/** A field per language, side by side on wide screens and one under the other on a phone. */
export function LangGrid({ langs, children }: { langs: Lang[]; children: (l: Lang) => ReactNode }) {
  const cols = langs.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : langs.length > 1 ? 'md:grid-cols-2' : ''
  return <div className={`grid gap-4 ${cols}`}>{langs.map((l) => <div key={l} className="min-w-0">{children(l)}</div>)}</div>
}

/** A text field for one language: its own direction, its language tag, and a "Missing" marker when empty. */
export function LangText({ lang, label, value, onChange, multiline, rows = 3, required, readOnly, note, testId }: {
  lang: Lang
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  rows?: number
  required?: boolean
  readOnly?: boolean
  note?: string
  testId?: string
}) {
  const { od } = useOwner()
  const id = useId()
  const missing = required && !value.trim()
  const cls = `w-full rounded-control border bg-surface px-3 py-2.5 text-base ${missing ? 'border-amber-700 border-dashed' : 'border-ink/40'} ${readOnly ? 'bg-line/30' : ''}`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex flex-wrap items-center gap-2 font-medium">
        <span lang={lang}>{ENDONYM[lang]}</span>
        <span className="text-sm font-normal text-ink-muted">{label}</span>
        {missing && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950" data-testid="missing-mark">{od.editor.missing}</span>}
      </label>
      {note && <p className="text-sm text-ink-muted">{note}</p>}
      {multiline ? (
        <textarea id={id} lang={lang} dir={dirOf(lang)} rows={rows} value={value} readOnly={readOnly} aria-readonly={readOnly || undefined} onChange={(e) => onChange(e.target.value)} className={cls} data-testid={testId} />
      ) : (
        <input id={id} lang={lang} dir={dirOf(lang)} value={value} readOnly={readOnly} aria-readonly={readOnly || undefined} onChange={(e) => onChange(e.target.value)} className={`${cls} min-h-12`} data-testid={testId} />
      )}
    </div>
  )
}

/** Where the words sit: reading side / other side / full width, top / middle / bottom, and how much room. */
export function ZonePicker({ zone, onChange, name }: { zone: TextZone; onChange: (z: TextZone) => void; name: string }) {
  const { od } = useOwner()
  const z = od.editor
  const group = <K extends keyof TextZone>(key: K, values: readonly TextZone[K][], labels: Record<string, string>, legend: string) => (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className="grid grid-cols-3 gap-1.5">
        {values.map((v) => (
          <label key={v} className="flex min-h-12 cursor-pointer items-center justify-center rounded-control border border-ink/30 bg-surface px-2 text-center text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
            <input type="radio" className="sr-only" name={`${name}-${key}`} value={v} checked={zone[key] === v} onChange={() => onChange({ ...zone, [key]: v })} />
            {labels[v]}
          </label>
        ))}
      </div>
    </fieldset>
  )
  // A small sketch of the page: the shaded block is where the words go (mirrors with the screen's direction).
  const h = zone.size === 's' ? '28%' : zone.size === 'm' ? '40%' : '55%'
  const w = zone.side === 'full' ? '100%' : zone.size === 's' ? '40%' : zone.size === 'm' ? '50%' : '62%'
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">{z.zoneLegend}</p>
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <div aria-hidden="true" className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md border border-ink/40 bg-line/40">
          <div
            className="absolute rounded-sm bg-ink/70"
            style={{
              height: h, width: w,
              insetInlineStart: zone.side === 'end' ? 'auto' : 0, insetInlineEnd: zone.side === 'end' ? 0 : 'auto',
              top: zone.v === 'top' ? 0 : zone.v === 'middle' ? `calc(50% - ${h} / 2)` : 'auto', bottom: zone.v === 'bottom' ? 0 : 'auto',
            }}
          />
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          {group('side', ZONE_SIDES, z.zoneSide, z.zoneSideLegend)}
          {group('v', ZONE_VS, z.zoneV, z.zoneVLegend)}
          {group('size', ZONE_SIZES, z.zoneSize, z.zoneSizeLegend)}
        </div>
      </div>
      <p className="text-sm text-ink-muted">{z.zoneHint}</p>
    </div>
  )
}

/** Shows a stored file: a picture, a playing film or loop, or the caption file's name. */
export function MediaPreview({ id, kind, label }: { id: string; kind?: 'image' | 'video' | 'captions'; label: string }) {
  const { api } = useOwner()
  const [url, setUrl] = useState<string | null>(null)
  const [rec, setRec] = useState<MediaRecord | null>(null)
  useEffect(() => {
    let alive = true
    api.getMedia([id]).then(([m]) => alive && setRec(m ?? null)).catch(() => {})
    api.mediaUrl(id).then((u) => alive && setUrl(u)).catch(() => {})
    return () => void (alive = false)
  }, [api, id])
  const k = rec?.kind ?? kind
  if (!url) return <div className="grid h-28 place-items-center rounded-control bg-line/40"><Spinner small /></div>
  if (k === 'image') return <img src={url} alt={label} className="max-h-56 w-full rounded-control border border-line bg-line/30 object-contain" />
  if (k === 'video') return <video src={url} controls muted playsInline loop className="max-h-56 w-full rounded-control border border-line bg-black" aria-label={label} />
  return <p className="rounded-control border border-line px-3 py-2 text-sm" dir="ltr">{rec?.fileName}</p>
}

/**
 * Choose a file and say where it comes from (the ownership pack). The file is checked (type, real content, size,
 * licence) and stored at once; the caller puts its id into the story, which is kept when the story is saved.
 */
export function FileField({ purpose, label, hint, currentId, onUploaded, testId }: {
  purpose: UploadPurpose
  label: string
  hint?: string
  currentId: string | null
  onUploaded: (rec: MediaRecord) => void
  testId?: string
}) {
  const { od, api } = useOwner()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<MediaSource>('upload')
  const [credit, setCredit] = useState('')
  const [licence, setLicence] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const u = od.upload
  const accept = [...UPLOAD_LIMITS[purpose].mimes, ...UPLOAD_LIMITS[purpose].ext.map((e) => `.${e}`)].join(',')

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const own = source !== 'third_party'
      const rec = await api.upload(file, { purpose, source, licence: own ? 'own work' : licence, credit: own ? null : credit })
      onUploaded(rec)
    } catch (e) {
      setError(e instanceof OwnerError && e.code === 'upload_refused' ? uploadRefusal(od, e.refusal ?? 'type', purpose) : ownerError(od, e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-control border border-line p-3" data-testid={testId}>
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
        <p className="text-sm text-ink-muted" dir="auto">{limitsText(od, purpose)}</p>
      </div>
      {currentId && <MediaPreview id={currentId} label={label} />}
      <details className="rounded-control border border-line px-3">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <span className="font-medium">{u.sourceLegend}</span>
          <span className="text-ink-muted">{source === 'upload' ? u.sourceOwn : source === 'studio' ? u.sourceStudio : u.sourceOther}</span>
        </summary>
      <fieldset className="flex flex-col gap-1.5 pb-3">
        <legend className="sr-only">{u.sourceLegend}</legend>
        <div className="grid gap-1.5 sm:grid-cols-3">
          {([['upload', u.sourceOwn], ['studio', u.sourceStudio], ['third_party', u.sourceOther]] as const).map(([v, l]) => (
            <label key={v} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-control border border-ink/30 px-3 text-sm has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink">
              <input type="radio" name={`${id}-source`} checked={source === v} onChange={() => setSource(v)} className="size-5 accent-ink" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      {source === 'third_party' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {u.credit}
            <input value={credit} onChange={(e) => setCredit(e.target.value)} className="min-h-12 rounded-control border border-ink/40 bg-surface px-3 text-base font-normal" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {u.licence}
            <input value={licence} onChange={(e) => setLicence(e.target.value)} className="min-h-12 rounded-control border border-ink/40 bg-surface px-3 text-base font-normal" />
            <span className="font-normal text-ink-muted">{u.licenceHint}</span>
          </label>
        </div>
      )}
      </details>
      <div>
        <label htmlFor={id} className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-control border border-ink/70 bg-surface px-5 font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${busy ? 'opacity-60' : ''}`}>
          {busy && <Spinner small />}
          {busy ? u.uploading : currentId ? u.replace : u.choose}
          <input ref={input} id={id} type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} data-testid={testId ? `${testId}-input` : undefined} />
        </label>
      </div>
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  )
}

export { fmt }
