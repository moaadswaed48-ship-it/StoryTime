import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getApi, type DataApi } from '@/data'
import type { Account, Session } from '@/data/types'

type State =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; session: Session; account: Account | null }

type Ctx = State & { api: DataApi | null; refresh: () => Promise<void> }

const SessionContext = createContext<Ctx>({ status: 'loading', api: null, refresh: async () => {} })

/**
 * Who is signed in, for every page under /:lang. Starts as "loading" (also in pre-rendered HTML, which is built
 * signed out) and settles in the browser, so pre-rendered pages never depend on a session.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<DataApi | null>(null)
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(async (a: DataApi, s: Session | null) => {
    if (!s) return setState({ status: 'signed-out' })
    setState((prev) => ({ status: 'signed-in', session: s, account: prev.status === 'signed-in' && prev.session.userId === s.userId ? prev.account : null }))
    try {
      const account = await a.getAccount()
      setState({ status: 'signed-in', session: s, account })
    } catch {
      // A dead session (account deleted elsewhere): treat as signed out.
      const again = await a.getSession().catch(() => null)
      if (!again) setState({ status: 'signed-out' })
    }
  }, [])

  useEffect(() => {
    let off = () => {}
    let alive = true
    getApi().then(async (a) => {
      if (!alive) return
      setApi(a)
      off = a.onSessionChange((s) => void load(a, s))
      await load(a, await a.getSession())
    })
    return () => {
      alive = false
      off()
    }
  }, [load])

  const refresh = useCallback(async () => {
    if (api) await load(api, await api.getSession())
  }, [api, load])

  const value = useMemo(() => ({ ...state, api, refresh }), [state, api, refresh])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = () => useContext(SessionContext)

/** The data API once loaded, for event handlers. */
export async function api(): Promise<DataApi> {
  return getApi()
}
