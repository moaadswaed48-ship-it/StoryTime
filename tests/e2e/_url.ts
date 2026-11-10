/** In dev (ST_DEV=1) each feature is tested on its isolated demo page; in CI/production on the real page. */
export const pageUrl = (feature: string, extra = '') => (process.env.ST_DEV ? `/demo.html?f=${feature}&qa=1${extra}` : `/?qa=1${extra}`)
