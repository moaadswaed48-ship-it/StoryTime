import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang } from '@/i18n/config'
import { fmt } from '@/i18n/format'
import type { OwnerDict } from '@/i18n/owner-schema'
import { OwnerError, ownerCodeOf, type OwnerApi } from './data'
import { UPLOAD_LIMITS, type Gap, type PublishProblem } from './data/rules'
import { ENDONYM } from '@/i18n/config'
import type { UploadPurpose } from './data/types'

/** The owner's words, one language at a time, loaded only when the owner's area opens. */
const loaders: Record<Lang, () => Promise<{ default: OwnerDict }>> = {
  ar: () => import('@/i18n/ar/owner'),
  he: () => import('@/i18n/he/owner'),
  en: () => import('@/i18n/en/owner'),
  da: () => import('@/i18n/da/owner'),
}

export function useOwnerDict(lang: Lang): { od: OwnerDict | null; failed: boolean } {
  const [state, setState] = useState<{ lang: Lang; od: OwnerDict } | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let alive = true
    setFailed(false)
    loaders[lang]()
      .then((m) => alive && setState({ lang, od: m.default }))
      .catch(() => alive && setFailed(true))
    return () => void (alive = false)
  }, [lang])
  return { od: state?.lang === lang ? state.od : null, failed }
}

export type OwnerCtx = { od: OwnerDict; api: OwnerApi }
export const OwnerContext = createContext<OwnerCtx | null>(null)
export function useOwner(): OwnerCtx {
  const c = useContext(OwnerContext)
  if (!c) throw new Error('useOwner() outside the owner area')
  return c
}

/** A plain message for any failure, in the owner's language. */
export function ownerError(od: OwnerDict, e: unknown): string {
  switch (ownerCodeOf(e)) {
    case 'network': return od.errors.network
    case 'storage_full': return od.errors.storageFull
    case 'not_found': return od.errors.notFound
    case 'text_locked': return od.errors.textLocked
    case 'trial_limit': return od.errors.trialLimit
    case 'signoff_blocked': return od.errors.signoffBlocked
    case 'publish_blocked': return od.errors.publishBlocked
    case 'not_owner':
    case 'not_signed_in': return od.errors.notOwner
    case 'upload_refused': return uploadRefusal(od, (e as OwnerError).refusal ?? 'type', 'page')
    default: return od.errors.generic
  }
}

const sizeText = (bytes: number) => (bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`)
export const typesText = (p: UploadPurpose) => UPLOAD_LIMITS[p].ext.filter((e) => e !== 'jpeg').map((e) => e.toUpperCase()).join(', ')
/** File types and sizes read left to right even in Arabic and Hebrew: isolated so the sentence stays in order. */
const iso = (s: string) => `\u2066${s}\u2069`
export const limitsText = (od: OwnerDict, p: UploadPurpose) => fmt(od.upload.limits, { types: iso(typesText(p)), size: iso(sizeText(UPLOAD_LIMITS[p].maxBytes)) })

export function uploadRefusal(od: OwnerDict, reason: NonNullable<OwnerError['refusal']>, p: UploadPurpose): string {
  const r = od.upload.refused
  if (reason === 'type') return fmt(r.type, { types: iso(typesText(p)) })
  if (reason === 'size') return fmt(r.size, { size: iso(sizeText(UPLOAD_LIMITS[p].maxBytes)) })
  return r[reason]
}

/** One line per gap or publish problem. Language names are each language's own name. */
export function problemText(od: OwnerDict, p: PublishProblem | Gap): string {
  const g = od.publish.gaps
  const lang = p.lang ? ENDONYM[p.lang] : ''
  switch (p.kind) {
    case 'title': return fmt(g.title, { lang })
    case 'pageText': return fmt(g.pageText, { lang, n: p.page })
    case 'speechWords': return fmt(g.speechWords, { lang, n: p.page })
    case 'picture': return fmt(g.picture, { n: p.page })
    case 'noPages': return g.noPages
    case 'noGroup': return g.noGroup
    case 'notSignedOff': return fmt(g.notSignedOff, { lang })
    case 'noLanguage': return g.noLanguage
    case 'film': return fmt(g.film, { lang })
    case 'captions': return fmt(g.captions, { lang })
    case 'activity': return fmt(g.activity, { lang, field: od.publish.activityFields[p.field] })
    case 'stepCaption': return fmt(g.stepCaption, { lang, n: p.step })
  }
}
