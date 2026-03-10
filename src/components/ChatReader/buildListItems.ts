import type { Message } from '../../types'

export type ListItem =
  | { type: 'date-separator'; date: Date; id: string }
  | { type: 'message'; message: Message }

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Converts a flat Message[] into a ListItem[] ready for the virtual scroller.
 * Inserts a date-separator item whenever the date changes between messages.
 * Assumes messages are in chronological order (as WhatsApp exports them).
 */
export function buildListItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = []
  let lastDate: Date | null = null

  for (const message of messages) {
    if (lastDate === null || !isSameDay(lastDate, message.timestamp)) {
      items.push({
        type: 'date-separator',
        date: message.timestamp,
        id: `date-${message.timestamp.getFullYear()}-${message.timestamp.getMonth()}-${message.timestamp.getDate()}`,
      })
      lastDate = message.timestamp
    }
    items.push({ type: 'message', message })
  }

  return items
}
