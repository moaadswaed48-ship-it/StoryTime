import { localPath } from '@/seo/paths'
import type { DataApi } from '../api'
import type { Order } from '../types'
import type { PaymentProvider, TestProviderControls } from './types'

/**
 * The test checkout. Its "hosted page" is /:lang/app/test-pay/; it takes no card and charges nothing. When the
 * tester presses Pay it sends the same kind of server callback a real provider sends, through the same server
 * path, and the pass is created there. The return page then waits for the server, exactly as with a real provider.
 */
export const testProvider: PaymentProvider & TestProviderControls = {
  id: 'test',
  isTest: true,
  checkoutUrl(order, { lang, returnPath }) {
    return `${localPath(lang, 'app/test-pay')}?order=${encodeURIComponent(order.id)}&return=${encodeURIComponent(returnPath)}`
  },
  async pay(api: DataApi, order: Order, outcome) {
    const id = `test_${order.id}_${Date.now().toString(36)}`
    await api.sendTestProviderEvent({
      provider: 'test',
      eventId: id,
      orderId: order.id,
      kind: outcome === 'succeeded' ? 'payment_succeeded' : outcome === 'failed' ? 'payment_failed' : 'payment_cancelled',
      providerPaymentId: id,
      amountAgorot: order.amountAgorot,
    })
  },
}

/** The providers the site can use now. A real one is added here once the owner's payment company is connected. */
export const providers: Record<string, PaymentProvider> = { test: testProvider }
export const activeProvider: PaymentProvider = testProvider
