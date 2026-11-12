import { ChevronDown, GraduationCap } from 'lucide-react'
import { activity, goals, questions } from '@/content/learning'
import { t } from '@/i18n/copy'
import { locale, num } from '@/i18n/locale'

/**
 * For parents and teachers: what the child practises, questions for the talk after reading, and one activity away from
 * the screen. Closed until a grown-up opens it, and labelled as our first suggestions — the author has not reviewed them yet.
 */
export function Grownups({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section className="grown" data-open={open ? '' : undefined} aria-labelledby="story-grown-title">
      <button type="button" className="grown__head" aria-expanded={open} aria-controls="story-grown-body" data-grown-toggle onClick={onToggle}>
        <span className="grown__icon" aria-hidden>
          <GraduationCap size={22} strokeWidth={1.9} />
        </span>
        <span className="grown__heading">
          <span id="story-grown-title" className="grown__title">
            {t.app.story.grownups}
          </span>
          <span className="grown__draft">{t.app.story.draft}</span>
        </span>
        <span className="grown__chev" aria-hidden>
          <ChevronDown size={20} strokeWidth={2.2} />
        </span>
      </button>

      <div id="story-grown-body" className="grown__body" inert={!open}>
        <div className="grown__clip">
          <div className="grown__cols">
            <div className="grown__col">
              <h3 className="grown__h3">{t.app.story.goals}</h3>
              <ul className="grown__list grown__list--dots">
                {goals.map((g, i) => (
                  <li key={i}>{g[locale]}</li>
                ))}
              </ul>
            </div>
            <div className="grown__col">
              <h3 className="grown__h3">{t.app.story.talk}</h3>
              <ol className="grown__list grown__list--nums">
                {questions.map((q, i) => (
                  <li key={i}>
                    <span className="grown__n" aria-hidden>
                      {num(i + 1)}
                    </span>
                    {q[locale]}
                  </li>
                ))}
              </ol>
            </div>
            <div className="grown__col">
              <h3 className="grown__h3">{t.app.story.activity}</h3>
              <p className="grown__activity">{activity.title[locale]}</p>
              <ol className="grown__list grown__list--nums">
                {activity.steps.map((s, i) => (
                  <li key={i}>
                    <span className="grown__n" aria-hidden>
                      {num(i + 1)}
                    </span>
                    {s[locale]}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
