import styles from './DateSeparator.module.css'
import { formatDateLabel } from './formatDateLabel'

interface DateSeparatorProps {
  date: Date
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{formatDateLabel(date)}</span>
    </div>
  )
}
