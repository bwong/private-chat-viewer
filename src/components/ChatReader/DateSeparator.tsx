import styles from './DateSeparator.module.css'

interface DateSeparatorProps {
  date: Date
}

function formatDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return 'Today'
  if (d.getTime() === yesterday.getTime()) return 'Yesterday'

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{formatDate(date)}</span>
    </div>
  )
}
