import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { getApi } from '@/data'
import { codeOf, type ErrorCode } from '@/data/errors'
import { daysLeft, passView } from '@/data/rules'
import { MIN_PASSWORD } from '@/data/validate'
import { AGE_GROUPS, type AgeGroup, type Learner, type Order } from '@/data/types'
import { useAccess } from '@/features/access/useAccess'
import { errorText, strengthOf } from '@/features/account/messages'
import { ParentGate } from '@/features/account/ParentGate'
import { justDeleted } from '@/features/account/parts'
import { useSession } from '@/features/account/session'
import { CancelPass } from '@/features/commerce/CancelPass'
import { ENDONYM, LANGS, type Lang } from '@/i18n/config'
import { fmt, formatDate, formatShekels } from '@/i18n/format'
import { useLang } from '@/i18n/use-dict'
import { privateMeta } from '@/seo/meta'
import { localPath } from '@/seo/paths'
import { Button, Checkbox, ChoiceGroup, Notice, PasswordField, PlaceholderTag, Section, Spinner, TextField } from '@/ui/controls'
import { PageTitle } from '@/ui/Shell'

export const meta = () => privateMeta('StoryTime')

/** Settings, behind the parent gate (product checklist 13 and 17). */
export default function Settings() {
  const { dict } = useLang()
  return (
    <ParentGate>
      <PageTitle title={dict.account.settings.title} />
      <div className="flex flex-col gap-6">
        <AccountSection />
        <LanguageSection />
        <ProfilesSection />
        <PassesSection />
        <NewsSection />
        <PasswordSection />
        <DataSection />
        <DeleteSection />
      </div>
    </ParentGate>
  )
}

/** Runs an action with busy, error and "saved" states. */
function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [done, setDone] = useState(false)
  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      await fn()
      setDone(true)
    } catch (e) {
      setError(codeOf(e))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, done, run, setDone }
}

function AccountSection() {
  const { lang, dict } = useLang()
  const t = dict.account.settings
  const session = useSession()
  const navigate = useNavigate()
  const account = session.status === 'signed-in' ? session.account : null
  if (!account) return null
  return (
    <Section title={t.accountTitle}>
      <p className="font-medium"><bdi>{account.email}</bdi></p>
      <p className="text-ink-muted">{account.role === 'teacher' ? t.roleTeacher : t.roleParent}</p>
      <Button variant="secondary" className="self-start" onClick={async () => { await (await getApi()).signOut(); navigate(localPath(lang), { replace: true }) }}>{t.signOut}</Button>
    </Section>
  )
}

function LanguageSection() {
  const { lang, dict } = useLang()
  const t = dict.account.settings
  const session = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const account = session.status === 'signed-in' ? session.account : null
  const [site, setSite] = useState<Lang>(account?.language ?? lang)
  const [story, setStory] = useState<Lang>(account?.storyLanguage ?? account?.language ?? lang)
  const { busy, error, done, run } = useAction()
  if (!account) return null
  const save = () => run(async () => {
    await (await getApi()).updateAccount({ language: site, storyLanguage: story })
    await session.refresh()
    if (site !== lang) navigate(pathname.replace(/^\/[a-z]{2}\//, `/${site}/`), { replace: true })
  })
  const options = LANGS.map((l) => ({ value: l, label: ENDONYM[l], lang: l }))
  return (
    <Section title={t.languageTitle}>
      <ChoiceGroup legend={t.siteLanguage} name="site-lang" value={site} onChange={setSite} options={options} columns={2} compact />
      <ChoiceGroup legend={t.storyLanguage} name="story-lang" value={story} onChange={setStory} options={options} columns={2} compact />
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
      {done && <Notice tone="success">{t.saved}</Notice>}
      <Button onClick={save} busy={busy} className="self-start">{t.save}</Button>
    </Section>
  )
}

function ProfilesSection() {
  const { dict } = useLang()
  const t = dict.account.settings
  const session = useSession()
  const teacher = session.status === 'signed-in' && session.account?.role === 'teacher'
  const [list, setList] = useState<Learner[] | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [adding, setAdding] = useState(false)
  const load = async () => {
    setError(null)
    try {
      setList(await (await getApi()).listLearners())
    } catch (e) {
      setError(codeOf(e))
    }
  }
  useEffect(() => void load(), [])
  return (
    <Section title={teacher ? t.classesTitle : t.profilesTitle}>
      {error && <Notice tone="error" action={<Button onClick={load}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
      {!list && !error && <Spinner label={dict.account.states.loading} />}
      {list && !list.length && <p className="text-ink-muted">{t.noProfiles}</p>}
      {list && (
        <ul className="flex flex-col gap-3" data-testid="profiles">
          {list.map((l) => <LearnerRow key={l.id} learner={l} last={list.length === 1} onChange={load} />)}
        </ul>
      )}
      {adding ? (
        <LearnerForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); void load() }} />
      ) : (
        list && list.length < 5 && <Button variant="secondary" className="self-start" onClick={() => setAdding(true)}>{teacher ? t.addClass : t.addProfile}</Button>
      )}
    </Section>
  )
}

function LearnerRow({ learner, last, onChange }: { learner: Learner; last: boolean; onChange: () => void }) {
  const { dict } = useLang()
  const t = dict.account.settings
  const [mode, setMode] = useState<'view' | 'edit' | 'remove'>('view')
  const { busy, error, run } = useAction()
  if (mode === 'edit') return <li><LearnerForm learner={learner} onCancel={() => setMode('view')} onSaved={() => { setMode('view'); onChange() }} /></li>
  return (
    <li className="flex flex-col gap-3 rounded-control border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p><span className="font-medium"><bdi>{learner.name}</bdi></span> <span className="text-ink-muted">· {dict.commerce.groups[learner.ageGroup]}</span></p>
        {mode === 'view' && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode('edit')}>{t.edit}</Button>
            <Button variant="secondary" onClick={() => setMode('remove')}>{t.remove}</Button>
          </div>
        )}
      </div>
      {mode === 'remove' && (
        <Notice tone="warning" action={<><Button variant="danger" busy={busy} onClick={() => run(async () => { await (await getApi()).removeLearner(learner.id); onChange() })}>{t.confirmRemove}</Button><Button variant="secondary" onClick={() => setMode('view')}>{t.cancel}</Button></>}>
          <p>{fmt(t.removeWarn, { name: learner.name })}</p>
          {last && <p>{t.removeLastWarn}</p>}
        </Notice>
      )}
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
    </li>
  )
}

function LearnerForm({ learner, onCancel, onSaved }: { learner?: Learner; onCancel: () => void; onSaved: () => void }) {
  const { dict } = useLang()
  const t = dict.account.settings
  const o = dict.account.onboarding
  const session = useSession()
  const teacher = session.status === 'signed-in' && session.account?.role === 'teacher'
  const [name, setName] = useState(learner?.name ?? '')
  const [group, setGroup] = useState<AgeGroup>(learner?.ageGroup ?? '4-5')
  const [nameError, setNameError] = useState<string | null>(null)
  const { busy, error, run } = useAction()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setNameError(dict.account.errors.required)
    setNameError(null)
    return run(async () => {
      const a = await getApi()
      if (learner) await a.updateLearner(learner.id, { name, ageGroup: group })
      else await a.addLearner({ name, ageGroup: group })
      onSaved()
    })
  }
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-control border border-ink/30 p-4">
      <TextField label={teacher ? o.className : o.childName} hint={teacher ? o.classNameHint : o.childNameHint} value={name} maxLength={40} autoComplete="off" onChange={(e) => setName(e.target.value)} error={nameError} />
      <ChoiceGroup legend={dict.commerce.plans.groupLegend} name={`group-${learner?.id ?? 'new'}`} value={group} onChange={setGroup} columns={3} compact
        options={AGE_GROUPS.map((g) => ({ value: g, label: dict.commerce.groups[g] }))} />
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" busy={busy}>{t.save}</Button>
        <Button variant="secondary" onClick={onCancel}>{t.cancel}</Button>
      </div>
    </form>
  )
}

function PassesSection() {
  const { lang, dict } = useLang()
  const t = dict.account.settings
  const { access, error, reload } = useAccess()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const loadOrders = () => getApi().then((a) => a.listOrders()).then(setOrders, () => setOrders([]))
  useEffect(() => void loadOrders(), [])
  return (
    <>
      <Section title={t.passesTitle}>
        {error && <Notice tone="error" action={<Button onClick={reload}>{dict.account.errors.retry}</Button>}>{errorText(dict, error)}</Notice>}
        {!access && !error && <Spinner label={dict.account.states.loading} />}
        {cancelled && <Notice tone="success">{dict.commerce.cancel.done}</Notice>}
        {access && !access.passes.length && <p className="text-ink-muted">{t.noPasses}</p>}
        {access && !!access.passes.length && (
          <ul className="flex flex-col gap-3" data-testid="passes">
            {[...access.passes].reverse().map((p) => {
              const view = passView(p, access.now)
              return (
                <li key={p.id} className="flex flex-col gap-2 rounded-control border border-line p-4" data-status={view}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{dict.commerce.groups[p.ageGroup]} · {dict.commerce.months[p.months]}</p>
                    <span className="rounded-full border border-ink/40 px-3 py-0.5 text-sm">{t.passStatus[view]}</span>
                  </div>
                  <p className="text-sm text-ink-muted">
                    {fmt(t.passFrom, { date: formatDate(p.startsAt, lang) })} · {fmt(t.passUntil, { date: formatDate(p.endsAt, lang) })}
                    {(view === 'active' || view === 'ending_soon') && <> · {fmt(t.daysLeft, { n: daysLeft(p.endsAt, access.now) })}</>}
                  </p>
                  <CancelPass pass={p} now={access.now} onDone={() => { setCancelled(true); void reload(); void loadOrders() }} />
                </li>
              )
            })}
          </ul>
        )}
      </Section>
      <Section title={t.paymentsTitle}>
        {!orders && <Spinner label={dict.account.states.loading} />}
        {orders && !orders.length && <p className="text-ink-muted">{t.noPayments}</p>}
        {orders && !!orders.length && (
          <ul className="flex flex-col divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>{formatDate(o.createdAt, lang)} · {dict.commerce.groups[o.ageGroup]} · {dict.commerce.months[o.months]}</span>
                <span className="flex items-center gap-2 text-sm">
                  <bdi>{formatShekels(o.amountAgorot, lang)}</bdi>
                  {o.priceWasPlaceholder && <PlaceholderTag>{dict.commerce.plans.placeholderBadge}</PlaceholderTag>}
                  <span className="text-ink-muted">{t.orderStatus[o.status]}</span>
                  <span dir="ltr" className="font-mono text-ink-muted">{o.id.slice(0, 8).toUpperCase()}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-ink-muted">{t.receiptNote}</p>
      </Section>
    </>
  )
}

function NewsSection() {
  const { dict } = useLang()
  const t = dict.account.settings
  const session = useSession()
  const account = session.status === 'signed-in' ? session.account : null
  const [on, setOn] = useState(!!account?.marketingOptIn)
  const { busy, error, done, run } = useAction()
  const toggle = (v: boolean) => {
    setOn(v)
    return run(async () => {
      await (await getApi()).setMarketing(v)
      await session.refresh()
    })
  }
  return (
    <Section title={t.newsTitle}>
      <Checkbox label={t.newsCheck} checked={on} disabled={busy} onChange={(e) => toggle(e.target.checked)} />
      <p className="text-sm text-ink-muted">{t.serviceNote}</p>
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
      {done && <Notice tone="success">{t.saved}</Notice>}
    </Section>
  )
}

function PasswordSection() {
  const { dict } = useLang()
  const t = dict.account.settings
  const a = dict.account.auth
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const { busy, error, done, run } = useAction()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) return setFieldError(dict.account.errors.weakPassword)
    setFieldError(null)
    return run(async () => {
      await (await getApi()).setPassword(password)
      setPassword('')
    })
  }
  const strength = strengthOf(password)
  return (
    <Section title={t.passwordTitle}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField label={a.newPassword} autoComplete="new-password" hint={a.passwordHint} value={password} onChange={(e) => setPassword(e.target.value)} error={fieldError} showLabel={a.showPassword} hideLabel={a.hidePassword} strength={strength ? a.strength[strength] : null} />
        {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
        {done && <Notice tone="success">{t.passwordChanged}</Notice>}
        <Button type="submit" busy={busy} variant="secondary" className="self-start">{t.changePassword}</Button>
      </form>
    </Section>
  )
}

function DataSection() {
  const { dict } = useLang()
  const t = dict.account.settings
  const { busy, error, run } = useAction()
  const download = () => run(async () => {
    const data = await (await getApi()).exportMyData()
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `storytime-my-data-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  return (
    <Section title={t.dataTitle}>
      <p className="text-ink-muted">{t.downloadNote}</p>
      <Button variant="secondary" onClick={download} busy={busy} className="self-start">{t.download}</Button>
      <p className="text-sm text-ink-muted">{t.correctNote}</p>
      {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
    </Section>
  )
}

function DeleteSection() {
  const { lang, dict } = useLang()
  const t = dict.account.settings
  const session = useSession()
  const navigate = useNavigate()
  const account = session.status === 'signed-in' ? session.account : null
  const [typed, setTyped] = useState('')
  const [mismatch, setMismatch] = useState<string | null>(null)
  const { busy, error, run } = useAction()
  if (!account) return null
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (typed.trim().toLowerCase() !== account.email.toLowerCase()) return setMismatch(t.deleteMismatch)
    setMismatch(null)
    return run(async () => {
      justDeleted.mark()
      try {
        await (await getApi()).deleteAccount()
      } catch (e) {
        justDeleted.clear()
        throw e
      }
      navigate(localPath(lang, 'auth/deleted'), { replace: true })
    })
  }
  return (
    <Section title={t.deleteTitle}>
      <ul className="flex list-disc flex-col gap-1 ps-6">
        <li>{t.deleteWarn}</li>
        <li>{t.deletePass}</li>
        <li>{t.deleteKept}</li>
      </ul>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField label={t.deleteType} type="email" inputMode="email" autoComplete="off" dir="ltr" value={typed} onChange={(e) => setTyped(e.target.value)} error={mismatch} />
        {error && <Notice tone="error">{errorText(dict, error)}</Notice>}
        <Button type="submit" variant="danger" busy={busy} className="self-start">{t.deleteSubmit}</Button>
      </form>
    </Section>
  )
}
