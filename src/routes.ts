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
        ]),
      ]
    : []),
  route(':lang', 'routes/lang.tsx', { id: 'lang' }, [
    index('routes/landing.tsx'),
    route('plans', 'routes/plans.tsx'),
    route('sign-in', 'routes/sign-in.tsx'),
    route('sign-up', 'routes/sign-up.tsx'),
    route('legal/:doc', 'routes/legal.tsx'),
    route('app', 'routes/app/layout.tsx', [
      index('routes/app/home.tsx'),
      route('library', 'routes/app/library.tsx'),
      route('story/:id', 'routes/app/story.tsx'),
      route('collections', 'routes/app/collections.tsx'),
      route('settings', 'routes/app/settings.tsx'),
      route('*', 'routes/app/missing.tsx'),
    ]),
    route('*', 'routes/missing.tsx'),
  ]),
] satisfies RouteConfig
