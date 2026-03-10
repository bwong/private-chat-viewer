import { describe, it, expect } from 'vitest'
import { findNearestListIndex } from './findNearestListIndex'
import type { ListItem } from './buildListItems'

function msg(id: string, year: number, month: number, day: number): ListItem {
  return {
    type: 'message',
    message: {
      id,
      timestamp: new Date(year, month - 1, day, 10, 0, 0),
      sender: 'Alice',
      text: 'hello',
      mediaFilename: null,
      isSystemMessage: false,
    },
  }
}

function sep(year: number, month: number, day: number): ListItem {
  return {
    type: 'date-separator',
    date: new Date(year, month - 1, day),
    id: `sep-${year}-${month}-${day}`,
  }
}

// Represents a realistic list: [sep, msg, msg, sep, msg, ...]
const ITEMS: ListItem[] = [
  sep(2011, 4, 10),
  msg('1', 2011, 4, 10),
  msg('2', 2011, 4, 10),
  sep(2011, 4, 11),
  msg('3', 2011, 4, 11),
  sep(2011, 5, 1),
  msg('4', 2011, 5, 1),
  sep(2011, 12, 25),
  msg('5', 2011, 12, 25),
]

describe('findNearestListIndex', () => {
  it('returns -1 for empty list', () => {
    expect(findNearestListIndex(new Date(2011, 3, 10), [])).toBe(-1)
  })

  it('returns index 0 when target is before all items', () => {
    const result = findNearestListIndex(new Date(2010, 0, 1), ITEMS)
    expect(result).toBe(0)
  })

  it('returns the index of the date-separator when date matches exactly', () => {
    // Apr 10 → separator at index 0
    const result = findNearestListIndex(new Date(2011, 3, 10), ITEMS)
    expect(result).toBe(0)
  })

  it('finds separator for Apr 11', () => {
    const result = findNearestListIndex(new Date(2011, 3, 11), ITEMS)
    expect(result).toBe(3) // sep(2011, 4, 11)
  })

  it('jumps to next available day when target date has no messages', () => {
    // Apr 15 has no messages; nearest is May 1 (index 5)
    const result = findNearestListIndex(new Date(2011, 3, 15), ITEMS)
    expect(result).toBe(5) // sep(2011, 5, 1)
  })

  it('jumps to next available day across month boundary', () => {
    // May 2 has no messages; nearest is Dec 25 (index 7)
    const result = findNearestListIndex(new Date(2011, 4, 2), ITEMS)
    expect(result).toBe(7) // sep(2011, 12, 25)
  })

  it('returns last item index when target is after all items', () => {
    const result = findNearestListIndex(new Date(2025, 0, 1), ITEMS)
    expect(result).toBe(ITEMS.length - 1)
  })

  it('handles single-item list', () => {
    const single: ListItem[] = [msg('1', 2020, 6, 15)]
    expect(findNearestListIndex(new Date(2020, 5, 1), single)).toBe(0)
    expect(findNearestListIndex(new Date(2020, 5, 15), single)).toBe(0)
    expect(findNearestListIndex(new Date(2025, 0, 1), single)).toBe(0)
  })

  it('handles same-day items at different times', () => {
    // Multiple messages on the same day — should return the separator (first item for that day)
    const result = findNearestListIndex(new Date(2011, 3, 10), ITEMS)
    expect(ITEMS[result].type).toBe('date-separator')
  })
})
