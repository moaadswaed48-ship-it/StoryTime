// Every word the game shows, in Arabic and English (same shape). Arabic is the default; `?lang=en` switches.
// Numbers are Western digits in both languages, the same choice as the StoryTime site.
import { config } from './config';

/** A left-to-right name (a product, a licence, a file) inside a right-to-left line: kept together and in order. */
const ltr = (s: string) => `\u2068${s}\u2069`;

const ar = {
	title: 'جزيرة الأصدقاء',
	tag: 'مغامرة لطيفة مع أصدقاء جدد',
	loading: 'جارٍ التحميل…',
	play: 'العب',
	noWebgl: 'هذا الجهاز لا يستطيع تشغيل اللعبة.',
	credit: `مبنية على لعبة ${ltr('Wigglewild')} من ${ltr('Patch')} (الشيفرة ${ltr('MIT')}، الرسوم ${ltr('CC0')})`,
	menu: {
		open: 'القائمة',
		title: 'استراحة',
		resume: 'متابعة اللعب',
		missions: 'المهمّات',
		book: 'كتاب الأصدقاء',
		creature: 'مخلوقي',
		soundOn: 'الصوت يعمل',
		soundOff: 'الصوت متوقّف',
		about: 'عن اللعبة',
		leave: 'خروج من اللعبة',
		close: 'إغلاق',
	},
	about: {
		title: 'عن اللعبة',
		lines: [
			`«جزيرة الأصدقاء» مبنية على لعبة ${ltr('Wigglewild')} من ${ltr('Patch')}.`,
			`الشيفرة برخصة ${ltr('MIT')}، والرسوم والأصوات برخصة ${ltr('CC0')}.`,
			`المكتبات: ${ltr('three.js (MIT)')} و ${ltr('postprocessing (Zlib)')}.`,
			`الخط: ${ltr('IBM Plex Sans Arabic (OFL)')}.`,
			`التفاصيل في الملفّين ${ltr('CREDITS.md')} و ${ltr('LICENSE')} المرفقين باللعبة.`,
		],
	},
	move: { sing: 'غناء', dance: 'رقص', charm: 'ابتسامة', pose: 'وقفة', jump: 'قفز' },
	act: { greet: 'سلِّم', join: 'تعالَ معي' },
	coach: {
		egg: 'اضغط على البيضة',
		touch: 'اضغط على أي مكان لتمشي إليه',
		keys: `الأسهم للمشي · مسافة للقفز · ${ltr('Enter')} للتحيّة`,
	},
	name: {
		ask: 'ما اسم مخلوقك؟',
		placeholder: 'اكتب اسمًا',
		ok: 'تمام',
		fallback: 'سمسم',
		ideas: ['سمسم', 'لولو', 'بندق', 'فلفل', 'توتة', 'نونو'],
	},
	make: {
		title: 'اصنع مخلوقك',
		shape: 'الشكل',
		colour: 'اللون',
		extras: 'إضافات',
		horns: 'قرون',
		wings: 'أجنحة',
		frill: 'عُرف',
		tail: 'ذيل',
		done: 'تمّ',
	},
	enc: {
		intro: '{name} يريد أن يلعب معك!',
		watch: 'شاهِد…',
		turn: 'دورك!',
		good: 'أحسنت!',
		great: 'رائع!',
		hint: 'اضغط الزرّ المضيء',
		liked: 'أعجبه ذلك!',
		won: 'أصبح {name} صديقك!',
	},
	say: {
		star: 'وجدنا نجمة!',
		joined: '{name} يمشي معك الآن',
		home: 'عاد {name} إلى عشّه',
		hello: 'مرحبًا يا {name}!',
	},
	mission: {
		title: 'المهمّات',
		count: '{done} من {total}',
		done: 'أحسنت! اكتملت المهمّة',
		next: 'المهمّة التالية',
		go: 'هيّا',
		all: 'اكتملت كل المهمّات! مهمّات جديدة قريبًا.',
		soon: 'قريبًا',
		hatch: { t: 'مخلوقك الصغير', h: 'اضغط على البيضة لتفقس، ثم اختر اسمًا' },
		fruit: { t: 'كُل 3 ثمرات', h: 'امشِ إلى ثمرة لتأكلها' },
		friend: { t: 'أوّل صديق', h: 'اقترب من مخلوق وسلِّم عليه' },
		stars: { t: 'النجوم المخبّأة', h: 'ابحث عن 3 نجوم مخبّأة في الجزيرة' },
		kinds: { t: 'صديق من كل نوع', h: 'صادِق الأنواع الخمسة كلّها' },
		giant: { t: 'العملاق اللطيف', h: 'اقترب من العملاق بهدوء وسلِّم عليه' },
		home: { t: 'بيت للأصدقاء', h: '' },
		fireflies: { t: 'ليلة اليراعات', h: '' },
		race: { t: 'سباق الجزيرة', h: '' },
		workshop: { t: 'ورشة المخلوقات', h: '' },
	},
	book: { title: 'كتاب الأصدقاء', friend: 'صديق', met: 'التقيتما', unknown: 'لم تلتقيا بعد' },
	species: {
		puff: { n: 'نفّوش', b: 'خجول ويحب الغناء' },
		bobble: { n: 'نطّوط', b: 'فضولي ويحب الرقص' },
		ram: { n: 'كبّوش', b: 'فخور بقرنيه' },
		zippy: { n: 'سبّوق', b: 'سريع جدًّا' },
		croaky: { n: 'نقنوق', b: 'يحب البركة' },
		giant: { n: 'جبّور', b: 'عملاق لطيف وهادئ' },
	},
};

const en: typeof ar = {
	title: 'Friends Island',
	tag: 'A gentle adventure with new friends',
	loading: 'Loading…',
	play: 'Play',
	noWebgl: 'This device cannot run the game.',
	credit: 'Built on Wigglewild by Patch (code MIT, art CC0)',
	menu: {
		open: 'Menu',
		title: 'Break time',
		resume: 'Keep playing',
		missions: 'Missions',
		book: 'Friends book',
		creature: 'My creature',
		soundOn: 'Sound is on',
		soundOff: 'Sound is off',
		about: 'About the game',
		leave: 'Leave the game',
		close: 'Close',
	},
	about: {
		title: 'About the game',
		lines: [
			'Friends Island is built on Wigglewild by Patch.',
			'The code is under the MIT licence; the art and sounds are CC0.',
			'Libraries: three.js (MIT) and postprocessing (Zlib).',
			'Font: IBM Plex Sans Arabic (OFL).',
			'Details are in the CREDITS.md and LICENSE files that ship with the game.',
		],
	},
	move: { sing: 'Sing', dance: 'Dance', charm: 'Smile', pose: 'Pose', jump: 'Jump' },
	act: { greet: 'Say hi', join: 'Come along' },
	coach: {
		egg: 'Tap the egg',
		touch: 'Tap anywhere to walk there',
		keys: 'Arrows to walk · Space to jump · Enter to say hi',
	},
	name: {
		ask: 'What is your creature called?',
		placeholder: 'Type a name',
		ok: 'OK',
		fallback: 'Pip',
		ideas: ['Pip', 'Lulu', 'Coco', 'Momo', 'Bibi', 'Zuzu'],
	},
	make: {
		title: 'Make your creature',
		shape: 'Shape',
		colour: 'Colour',
		extras: 'Extras',
		horns: 'Horns',
		wings: 'Wings',
		frill: 'Crest',
		tail: 'Tail',
		done: 'Done',
	},
	enc: {
		intro: '{name} wants to play with you!',
		watch: 'Watch…',
		turn: 'Your turn!',
		good: 'Well done!',
		great: 'Great!',
		hint: 'Tap the glowing button',
		liked: 'It liked that!',
		won: '{name} is your friend now!',
	},
	say: {
		star: 'You found a star!',
		joined: '{name} is coming with you',
		home: '{name} went back to its nest',
		hello: 'Hello, {name}!',
	},
	mission: {
		title: 'Missions',
		count: '{done} of {total}',
		done: 'Well done! Mission complete',
		next: 'Next mission',
		go: 'Go',
		all: 'You finished every mission! New ones are coming soon.',
		soon: 'Coming soon',
		hatch: { t: 'Your little creature', h: 'Tap the egg to hatch it, then pick a name' },
		fruit: { t: 'Eat 3 fruits', h: 'Walk to a fruit to eat it' },
		friend: { t: 'First friend', h: 'Go up to a creature and say hi' },
		stars: { t: 'Hidden stars', h: 'Find 3 stars hidden on the island' },
		kinds: { t: 'A friend of every kind', h: 'Make friends with all 5 kinds' },
		giant: { t: 'The gentle giant', h: 'Walk up to the giant calmly and say hi' },
		home: { t: 'A home for friends', h: '' },
		fireflies: { t: 'Firefly night', h: '' },
		race: { t: 'Island race', h: '' },
		workshop: { t: 'Creature workshop', h: '' },
	},
	book: { title: 'Friends book', friend: 'Friend', met: 'You met', unknown: 'Not met yet' },
	species: {
		puff: { n: 'Puffle', b: 'Shy, and loves to sing' },
		bobble: { n: 'Bobble', b: 'Curious, and loves to dance' },
		ram: { n: 'Curly', b: 'Proud of its horns' },
		zippy: { n: 'Zippy', b: 'Very fast' },
		croaky: { n: 'Croaky', b: 'Loves the pond' },
		giant: { n: 'Bombo', b: 'A gentle, quiet giant' },
	},
};

export const lang = config.lang;
export const rtl = lang === 'ar';
export const t = rtl ? ar : en;
export type SpeciesKey = keyof typeof ar.species;
export type MissionKey = 'hatch' | 'fruit' | 'friend' | 'stars' | 'kinds' | 'giant' | 'home' | 'fireflies' | 'race' | 'workshop';

/** "{name} is here" with its values filled in. */
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
/** Numbers as text: Western digits in every language. */
export const num = (n: number) => String(Math.round(n));
/** Text that goes into innerHTML (names a child typed, above all). */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

if (typeof document !== 'undefined') {
	document.documentElement.lang = lang;
	document.documentElement.dir = rtl ? 'rtl' : 'ltr';
}
