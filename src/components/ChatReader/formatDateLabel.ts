import { strings } from '../../strings'

const s = strings.dateSeparator

export function formatDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return s.today
  if (d.getTime() === yesterday.getTime()) return s.yesterday

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
