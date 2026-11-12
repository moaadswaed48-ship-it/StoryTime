/**
 * Companion material for the story: words in context, questions to talk about, and one activity away from the screen.
 * These are OUR first suggestions, labelled as drafts in the UI until the author reviews them.
 * Every `quote.ar` is a verbatim excerpt of the author's text (checked by tests/learning.test.ts) — never reword it.
 */
export interface StoryWord {
  id: string
  /** The word as a child would look it up (our label). */
  word: { ar: string; en: string }
  /** Scene (0-based) whose picture shows it. */
  scene: number
  /** The author's own sentence that uses the word. */
  quote: { ar: string; en: string }
}

export const words: StoryWord[] = [
  { id: 'turn', word: { ar: 'دَور', en: 'a turn' }, scene: 2, quote: { ar: 'يجب أن تنتظر دورك.', en: 'You have to wait your turn.' } },
  { id: 'wind', word: { ar: 'ريح', en: 'wind' }, scene: 5, quote: { ar: 'هبّت ريح مفاجئة، وأطاحت بكل الأوراق في الهواء.', en: 'A sudden wind blew and sent every paper into the air.' } },
  { id: 'leaf', word: { ar: 'ورقة شجر', en: 'a tree leaf' }, scene: 6, quote: { ar: 'إنها ورقة شجر!', en: "It's a tree leaf!" } },
  { id: 'rain', word: { ar: 'مطر', en: 'rain' }, scene: 7, quote: { ar: 'إنها تسقط مثل المطر.', en: 'They fall like rain.' } },
  { id: 'crown', word: { ar: 'تاج', en: 'a crown' }, scene: 9, quote: { ar: 'يصنعون تيجانًا تشبه تيجان الملوك.', en: 'Making crowns like the crowns of kings.' } },
  { id: 'boat', word: { ar: 'قارب', en: 'a boat' }, scene: 10, quote: { ar: 'ابتكرا قاربًا ومجاذيف من الأوراق', en: 'They invented a boat and oars out of leaves' } },
  { id: 'flock', word: { ar: 'سِرب', en: 'a flock' }, scene: 11, quote: { ar: 'أسراب الطيور المهاجرة.', en: 'Flocks of migrating birds.' } },
  { id: 'autumn', word: { ar: 'الخريف', en: 'autumn' }, scene: 11, quote: { ar: 'ما أجمل الخريف!', en: 'How beautiful autumn is!' } },
]

/** Questions for the conversation after reading (teacher or parent with the child). */
export const questions: { ar: string; en: string }[] = [
  { ar: 'لماذا طلبت المعلمة ليلى من ساري وأمير أن يخرجا إلى الساحة؟', en: 'Why did Teacher Layla ask Sari and Amir to go out to the yard?' },
  { ar: 'كيف قلب أمير الورقة؟ وكيف قلبها ساري؟', en: 'How did Amir turn his paper over? And how did Sari?' },
  { ar: 'ماذا فعلت الريح بأوراق اللعبة؟', en: 'What did the wind do to the game papers?' },
  { ar: 'ماذا صنع الأطفال من أوراق الشجر؟ وماذا كنتَ ستصنع أنت؟', en: 'What did the children make from the leaves? What would you make?' },
  { ar: 'لماذا لا تحرّك الطيور المهاجرة أجنحتها كثيرًا؟', en: "Why don't migrating birds flap their wings much?" },
  { ar: 'بأيّ حرف يبدأ اسمك أنت؟', en: 'Which letter does your own name start with?' },
]

/** What a child practises with this story — taken from what happens in it, nothing more. */
export const goals: { ar: string; en: string }[] = [
  { ar: 'التعرّف على الأسماء المكتوبة وحروفها الأولى', en: 'Recognising written names and their first letters' },
  { ar: 'انتظار الدور واللعب مع صديق', en: 'Waiting for a turn and playing with a friend' },
  { ar: 'ملاحظة ظواهر فصل الخريف: الريح وتساقط الأوراق', en: 'Noticing the signs of autumn: wind and falling leaves' },
  { ar: 'التعرّف على هجرة الطيور', en: 'Learning that birds migrate' },
  { ar: 'الخيال: أوراق تصير تيجانًا وأبراجًا وقاربًا', en: 'Imagination: leaves that become crowns, towers and a boat' },
]

/** One thing to do away from the screen, straight out of the story. */
export const activity = {
  title: { ar: 'تاج من أوراق الخريف', en: 'A crown of autumn leaves' },
  steps: [
    { ar: 'اجمعوا أوراق الشجر من الساحة أو الحديقة.', en: 'Collect leaves from the yard or the garden.' },
    { ar: 'رتّبوها حسب اللون والحجم والشكل.', en: 'Sort them by colour, size and shape.' },
    { ar: 'ألصقوها على شريط من الورق، واصنعوا تاجًا كما فعل أطفال الحكاية.', en: 'Stick them on a paper band and make a crown, as the children in the story did.' },
  ],
}
