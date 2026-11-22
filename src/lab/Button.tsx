import type { ButtonHTMLAttributes } from 'react'

export function LabButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-line bg-surface px-3 text-sm aria-pressed:bg-ink aria-pressed:text-paper disabled:opacity-40 ${props.className ?? ''}`} />
}
