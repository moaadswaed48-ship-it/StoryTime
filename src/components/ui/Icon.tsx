import { BookOpen, Brush, Baby, type LucideProps } from 'lucide-react'

const icons = { 'book-open': BookOpen, brush: Brush, baby: Baby } as const
export type IconName = keyof typeof icons

export function Icon({ name, ...rest }: { name: string } & LucideProps) {
  const Cmp = icons[name as IconName] ?? BookOpen
  return <Cmp {...rest} />
}
