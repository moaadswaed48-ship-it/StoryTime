/** Base-aware public asset URL (works at '/', under a sub-path, and with a relative base for previews). */
export const asset = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

/**
 * The same address made absolute. Needed when it travels through a CSS custom property: a relative `url()` in a
 * variable is resolved against the stylesheet that uses it (…/assets/), not against the page.
 */
export const assetAbs = (path: string) => (typeof document === 'undefined' ? asset(path) : new URL(asset(path), document.baseURI).href)
