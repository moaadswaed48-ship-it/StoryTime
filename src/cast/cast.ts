/**
 * The first cast: thirteen character sheets across all five life stages. They are the fixed cast for activity
 * instructions (a teacher, a mother, a father, two grandparents, four children) plus toddlers and teenagers, and
 * they are the test set for the character builder. Stories add their own sheets beside these; nothing here is
 * the brand. Sheets are plain data: the flat puppet and the 3D figure are both built from them.
 */
import { BUILDS, type Sheet } from './sheet'

const n = (ar: string, he: string, en: string, da = en) => ({ ar, he, en, da })

export const CAST: Sheet[] = [
  {
    id: 'sami', name: n('سامي', 'סמי', 'Sami'), stage: 'toddler', build: { ...BUILDS.toddler },
    skin: '#e9b98e', hair: { style: 'tuft', color: '#4a2c20' }, eyes: { color: '#4a2f22', size: 0.9 },
    top: { style: 'tee', color: '#f0b63c', trim: '#fff3d6', pattern: 'stripes' }, bottom: { style: 'shorts', color: '#3f7f8c' }, shoes: { style: 'bare', color: '#000000' },
    manner: 'Wobbly and fearless; stops dead to stare at anything new, then runs at it.',
  },
  {
    id: 'lulu', name: n('لولو', 'לולו', 'Lulu'), stage: 'toddler', build: { ...BUILDS.toddler, girth: 0.7 },
    skin: '#8a5636', hair: { style: 'curls', color: '#2a1a16' }, eyes: { color: '#2e1c14', size: 1 },
    top: { style: 'dress', color: '#e8705a', trim: '#ffe9c4', pattern: 'dots' }, bottom: { style: 'none', color: '#e8705a' }, shoes: { style: 'sandals', color: '#f6d98a' },
    manner: 'Round and cuddly; hugs first, asks later; claps for everything.',
  },
  {
    id: 'noor', name: n('نور', 'נור', 'Noor'), stage: 'child', build: { ...BUILDS.child },
    skin: '#dca077', hair: { style: 'braids', color: '#3b2118' }, eyes: { color: '#5a3a24', size: 0.8 },
    top: { style: 'dress', color: '#3f9a8f', trim: '#ffd872' }, bottom: { style: 'none', color: '#3f9a8f' }, shoes: { style: 'boots', color: '#d8563e' },
    manner: 'Curious and quick; leans toward whatever she is looking at; talks with her hands.',
  },
  {
    id: 'adam', name: n('آدم', 'אדם', 'Adam'), stage: 'child', build: { ...BUILDS.child, girth: 0.5 },
    skin: '#f4d0b0', hair: { style: 'short', color: '#b0562a' }, eyes: { color: '#4f7a5a', size: 0.7 },
    top: { style: 'jumper', color: '#5a79c4', trim: '#f4e3bd' }, bottom: { style: 'trousers', color: '#8a6f5c' }, shoes: { style: 'shoes', color: '#d8563e' },
    extras: ['freckles'],
    manner: 'Careful and thoughtful; hands in pockets; looks twice before he tries.',
  },
  {
    id: 'maya', name: n('مايا', 'מאיה', 'Maya'), stage: 'child', build: { ...BUILDS.child, height: 0.6, girth: 0.4 },
    skin: '#b97a50', hair: { style: 'bob', color: '#1f1416' }, eyes: { color: '#2e1c14', size: 0.75 },
    top: { style: 'tee', color: '#f2c94c', trim: '#ffffff' }, bottom: { style: 'skirt', color: '#7a4f9a' }, shoes: { style: 'shoes', color: '#ffffff' },
    extras: ['glasses'], extraColors: { glasses: '#d8563e' },
    manner: 'The one who knows; stands very straight; pushes her glasses up before she speaks.',
  },
  {
    id: 'yousef', name: n('يوسف', 'יוסף', 'Yousef'), stage: 'child', build: { ...BUILDS.child, height: 0.66, girth: 0.6 },
    skin: '#6f4028', hair: { style: 'curls', color: '#1c1210' }, eyes: { color: '#2a1a12', size: 0.85 },
    top: { style: 'shirt', color: '#f1ead8', trim: '#e2674a', pattern: 'check' }, bottom: { style: 'shorts', color: '#34507e' }, shoes: { style: 'sandals', color: '#7a4a2c' },
    manner: 'Big laugh, big gestures; the first to cheer and the first to help.',
  },
  {
    id: 'dana', name: n('دانا', 'דנה', 'Dana'), stage: 'teen', build: { ...BUILDS.teen },
    skin: '#e6b58c', hair: { style: 'ponytail', color: '#5b3420' }, eyes: { color: '#6a4a2c', size: 0.6 },
    top: { style: 'tunic', color: '#e48a9e', trim: '#fff0d0' }, bottom: { style: 'trousers', color: '#3d4f7c' }, shoes: { style: 'shoes', color: '#f4f0e6' },
    extras: ['bag'], extraColors: { bag: '#6aa56f' },
    manner: 'The big sister; one hip out, half a smile; kinder than she lets on.',
  },
  {
    id: 'omar', name: n('عمر', 'עומר', 'Omar'), stage: 'teen', build: { ...BUILDS.teen, height: 0.9, girth: 0.3 },
    skin: '#a8703f', hair: { style: 'short', color: '#17110f' }, eyes: { color: '#2e1c14', size: 0.55 },
    top: { style: 'coat', color: '#4f8a5c', trim: '#f0c23c' }, bottom: { style: 'trousers', color: '#39384f' }, shoes: { style: 'boots', color: '#7a4a2c' },
    extras: ['scarf'], extraColors: { scarf: '#e2674a' },
    manner: 'All elbows and knees; shy until he forgets to be.',
  },
  {
    id: 'salma', name: n('المعلمة سلمى', 'המורה סלמא', 'Miss Salma', 'Frøken Salma'), stage: 'adult', build: { ...BUILDS.adult, height: 0.97 },
    skin: '#d79a6e', hair: { style: 'covered', color: '#3b2118', cover: '#e9c46a' }, eyes: { color: '#4a2f22', size: 0.6 },
    top: { style: 'tunic', color: '#2f7f86', trim: '#f7e2b0' }, bottom: { style: 'trousers', color: '#f1e3c4' }, shoes: { style: 'shoes', color: '#8a4a3a' },
    manner: 'The teacher: unhurried, bends down to a child\'s height, delighted by small things.',
  },
  {
    id: 'hala', name: n('ماما هالة', 'אמא האלה', 'Mama Hala', 'Mor Hala'), stage: 'adult', build: { ...BUILDS.adult, height: 0.95, girth: 0.56 },
    skin: '#bf8257', hair: { style: 'long', color: '#2a1714' }, eyes: { color: '#3a2418', size: 0.6 },
    top: { style: 'shirt', color: '#f3e7cf', trim: '#f3e7cf' }, bottom: { style: 'skirt', color: '#d9603f' }, shoes: { style: 'sandals', color: '#8a4a3a' },
    manner: 'The mother: warm and a little tired; her hands are always doing two things.',
  },
  {
    id: 'karim', name: n('بابا كريم', 'אבא כרים', 'Baba Karim', 'Far Karim'), stage: 'adult', build: { ...BUILDS.adult, height: 1.03, girth: 0.62, shoulders: 1.7 },
    skin: '#c98e62', hair: { style: 'short', color: '#241715' }, eyes: { color: '#3a2418', size: 0.5 }, brows: { color: '#241715', weight: 0.9 },
    top: { style: 'shirt', color: '#7fb0d8', trim: '#ffffff', pattern: 'stripes' }, bottom: { style: 'trousers', color: '#4a4a5e' }, shoes: { style: 'shoes', color: '#6b4030' },
    extras: ['beard'],
    manner: 'The father: big and gentle; laughs with his whole chest; crouches to listen.',
  },
  {
    id: 'widad', name: n('تيتا وداد', 'סבתא וידאד', 'Teta Widad', 'Bedste Widad'), stage: 'elder', build: { ...BUILDS.elder, height: 0.88, girth: 0.72 },
    skin: '#d9a47c', hair: { style: 'bun', color: '#d9d4cf' }, eyes: { color: '#5a4636', size: 0.5 }, brows: { color: '#a9a29c', weight: 0.4 },
    top: { style: 'apron', color: '#e2674a', trim: '#8fb7a8', pattern: 'dots' }, bottom: { style: 'skirt', color: '#5b6a9a' }, shoes: { style: 'shoes', color: '#6b4030' },
    extras: ['glasses'], extraColors: { glasses: '#8a6a4a' },
    manner: 'The grandmother: small, round and quick; a hand on your cheek before you can say hello.',
  },
  {
    id: 'nabil', name: n('جدو نبيل', 'סבא נביל', 'Jiddo Nabil', 'Bedstefar Nabil'), stage: 'elder', build: { ...BUILDS.elder, girth: 0.5 },
    skin: '#b98058', hair: { style: 'none', color: '#e6e1da' }, eyes: { color: '#4a3a2c', size: 0.45 }, brows: { color: '#e6e1da', weight: 1 },
    top: { style: 'coat', color: '#8a6fa8', trim: '#f4ecd8' }, bottom: { style: 'trousers', color: '#6b7a6a' }, shoes: { style: 'shoes', color: '#4a3028' },
    extras: ['moustache', 'hat', 'cane'], extraColors: { hat: '#e7c583', cane: '#8a5a3a' },
    manner: 'The grandfather: slow, upright, twinkling; tells a story with one raised finger.',
  },
]

export const castById = (id: string): Sheet => {
  const s = CAST.find((c) => c.id === id)
  if (!s) throw new Error(`no character sheet "${id}"`)
  return s
}
