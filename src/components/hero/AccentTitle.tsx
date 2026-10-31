/** Renders "Little Books {for} Big Imaginations" with the braced word in the italic serif accent face. */
export function AccentTitle({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]+\})/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('{') ? (
          <em key={i} className="accent">
            {p.slice(1, -1)}
          </em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}
