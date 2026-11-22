/* Shared copy and icons for the three brand-direction mocks. Static exploration only, not the app. */
const P = new URLSearchParams(location.search);
const LANG = P.get('lang') || 'en';
const SCREEN = P.get('screen') || 'landing';
document.documentElement.lang = LANG;
document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';

const T = {
  en: {
    nav: ['Library', 'Plans', 'Sign in'],
    langs: ['العربية', 'עברית', 'English', 'Dansk'],
    sub: 'Picture books for ages 2 to 8 in Arabic, Hebrew, English and Danish. Every book can be read, heard, watched and played.',
    cta: 'Start the free trial',
    trial: '3 stories for 3 days. No card needed.',
    seePlans: 'See the plans',
    library: 'Library',
    ages: ['Ages 2–3', 'Ages 4–5', 'Ages 6–8'],
    continue: 'Continue reading',
    contTitle: 'Noor and the Oranges',
    contPage: 'Page 3 of 12',
    sample: 'Sample titles',
    books: ['Noor and the Oranges', 'Sami Says Hello', 'Lulu’s Turn', 'Grandpa’s Hat', 'Maya Counts to Ten', 'The Quiet Fish'],
    back: 'Library',
    title: 'Noor and the Oranges',
    about: 'A story about listening to grandparents. For ages 4 to 5.',
    doors: [
      ['Read', 'Turn the pages yourself'],
      ['Listen', 'Hear it and follow the words'],
      ['Watch', 'The film of the story'],
      ['Do', 'An activity to make together'],
    ],
    reader: { close: 'Close', page: 'Page 3 of 12', smaller: 'Smaller text', bigger: 'Bigger text', prev: 'Back', next: 'Next', listen: 'Listen', pause: 'Pause', auto: 'Turn pages by itself' },
    plans: 'One pass for each age group',
    plansSub: 'A pass opens every story of its age group: the book, the voice, the film and the activity.',
    durations: ['1 month', '3 months', '12 months'],
    noPrice: 'Price not set yet',
    once: 'Paid once. Does not renew.',
    choose: ['Choose 1 month', 'Choose 3 months', 'Choose 12 months'],
    chooseShort: 'Choose',
    trialQ: 'Want to try it first?',
    trialLine: 'Try 3 stories for 3 days, free, with no card.',
  },
  ar: {
    nav: ['المكتبة', 'الاشتراكات', 'الدخول'],
    langs: ['العربية', 'עברית', 'English', 'Dansk'],
    sub: 'كتب مصوّرة للأعمار من سنتين إلى ثماني سنوات، بالعربية والعبرية والإنجليزية والدنماركية. كل كتاب يمكن قراءته والاستماع إليه ومشاهدته، وله نشاط.',
    cta: 'بدء التجربة المجانية',
    trial: '3 حكايات لمدة 3 أيام، دون بطاقة دفع.',
    seePlans: 'عرض الاشتراكات',
    library: 'المكتبة',
    ages: ['2–3 سنوات', '4–5 سنوات', '6–8 سنوات'],
    continue: 'متابعة القراءة',
    contTitle: 'نور والبرتقال',
    contPage: 'الصفحة 3 من 12',
    sample: 'عناوين تجريبية',
    books: ['نور والبرتقال', 'سامي يقول مرحبًا', 'دور لولو', 'قبعة جدّي', 'مايا تعدّ إلى عشرة', 'السمكة الهادئة'],
    back: 'المكتبة',
    title: 'نور والبرتقال',
    about: 'حكاية عن الإصغاء إلى الأجداد، للأعمار من 4 إلى 5 سنوات.',
    doors: [
      ['قراءة', 'تقليب الصفحات بنفسك'],
      ['استماع', 'الاستماع ومتابعة الكلمات'],
      ['مشاهدة', 'فيلم الحكاية'],
      ['نشاط', 'نشاط نصنعه معًا'],
    ],
    reader: { close: 'إغلاق', page: 'الصفحة 3 من 12', smaller: 'خط أصغر', bigger: 'خط أكبر', prev: 'السابقة', next: 'التالية', listen: 'استماع', pause: 'إيقاف مؤقت', auto: 'تقليب الصفحات تلقائيًا' },
    plans: 'اشتراك لكل فئة عمرية',
    plansSub: 'يفتح الاشتراك جميع حكايات فئته العمرية: الكتاب والصوت والفيلم والنشاط.',
    durations: ['شهر واحد', '3 أشهر', '12 شهرًا'],
    noPrice: 'السعر لم يُحدَّد بعد',
    once: 'دفعة واحدة، دون تجديد تلقائي.',
    choose: ['اختيار شهر واحد', 'اختيار 3 أشهر', 'اختيار 12 شهرًا'],
    chooseShort: 'اختيار',
    trialQ: 'هل تريدون التجربة أولًا؟',
    trialLine: 'جرّبوا 3 حكايات لمدة 3 أيام مجانًا، دون بطاقة دفع.',
  },
};
const t = T[LANG];
const COVERS = ['cover-oranges', 'c-sami', 'c-lulu', 'c-jiddo', 'c-maya', 'c-fish'];
const A = (n) => `../assets/${n}.jpg`;

/* Icons: 24 grid, stroke = currentColor. Drawn for these mocks. */
const I = {
  read: '<path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6.5v13"/>',
  listen: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>',
  watch: '<rect x="2.5" y="4.5" width="19" height="13" rx="2.5"/><path d="M10 8.3v5.4l4.6-2.7z" fill="currentColor"/><path d="M8 21h8"/>',
  do: '<circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="17.5" r="3"/><path d="M8.6 15.4 19 3.5M15.4 15.4 5 3.5"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  pause: '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls} ${['prev','next','back'].includes(n) ? 'flip' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="var(--sw,2)" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const DOOR_ICONS = ['read', 'listen', 'watch', 'do'];

function langRow(cls = 'langs') {
  const cur = LANG === 'ar' ? 0 : 2;
  return `<div class="${cls}">${t.langs.map((l, i) => `<a class="${i === cur ? 'on' : ''}" ${i === 0 ? 'lang="ar"' : i === 1 ? 'lang="he"' : ''}>${l}</a>`).join('')}</div>`;
}
function render(map) {
  const fn = map[SCREEN];
  document.getElementById('screen').innerHTML = fn ? fn() : 'missing screen';
  document.body.dataset.screen = SCREEN;
}
