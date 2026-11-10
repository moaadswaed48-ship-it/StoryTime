import type { Locale } from '@/i18n/locale'

/**
 * The author's own story, verbatim in Arabic (never edit the Arabic text without her approval).
 * The English column is OUR draft translation, labelled as such in the UI.
 */
export interface Scene {
  /** Full-bleed picture of the scene (16:9) and its small thumbnail. */
  img: string
  thumb: string
  /** Short silent film clip of the same scene, when one exists (the picture "comes alive"). */
  clip?: string
  /** Our own chapter label (not part of the author's text). */
  title: { ar: string; en: string }
  /** One line of the author's text (verbatim excerpt) used as the film caption. */
  cue: { ar: string; en: string }
  /** The author's text for this scene, verbatim, paragraph by paragraph. */
  ar: string[]
  en: string[]
}

export const story = {
  id: 'autumn-leaves',
  title: { ar: 'أوراق الخريف والطيور المهاجرة', en: 'Autumn Leaves and the Migrating Birds' },
  kicker: { ar: 'قصة الخريف', en: 'An autumn story' },
  cover: 'story/cover.webp',
  coverThumb: 'story/cover-sm.webp',
  /** One-line summary written by us for the shelf (not the author's text). */
  blurb: {
    ar: 'ساري وأمير يلعبان لعبة الأسماء الورقية في ساحة الروضة، فتأتي الريح وتغيّر اللعبة كلّها.',
    en: 'Sari and Amir are playing the paper-names game in the kindergarten yard when the wind arrives and changes the whole game.',
  },
  scenes: [
    {
      img: 'story/k01.webp',
      thumb: 'story/k01-sm.webp',
      clip: 'film/c01.mp4',
      title: { ar: 'في الصف', en: "In class" },
      cue: { ar: "كان ساري طفلاً مليئًا بالحيوية والنشاط.", en: "Sari was a boy full of life and energy." },
      ar: [
        'كان ساري طفلاً مليئًا بالحيوية والنشاط. في كل صباح، بالكاد يستطيع الجلوس في مكانه داخل الصف، تتحرك قدماه باستمرار، ويتنقل بنظره بين النوافذ والكتب. لاحظت المعلمة ليلى ذلك، وفهمت أن ساري بحاجة إلى تفريغ طاقاته قبل أن يتمكن من التركيز.',
        '"ساري، أمير، لماذا لا تخرجان إلى الساحة لبضع دقائق؟" قالت المعلمة بابتسامة. "يمكنكما الركض قليلاً، ثم العودة حين تشعران بأنكما مستعدان."',
      ],
      en: [
        'Sari was a boy full of life and energy. Every morning he could hardly sit still in class: his feet kept moving and his eyes wandered between the windows and the books. Teacher Layla noticed, and understood that Sari needed to let his energy out before he could concentrate.',
        '"Sari, Amir, why don\'t you go out to the yard for a few minutes?" said the teacher with a smile. "You can run a little, then come back when you feel ready."',
      ],
    },
    {
      img: 'story/k02.webp',
      thumb: 'story/k02-sm.webp',
      title: { ar: 'إلى الساحة', en: "Out to the yard" },
      cue: { ar: "وأرادا أن يلعبا لعبة الأسماء الورقية في ساحة صفّ البستان", en: "They wanted to play the paper-names game in the kindergarten yard." },
      ar: [
        'ابتسم الصديقان بعد أن أذنت المعلّمة لهما بالخروج وأرادا أن يلعبا لعبة الأسماء الورقية في ساحة صفّ البستان، فخرجا ورتّبا على الأرض الأوراق الّتي كتبت عليها أسماء تلاميذ الصفّ. وكل منهما ينتظر دوره بفارغ الصبر.',
        'بدأ ساري دوره في قلب الأوراق والتعرّف على الأسماء المكتوبة',
      ],
      en: [
        'The two friends smiled when the teacher let them go. They wanted to play the paper-names game in the kindergarten yard, so they went out and laid on the ground the papers with their classmates\' names written on them. Each waited eagerly for his turn.',
        'Sari began his turn, flipping the papers and working out the names written on them.',
      ],
    },
    {
      img: 'story/k03.webp',
      thumb: 'story/k03-sm.webp',
      title: { ar: 'انتظر دورك', en: "Wait your turn" },
      cue: { ar: "أمير، يا صديقي! لا تستعجل! يجب أن تنتظر دورك.", en: "Amir, my friend! Don't rush! You have to wait your turn." },
      ar: [
        'أمير، وهو متحمّس جدًا، حاول قلب إحدى الأوراق قبل أن يحين دوره. رفع ساري حاجبيه وقال بمرح:',
        '- "أمير، يا صديقي! لا تستعجل! يجب أن تنتظر دورك. ألا ترى أنني أواجه تحديًا في قلب ورقتي؟"',
      ],
      en: [
        'Amir, very excited, tried to flip one of the papers before his turn. Sari raised his eyebrows and said cheerfully:',
        '"Amir, my friend! Don\'t rush! You have to wait your turn. Can\'t you see I\'m having a hard time flipping my paper?"',
      ],
    },
    {
      img: 'story/k04.webp',
      thumb: 'story/k04-sm.webp',
      clip: 'film/c04.mp4',
      title: { ar: 'النفخ!', en: "Blowing!" },
      cue: { ar: "نفخ ونفخ حتى احمرّ خداه، وبقي ينفخ حتى انقلبت الورقة أخيرًا", en: "He blew and blew until his cheeks turned red, and the paper finally flipped." },
      ar: [
        'انتظر أمير حتى يحين دوره، وهو الذي لا يحب الإنتظار، اثناء ذلك ابتكر طريقة جديدة، وقال بابتسامة ماكرة:',
        '- "حسناً، سأستخدم طريقة جديدة.. النفخ!"',
        'احتج ساري على أمير وهو يختار طريقة مغايرة في قلب الأوراق، وهي طريقة النفخ. نفخ ونفخ حتى احمرّ خداه، وبقي ينفخ حتى انقلبت الورقة أخيرًا:',
        '- هذا الاسم يبدأ بحرف الحاء! إنّه "حسن"، هتف أمير بفرحة.',
      ],
      en: [
        'Amir waited for his turn, though he did not like waiting. Meanwhile he invented a new way and said with a sly smile:',
        '"All right, I\'ll use a new method… blowing!"',
        'Sari protested as Amir chose a different way to flip the papers: blowing. He blew and blew until his cheeks turned red, and kept blowing until the paper finally flipped:',
        '"This name starts with the letter Ḥāʾ! It\'s Hasan!" cheered Amir.',
      ],
    },
    {
      img: 'story/k05.webp',
      thumb: 'story/k05-sm.webp',
      title: { ar: 'عصا ساري', en: "Sari's stick" },
      cue: { ar: "ضرب ساري الأرض بلطف بعصاه و\"هوب!\" انقلبت الورقة", en: "Sari tapped the ground gently with his stick and — hop! — the paper flipped." },
      ar: [
        'ضحك ساري وقال:',
        '- "يا لك من ذكي يا أمير! حان دوري الآن، وسأريك حيلة جديدة."',
        'ضرب ساري الأرض بلطف بعصاه و"هوب!" انقلبت الورقة وكأنها قد انقلبت بإشارة سحرية:',
        '- إمممم.. أول حرف، حرف الهمزة؟ والأخير هو حرف الدال.. هذا بالتأكيد "أحمد"! صاح ساري بفخر، وضحك معجباً بنفسه: "يا عيني عليك يا ساري! أنت اللعّيب!"',
        'وقال أمير بإعجاب: - "ساري، أنت عبقري!"',
      ],
      en: [
        'Sari laughed and said:',
        '"How clever you are, Amir! Now it\'s my turn, and I\'ll show you a new trick."',
        'Sari tapped the ground gently with his stick and — "hop!" — the paper flipped as if by a magic sign:',
        '"Hmm… the first letter is Hamza? And the last is Dāl… this must be Ahmad!" shouted Sari proudly, laughing at himself: "Well done, Sari! You\'re the champion!"',
        'And Amir said admiringly: "Sari, you\'re a genius!"',
      ],
    },
    {
      img: 'story/k06.webp',
      thumb: 'story/k06-sm.webp',
      clip: 'film/c06.mp4',
      title: { ar: 'الريح تلعب', en: "The wind plays" },
      cue: { ar: "هبّت ريح مفاجئة، وأطاحت بكل الأوراق في الهواء.", en: "A sudden wind rose and tossed all the papers into the air." },
      ar: [
        'بينما كان أمير يستعد للنفخ مجددًا، في هذه اللحظة، هبّت ريح مفاجئة، وأطاحت بكل الأوراق في الهواء. طارت الأوراق فوق رؤوسهما، وحاول أمير التقاطها وأخذ يقفز بشكل مضحك. صاح أمير وهو يضحك ويركض خلف الأوراق المتطايرة:',
        '- "واو! الرياح تلعب معنا',
      ],
      en: [
        'Just as Amir got ready to blow again, a sudden wind rose and tossed all the papers into the air. They flew over the boys\' heads; Amir tried to catch them, jumping in a funny way. Laughing and running after the flying papers, he shouted:',
        '"Wow! The wind is playing with us!"',
      ],
    },
    {
      img: 'story/k07.webp',
      thumb: 'story/k07-sm.webp',
      title: { ar: 'ورقة شجر', en: "A tree leaf" },
      cue: { ar: "أمسكت بورقة! لكنها ليست ورقة اللعبة.. إنها ورقة شجر!", en: "I caught one! But it isn't a game paper… it's a tree leaf!" },
      ar: [
        'هرع ساري لمساعدة صديقه وهما يقفزان ويقهقهان بينما الرياح تلعب معهما. أمسك أمير بورقة هبطت على رأسه:',
        '- هيييي.. أمسكت بورقة! لكنها ليست ورقة اللعبة.. إنها ورقة شجر!',
      ],
      en: [
        'Sari hurried to help his friend, the two of them jumping and giggling while the wind played with them. Amir caught a paper that had landed on his head:',
        '"Heyyy… I caught one! But it isn\'t a game paper… it\'s a tree leaf!"',
      ],
    },
    {
      img: 'story/k08.webp',
      thumb: 'story/k08-sm.webp',
      clip: 'film/c08.mp4',
      title: { ar: 'مثل المطر', en: "Like rain" },
      cue: { ar: "إنها جميلة، إنها تسقط مثل المطر.", en: "They're beautiful. They fall like rain." },
      ar: [
        'أخذ ساري الورقة وتفحصها:',
        '- إنها تذكرني بالأنشودة التي أنشدناها صباح اليوم مع معلمتنا، ثم بدأ يدندن: "اصفرّت أوراق الشجر في فصل الخريف، والشجر صابه ضجر ما عاد في حفيف.."',
        'نظر أمير حوله إلى الأوراق المتساقطة بحماس وقال:',
        '- "إنها جميلة، إنها تسقط مثل المطر."',
        'هذه ظواهر فصل الخريف! ما رأيك أن ننادي المعلمة والطلاب ليشاهدوا المنظر معنا؟',
      ],
      en: [
        'Sari took the leaf and examined it:',
        '"It reminds me of the song we sang this morning with our teacher," and he began to hum: "The leaves of the trees have turned yellow in autumn, and the weary trees rustle no more…"',
        'Amir looked around excitedly at the falling leaves and said:',
        '"They\'re beautiful. They fall like rain."',
        '"These are the signs of autumn! Shall we call the teacher and the children to watch with us?"',
      ],
    },
    {
      img: 'story/k09.webp',
      thumb: 'story/k09-sm.webp',
      title: { ar: 'تعالوا وانظروا', en: "Come and see" },
      cue: { ar: "وكأن الطبيعة كانت ترسم لوحةً خاصة لهم.", en: "It was as if nature were painting a picture just for them." },
      ar: [
        'قررا الصديقان استدعاء المعلمة والطلاب ليشاهدوا المنظر معًا. وما إن خرجت المعلمة والتلاميذ حتى أُعجبوا جميعًا بالمنظر الخلاب.',
        'وكأن الطبيعة كانت ترسم لوحةً خاصة لهم. اندفع الطلاب يجمعون أوراق الشجر ذات الألوان، الأحجام والأشكال المتعددة، وبدأت الأفكار تتدفق في أذهانهم.',
      ],
      en: [
        'The two friends decided to call the teacher and the children to watch together. As soon as they came out, everyone was amazed by the lovely sight.',
        'It was as if nature were painting a picture just for them. The children rushed to gather leaves of many colours, sizes and shapes, and ideas began to flow.',
      ],
    },
    {
      img: 'story/k10.webp',
      thumb: 'story/k10-sm.webp',
      title: { ar: 'تيجان وأبراج', en: "Crowns and towers" },
      cue: { ar: "يصنعون تيجانًا تشبه تيجان الملوك.", en: "Making crowns like the crowns of kings." },
      ar: [
        'بدأ بعض الطلاب بوضع الأوراق على رؤوسهم، يصنعون تيجانًا تشبه تيجان الملوك. آخرون بنوا أبراجًا من الأوراق، وكأنهم يشيدون قصورًا خيالية من عالم بعيد.',
      ],
      en: [
        'Some children put leaves on their heads, making crowns like the crowns of kings. Others built towers of leaves, as if raising fairy-tale palaces from a faraway world.',
      ],
    },
    {
      img: 'story/k11.webp',
      thumb: 'story/k11-sm.webp',
      clip: 'film/c11.mp4',
      title: { ar: 'قارب من ورق', en: "A boat of leaves" },
      cue: { ar: "يبحران في نهر سحري وسط غابة خريفية، حيث الأشجار تتحدث والطيور تغني.", en: "Sailing down a magic river through an autumn forest where the trees talk and the birds sing." },
      ar: [
        'أما ساري وأمير، فقد ابتكرا قاربًا ومجاذيف من الأوراق، وراحا يتخيلان أنهما يبحران في نهر سحري وسط غابة خريفية، حيث الأشجار تتحدث والطيور تغني.',
        '- انظر يا أمير! ماذا لو تحولت الأوراق إلى طيور صغيرة ملونة؟ قال ساري بابتسامة وهو يمد يده ليحاكي الطيران.',
        '- نعم! وتطير بنا إلى ممالك غامضة مليئة بالأسرار والمغامرات! رد أمير بحماس.',
      ],
      en: [
        'As for Sari and Amir, they invented a boat and oars out of leaves, and imagined sailing down a magic river through an autumn forest where the trees talk and the birds sing.',
        '"Look, Amir! What if the leaves turned into little colourful birds?" said Sari with a smile, stretching out his hand as if flying.',
        '"Yes! And they\'d fly us to mysterious kingdoms full of secrets and adventures!" replied Amir eagerly.',
      ],
    },
    {
      img: 'story/k12.webp',
      thumb: 'story/k12-sm.webp',
      clip: 'film/c12.mp4',
      title: { ar: 'الطيور المهاجرة', en: "The migrating birds" },
      cue: { ar: "انظروا يا أحبتي! أسراب الطيور المهاجرة.", en: "Look, my dears! Flocks of migrating birds." },
      ar: [
        'في هذه اللحظة، قالت المعلمة وهي تشير إلى السماء:',
        '- انظروا يا أحبتي! أسراب الطيور المهاجرة. تعالوا، ودّعوها وهي تغادر البلاد.',
        'رفع التلاميذ رؤوسهم نحو السماء، واخذوا يراقبون الطيور التي كانت تحلق بشكل هندسي متناسق.',
        'سأل أحمد: - "لماذا لا تحرّك الطيور أجنحتها كثيرًا؟"',
        'أجابت المعلّمة بحماس: - "لتوفّر الطاقة، حتى تستطيع السفر لمسافات طويلة."',
        'قال ساري بابتسامة: - "ما أجمل الخريف! أنسانا اللعب والطيور."',
        'ابتسمت المعلّمة وربتت على كتفه وقالت: - "شكرًا لكما على مشاركتنا هذه اللحظات الرائعة.',
      ],
      en: [
        'At that moment the teacher pointed to the sky and said:',
        '"Look, my dears! Flocks of migrating birds. Come, wave them goodbye as they leave the country."',
        'The children lifted their heads and watched the birds flying in a neat geometric shape.',
        'Ahmad asked: "Why don\'t the birds flap their wings much?"',
        'The teacher answered eagerly: "To save energy, so they can travel long distances."',
        'Sari said with a smile: "How beautiful autumn is! It made us forget the game — and the birds."',
        'The teacher smiled, patted his shoulder and said: "Thank you both for sharing these wonderful moments with us."',
      ],
    },
  ] as Scene[],
}

export const sceneText = (s: Scene, l: Locale) => (l === 'ar' ? s.ar : s.en)
export const SCENES = story.scenes.length
