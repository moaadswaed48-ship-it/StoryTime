/** Input checks shared by the screens and the local backend (Supabase applies its own on the server). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const isEmail = (v: string) => EMAIL_RE.test(v.trim())
export const MIN_PASSWORD = 8
