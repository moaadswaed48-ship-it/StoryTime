import { story } from './story'

/**
 * The world a story happens in (the shelf filters, the line stamped on each cover).
 * The field keeps its old name `season`; the stories are no longer a season series.
 */
export type Season = 'nature' | 'sea' | 'space' | 'town' | 'magic'
export type Emblem =
  | 'leaf' | 'snow' | 'drop' | 'flower' | 'seed' | 'rainbow' | 'sun' | 'shade' | 'starfish' | 'olive' | 'bread' | 'moon'
  | 'shell' | 'rocket' | 'lantern' | 'clock' | 'book' | 'flame'

export interface ShelfBook {
  id: string
  season: Season
  title: { ar: string; en: string }
  /** Only the first book is real; the rest are clearly-labelled "coming soon" ideas of ours (not the author's). */
  ready: boolean
  /** Spine/cover colours for the designed (code-drawn) series covers. */
  palette: { cloth: string; ink: string; foil: string }
  emblem: Emblem
  /** Real artwork, when the book exists. */
  cover?: string
  blurb?: { ar: string; en: string }
  /** A first scene of this book's film can already be watched (the Moon book). */
  filmScene?: boolean
}

/**
 * The shelf: the one finished story (the author's), and six story ideas of ours for what could come next —
 * each in a different world, with the same children (Sari, Amir, Teacher Layla) and two new friends (Nour, Spark).
 */
export const library: ShelfBook[] = [
  {
    id: 'the-singing-shell', season: 'sea', ready: false, emblem: 'shell',
    title: { ar: 'الصدفة المغنّية', en: 'The Singing Shell' },
    blurb: {
      ar: 'يضع ساري صدفةً على أذنه، فيسمع حوتًا صغيرًا أضاع طريقه. يغوص مع أمير ليعيداه إلى أمّه.',
      en: 'Sari holds a shell to his ear and hears a little whale who has lost his way. He and Amir dive down to bring him home.',
    },
    palette: { cloth: '#1f5a66', ink: '#f3ecdf', foil: '#f2c9a0' },
  },
  {
    id: 'a-picnic-on-the-moon', season: 'space', ready: false, emblem: 'rocket', filmScene: true,
    title: { ar: 'نزهة على القمر', en: 'A Picnic on the Moon' },
    blurb: {
      ar: 'صاروخ الورق الذي صنعه الصفّ يطير حقًّا، والمعلّمة ليلى تحمل السلّة. لماذا يتغيّر شكل القمر كل ليلة؟',
      en: 'The paper rocket the class built really flies, and Teacher Layla brings the basket. Why does the moon change shape every night?',
    },
    palette: { cloth: '#1d2447', ink: '#f3ecdf', foil: '#e9d58a' },
  },
  {
    id: 'the-night-market', season: 'town', ready: false, emblem: 'lantern',
    title: { ar: 'سوق الليل', en: 'The Night Market' },
    blurb: {
      ar: 'حين تنام المدينة، يفتح سوق صغير من الفوانيس. لا شيء فيه يُشترى بالمال، بل بحكاية أو ضحكة.',
      en: 'When the town falls asleep, a little market of lanterns opens. Nothing there is bought with money, only with a story or a laugh.',
    },
    palette: { cloth: '#3b2350', ink: '#fbf3e4', foil: '#f2b54a' },
  },
  { id: story.id, season: 'nature', title: story.title, ready: true, palette: { cloth: '#b5461c', ink: '#fff4e0', foil: '#f4c56a' }, emblem: 'leaf', cover: story.cover, blurb: story.blurb },
  {
    id: 'inside-the-clock', season: 'magic', ready: false, emblem: 'clock',
    title: { ar: 'داخل الساعة', en: 'Inside the Clock' },
    blurb: {
      ar: 'تتوقّف ساعة الصفّ فجأة، فيصغر ساري ويدخلها، ليجد عجلات صغيرة نسيت كيف تعدّ.',
      en: 'The classroom clock stops. Sari shrinks, climbs inside, and finds tiny wheels that have forgotten how to count.',
    },
    palette: { cloth: '#e9e1d1', ink: '#27405e', foil: '#27405e' },
  },
  {
    id: 'mixed-up-endings', season: 'magic', ready: false, emblem: 'book',
    title: { ar: 'نهايات مقلوبة', en: 'Mixed-Up Endings' },
    blurb: {
      ar: 'في ليلة واحدة تتبادل كتب المكتبة نهاياتها: الذئب يزور طبيب الأسنان، والأميرة تقود سفينة. نور وساري يعيدان كل نهاية إلى كتابها.',
      en: "In one night the library's books swap their endings: the wolf visits the dentist and the princess sails a ship. Nour and Sari send every ending home.",
    },
    palette: { cloth: '#3f6b46', ink: '#f3ecdf', foil: '#e2c58a' },
  },
  {
    id: 'a-dragon-afraid-of-the-dark', season: 'magic', ready: false, emblem: 'flame',
    title: { ar: 'تنّين يخاف الظلام', en: 'Spark and the Dark' },
    blurb: {
      ar: 'شرارة تنّين صغير ينفخ النار، لكنه يخاف الظلام. يأخذه أمير في نزهة ليلية، فيكتشفان معًا أن الليل مليء بالنجوم والأصوات اللطيفة.',
      en: 'Spark is a little dragon who breathes fire, yet he is afraid of the dark. Amir takes him on a night walk, and together they find the night full of stars and gentle sounds.',
    },
    palette: { cloth: '#7a2e3a', ink: '#fbf3e4', foil: '#f6d9a0' },
  },
]
