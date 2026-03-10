import { describe, it, expect } from 'vitest'
import { searchMessages } from './searchMessages'
import type { ListItem } from './buildListItems'

function makeMessageItem(
  id: string,
  text: string,
  sender = 'Alice',
  isSystemMessage = false,
): ListItem {
  return {
    type: 'message',
    message: {
      id,
      timestamp: new Date(2024, 0, 1),
      sender,
      text,
      mediaFilename: null,
      isSystemMessage,
    },
  }
}

const ITEMS: ListItem[] = [
  { type: 'date-separator', date: new Date(2024, 0, 1), id: 'sep-0' },
  makeMessageItem('1', 'Hello world', 'Alice'),
  makeMessageItem('2', 'Good morning everyone', 'Bob'),
  makeMessageItem('3', 'HELLO again', 'Alice'),
  makeMessageItem('4', '', 'Alice'), // media-only, no text
  makeMessageItem('5', 'System event', 'System', true),
  makeMessageItem('6', 'hello lowercase', 'Bob'),
]

describe('searchMessages', () => {
  it('returns empty results for empty query', () => {
    expect(searchMessages('', ITEMS).results).toHaveLength(0)
    expect(searchMessages('   ', ITEMS).results).toHaveLength(0)
  })

  it('returns empty results for no match', () => {
    const { results } = searchMessages('xyz', ITEMS)
    expect(results).toHaveLength(0)
  })

  it('matches case-insensitively', () => {
    const { results } = searchMessages('hello', ITEMS)
    const texts = results.map((r) => r.text)
    expect(texts).toContain('Hello world')
    expect(texts).toContain('HELLO again')
    expect(texts).toContain('hello lowercase')
  })

  it('returns correct listIndex for each result', () => {
    const { results } = searchMessages('hello', ITEMS)
    // item at index 0 is a date-separator, messages start at 1
    expect(results.find((r) => r.text === 'Hello world')?.listIndex).toBe(1)
    expect(results.find((r) => r.text === 'HELLO again')?.listIndex).toBe(3)
    expect(results.find((r) => r.text === 'hello lowercase')?.listIndex).toBe(6)
  })

  it('excludes system messages', () => {
    const { results } = searchMessages('System', ITEMS)
    expect(results).toHaveLength(0)
  })

  it('excludes messages with empty text (media-only)', () => {
    const { results } = searchMessages('', ITEMS)
    expect(results.every((r) => r.text !== '')).toBe(true)
  })

  it('includes sender and timestamp in results', () => {
    const { results } = searchMessages('morning', ITEMS)
    expect(results).toHaveLength(1)
    expect(results[0].sender).toBe('Bob')
    expect(results[0].timestamp).toBeInstanceOf(Date)
  })

  it('caps results at 200 and sets capped=true', () => {
    const manyItems: ListItem[] = Array.from({ length: 250 }, (_, i) =>
      makeMessageItem(String(i), 'needle in this message', 'Alice'),
    )
    const { results, capped } = searchMessages('needle', manyItems)
    expect(results).toHaveLength(200)
    expect(capped).toBe(true)
  })

  it('sets capped=false when results are under the limit', () => {
    const { capped } = searchMessages('hello', ITEMS)
    expect(capped).toBe(false)
  })

  it('handles partial word matches', () => {
    const { results } = searchMessages('morn', ITEMS)
    expect(results).toHaveLength(1)
    expect(results[0].text).toBe('Good morning everyone')
  })

  it('handles special regex characters in query safely', () => {
    const items: ListItem[] = [makeMessageItem('1', 'price is $5.00 (USD)', 'Alice')]
    const { results } = searchMessages('$5.00', items)
    expect(results).toHaveLength(1)
  })
})
