import type { ListItem } from './buildListItems'

function startOfDayMs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function itemDateMs(item: ListItem): number {
  const date = item.type === 'date-separator' ? item.date : item.message.timestamp
  return startOfDayMs(date)
}

/**
 * Binary search listItems for the index of the first item whose day is >= targetDate.
 * If targetDate is after all items, returns the index of the last item.
 * Returns -1 if listItems is empty.
 */
export function findNearestListIndex(targetDate: Date, listItems: ListItem[]): number {
  if (listItems.length === 0) return -1

  const targetMs = startOfDayMs(targetDate)

  let low = 0
  let high = listItems.length - 1
  let result = listItems.length - 1 // fallback: last item when target is after everything

  while (low <= high) {
    const mid = (low + high) >> 1
    if (itemDateMs(listItems[mid]) >= targetMs) {
      result = mid
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  return result
}
