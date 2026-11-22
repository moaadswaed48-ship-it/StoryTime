import { index, route, type RouteConfig } from '@react-router/dev/routes'
import { withLab } from '../site.config.ts'

/**
 * URL map. Public pages (pre-rendered, one URL per language) and the signed-in app (client-only).
 * The lab test pages are added only to dev builds.
 */
export default [
  index('routes/pick-language.tsx'),
  ...(withLab
    ? [
        route('lab', 'lab/layout.tsx', [
          index('lab/index.tsx'),
          route('curl', 'lab/curl.tsx'),
          route('kit', 'lab/kit.tsx'),
          route('shelf', 'lab/shelf.tsx'),
          route('studio', 'lab/studio.tsx'),
          route('hero', 'lab/hero.tsx'),
        ]),
      ]
    : []),
  route(':lang', 'routes/lang.tsx', { id: 'lang' }, [
    index('routes/landing.tsx'),
    route('plans', 'routes/plans.tsx'),
    route('sign-in', 'routes/sign-in.tsx'),
    route('sign-up', 'routes/sign-up.tsx'),
    route('forgot-password', 'routes/forgot-password.tsx'),
    route('cancel-purchase', 'routes/cancel-purchase.tsx'),
    route('legal/:doc', 'routes/legal.tsx'),
    // Pages opened from email links and after leaving: client-only, never pre-rendered.
    route('auth/check-email', 'routes/auth/check-email.tsx'),
    route('auth/confirm', 'routes/auth/confirm.tsx'),
    route('auth/reset', 'routes/auth/reset.tsx'),
    route('auth/deleted', 'routes/auth/deleted.tsx'),
    route('app', 'routes/app/layout.tsx', [
      index('routes/app/home.tsx'),
      route('welcome', 'routes/app/welcome.tsx'),
      route('library', 'routes/app/library.tsx'),
      route('story/:id', 'routes/app/story.tsx'),
      route('collections', 'routes/app/collections.tsx'),
      route('settings', 'routes/app/settings.tsx'),
      route('plans', 'routes/app/plans.tsx'),
      route('checkout', 'routes/app/checkout.tsx'),
      route('checkout/done', 'routes/app/checkout-done.tsx'),
      route('test-pay', 'routes/app/test-pay.tsx'),
      route('*', 'routes/app/missing.tsx'),
    ]),
    route('*', 'routes/missing.tsx'),
  ]),
] satisfies RouteConfig
