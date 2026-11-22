import type { Dict } from '../schema'
import account from './account'
import actions from './actions'
import commerce from './commerce'
import common from './common'
import pages from './pages'

export default { common, actions, pages, account, commerce } satisfies Dict
