import type { Learner } from '@/data/types'
import { hashString } from '@/lib/seeded'

/** Soft, neutral avatar colours (no brand yet). The first letter of the name sits on it. */
const TINTS = ['#dfe9f3', '#e4efdc', '#f3ead8', '#ece3f1', '#f2e1dc', '#dcefee']

export function Avatar({ learner, size = 'lg' }: { learner: Learner; size?: 'sm' | 'lg' }) {
  const tint = TINTS[hashString(learner.id) % TINTS.length]
  const letter = [...learner.name.trim()][0] ?? '·'
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full font-semibold text-ink ${size === 'lg' ? 'size-24 text-4xl' : 'size-10 text-lg'}`} style={{ background: tint }}>
      {letter}
    </span>
  )
}

/** "Who is reading?": one big button per profile (child or class). Shown only when there is more than one. */
export function ProfilePicker({ learners, title, lead, onChoose }: { learners: Learner[]; title: string; lead: string; onChoose: (id: string) => void }) {
  return (
    <section className="flex flex-col items-center gap-6 py-6 text-center" data-testid="profile-picker">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="max-w-prose text-ink-muted">{lead}</p>
      <ul className="flex flex-wrap justify-center gap-4">
        {learners.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onChoose(l.id)} className="flex min-h-11 w-36 flex-col items-center gap-3 rounded-control p-3 hover:bg-line/40">
              <Avatar learner={l} />
              <span className="text-lg font-medium"><bdi>{l.name}</bdi></span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
