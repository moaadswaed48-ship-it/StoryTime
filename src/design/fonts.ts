import { rtl } from '@/i18n/locale'

/** The UI family for text drawn on a canvas (must match `--font-sans` in src/index.css). */
export const UI_FAMILY = rtl ? '"IBM Plex Sans Arabic", "Rubik Variable", system-ui, sans-serif' : '"Rubik Variable", ui-sans-serif, system-ui, sans-serif'
/** Its first face, for `document.fonts.load()`. */
export const UI_FACE = rtl ? '"IBM Plex Sans Arabic"' : '"Rubik Variable"'
/** The heaviest weight the family has (Plex stops at 700; Rubik goes to 900). */
export const UI_HEAVY = rtl ? 700 : 900
