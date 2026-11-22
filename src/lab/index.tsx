import { Link } from 'react-router'

export default function LabIndex() {
  return (
    <main className="p-6">
      <p className="max-w-prose text-ink-muted">Test pages for the pieces carried over from the old build. Dev builds only.</p>
      <ul className="mt-4 list-disc ps-6">
        <li><Link className="underline" to="/lab/curl">Page curl</Link></li>
        <li><Link className="underline" to="/lab/kit">Character builder</Link></li>
        <li><Link className="underline" to="/lab/studio">Studio scenes (book spread, film shot, model sheets, places)</Link></li>
        <li><Link className="underline" to="/lab/shelf">Shelf</Link></li>
      </ul>
    </main>
  )
}
