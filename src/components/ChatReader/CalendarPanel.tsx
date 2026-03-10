import { useState } from 'react'
import styles from './CalendarPanel.module.css'
import { strings } from '../../strings'

const s = strings.calendar
const MONTH_NAMES = s.months
const DAY_LABELS = s.dayAbbreviations

interface CalendarPanelProps {
  minDate: Date
  maxDate: Date
  onSelect: (date: Date) => void
  onClose: () => void
}

export function CalendarPanel({ minDate, maxDate, onSelect, onClose }: CalendarPanelProps) {
  const [viewYear, setViewYear] = useState(minDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(minDate.getMonth())

  const minYear = minDate.getFullYear()
  const maxYear = maxDate.getFullYear()

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sunday

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const canGoPrev =
    viewYear > minYear || (viewYear === minYear && viewMonth > minDate.getMonth())
  const canGoNext =
    viewYear < maxYear || (viewYear === maxYear && viewMonth < maxDate.getMonth())

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{s.title}</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label={s.closeAriaLabel}>
          ✕
        </button>
      </div>

      {/* Month / year navigation */}
      <div className={styles.nav}>
        <button
          className={styles.navArrow}
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label={s.prevAriaLabel}
        >
          ‹
        </button>

        <div className={styles.selects}>
          <select
            className={styles.select}
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          className={styles.navArrow}
          onClick={nextMonth}
          disabled={!canGoNext}
          aria-label={s.nextAriaLabel}
        >
          ›
        </button>
      </div>

      {/* Day-of-week header */}
      <div className={styles.grid}>
        {DAY_LABELS.map((d) => (
          <div key={d} className={styles.dayLabel}>
            {d}
          </div>
        ))}

        {/* Leading empty cells */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day buttons */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          return (
            <button
              key={day}
              className={styles.day}
              onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
