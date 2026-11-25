import type { Dict } from '../schema'
import account from './account'
import actions from './actions'
import commerce from './commerce'
import common from './common'
import landing from './landing'
import pages from './pages'
import stories from './stories'

export default { common, actions, pages, account, commerce, stories, landing } satisfies Dict
