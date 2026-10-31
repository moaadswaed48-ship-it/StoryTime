/** Base-aware public asset URL (works at '/', under a sub-path, and with a relative base for previews). */
export const asset = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
