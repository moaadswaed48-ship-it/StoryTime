/**
 * The one documented shape of "Download my data" (review finding W6): the top-level keys both backends return,
 * export_my_data() in SQL and LocalServer.exportMyData. Checked by tests/db/review-fixes.test.ts and
 * tests/local-data.test.ts.
 */
export const EXPORT_KEYS = ['children', 'consents', 'email', 'exported_at', 'orders', 'passes', 'payments', 'profile', 'progress', 'refunds', 'trial']
