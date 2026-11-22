import type { Lang } from '@/i18n/config'
import type { DataApi } from '../api'
import type { Order } from '../types'

/**
 * One interface for every payment company (Cardcom, Tranzila or Grow later; the test provider now).
 * The browser only starts a checkout and is sent to the provider's hosted page. A pass is unlocked ONLY when the
 * provider's server callback reaches our server (supabase/functions/payment-callback -> confirm_payment), never
 * by the browser returning to a success page.
 */
export interface PaymentProvider {
  readonly id: string
  /** True for the stand-in that takes no money; the screens mark it "test". */
  readonly isTest: boolean
  /** Where to send the browser to pay for this order. */
  checkoutUrl(order: Order, ctx: { lang: Lang; returnPath: string }): string
}

/** The test provider's "hosted page" runs inside our app; this is how it reports the outcome to the server. */
export interface TestProviderControls {
  pay(api: DataApi, order: Order, outcome: 'succeeded' | 'failed' | 'cancelled'): Promise<void>
}
