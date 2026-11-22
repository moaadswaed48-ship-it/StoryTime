/**
 * The two example activities, as cards. The activity itself is taken as written today in
 * `docs/story-room/outlines.md` ("Here You Are, Thank You" under A03, "The Talking Stick" under B02); only the
 * cutting into steps and the caption wording are ours.
 *
 * Captions: a few words, the tone of an answer to "what do I do now?". They never address the adult as a man or a
 * woman: English and Danish use the plain imperative, Arabic and Hebrew say "we …". The Arabic, Hebrew and Danish
 * lines are sample wording and need a native reader's eye before they ship.
 */
import type { Activity, ActivityId } from './types'

const w = (en: string, ar: string, he: string, da: string) => ({ en, ar, he, da })

export const ACTIVITIES: Record<ActivityId, Activity> = {
  'here-you-are': {
    id: 'here-you-are',
    story: 'A03 · Thank You, Mama',
    ages: '2-3',
    title: w('Here You Are, Thank You', 'هذه لك، شكرًا', 'בבקשה, תודה', 'Værsgo og tak'),
    cards: [
      { key: 'materials', n: 0, caption: w('A cushion and an empty cup', 'وسادة وكوب فارغ', 'כרית וכוס ריקה', 'En pude og en tom kop') },
      { key: 's1', n: 1, caption: w('Carry the cushion over', 'نحمل الوسادة', 'נושאים את הכרית', 'Bær puden hen') },
      { key: 's2', n: 2, caption: w('Two hands: “Here you are”', 'باليدين: «هذه لك»', 'בשתי ידיים: „בבקשה”', 'Begge hænder: “Værsgo”'), loop: 3, still: 1.5 },
      { key: 's3', n: 3, caption: w('“Thank you”', '«شكرًا»', '„תודה”', '“Tak”') },
      { key: 's4', n: 4, caption: w('Swap. Now the cup', 'نتبادل: الآن الكوب', 'מתחלפים. עכשיו הכוס', 'Byt. Nu koppen') },
    ],
  },
  'talking-stick': {
    id: 'talking-stick',
    story: 'B02 · The Shell That Sings',
    ages: '4-5',
    title: w('The Talking Stick', 'عصا الكلام', 'מקל הדיבור', 'Talepinden'),
    cards: [
      { key: 'materials', n: 0, caption: w('A stick or a wooden spoon', 'عصا أو ملعقة خشبية', 'מקל או כף עץ', 'En pind eller en grydeske') },
      { key: 's1', n: 1, caption: w('Sit in a circle', 'نجلس في دائرة', 'יושבים במעגל', 'Sid i en rundkreds') },
      { key: 's2', n: 2, caption: w('Stick in hand: speak. All listen', 'من يحمل العصا يتكلّم، والكل يستمع', 'מי שמחזיק במקל מדבר. כולם מקשיבים', 'Den med pinden taler. Alle lytter') },
      { key: 's3', n: 3, caption: w('Pass the stick on', 'نمرّر العصا', 'מעבירים את המקל', 'Giv pinden videre'), loop: 4, still: 1.3 },
      { key: 's4', n: 4, caption: w('Say what you heard. Then your own', 'نعيد ما سمعناه، ثم نقول ما عندنا', 'חוזרים על מה ששמענו. אחר כך משלנו', 'Sig, hvad du hørte. Så dit eget') },
    ],
  },
}

export const ACTIVITY_LIST: Activity[] = [ACTIVITIES['here-you-are'], ACTIVITIES['talking-stick']]
