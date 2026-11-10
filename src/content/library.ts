import { story } from './story'

export type Season = 'autumn' | 'winter' | 'spring' | 'summer'
export type Emblem = 'leaf' | 'snow' | 'drop' | 'flower' | 'seed' | 'rainbow' | 'sun' | 'shade' | 'starfish' | 'olive' | 'bread' | 'moon'

export interface ShelfBook {
  id: string
  season: Season
  title: { ar: string; en: string }
  /** Only the first book is real; the rest are clearly-labelled "coming soon" placeholders with working titles. */
  ready: boolean
  /** Spine/cover colours for the designed (code-drawn) series covers. */
  palette: { cloth: string; ink: string; foil: string }
  emblem: Emblem
  /** Real artwork, when the book exists. */
  cover?: string
  blurb?: { ar: string; en: string }
}

/** The shelf: one finished story and the working titles of the season series that will follow it. */
export const library: ShelfBook[] = [
  { id: 'winter-story', season: 'winter', title: { ar: 'حكاية الشتاء', en: 'A Winter Story' }, ready: false, palette: { cloth: '#27405e', ink: '#f3ecdf', foil: '#cfe0ee' }, emblem: 'snow' },
  { id: 'a-drop-of-rain', season: 'winter', title: { ar: 'قطرة مطر', en: 'A Drop of Rain' }, ready: false, palette: { cloth: '#e9e1d1', ink: '#27405e', foil: '#27405e' }, emblem: 'drop' },
  { id: 'olive-season', season: 'autumn', title: { ar: 'موسم الزيتون', en: 'Olive Season' }, ready: false, palette: { cloth: '#4d5b34', ink: '#f3ecdf', foil: '#e2c58a' }, emblem: 'olive' },
  { id: 'a-little-seed', season: 'spring', title: { ar: 'بذرة صغيرة', en: 'A Little Seed' }, ready: false, palette: { cloth: '#c9533a', ink: '#fbf3e4', foil: '#f6d9a0' }, emblem: 'seed' },
  { id: 'spring-story', season: 'spring', title: { ar: 'حكاية الربيع', en: 'A Spring Story' }, ready: false, palette: { cloth: '#e9e1d1', ink: '#3f6b46', foil: '#3f6b46' }, emblem: 'flower' },
  { id: story.id, season: 'autumn', title: story.title, ready: true, palette: { cloth: '#b5461c', ink: '#fff4e0', foil: '#f4c56a' }, emblem: 'leaf', cover: story.cover, blurb: story.blurb },
  { id: 'the-smell-of-bread', season: 'autumn', title: { ar: 'رائحة الخبز', en: 'The Smell of Bread' }, ready: false, palette: { cloth: '#e9e1d1', ink: '#8a4a1c', foil: '#8a4a1c' }, emblem: 'bread' },
  { id: 'rainbow', season: 'spring', title: { ar: 'قوس قزح', en: 'Rainbow' }, ready: false, palette: { cloth: '#27405e', ink: '#f3ecdf', foil: '#f2b54a' }, emblem: 'rainbow' },
  { id: 'summer-story', season: 'summer', title: { ar: 'حكاية الصيف', en: 'A Summer Story' }, ready: false, palette: { cloth: '#d9902f', ink: '#2a1a0c', foil: '#2a1a0c' }, emblem: 'sun' },
  { id: 'the-shade-of-the-tree', season: 'summer', title: { ar: 'ظلّ الشجرة', en: 'The Shade of the Tree' }, ready: false, palette: { cloth: '#3f6b46', ink: '#f3ecdf', foil: '#e2c58a' }, emblem: 'shade' },
  { id: 'starfish', season: 'summer', title: { ar: 'نجمة البحر', en: 'Starfish' }, ready: false, palette: { cloth: '#e9e1d1', ink: '#1f5a66', foil: '#1f5a66' }, emblem: 'starfish' },
  { id: 'first-snow', season: 'winter', title: { ar: 'أول الثلج', en: 'First Snow' }, ready: false, palette: { cloth: '#c9533a', ink: '#fbf3e4', foil: '#fbf3e4' }, emblem: 'moon' },
]
