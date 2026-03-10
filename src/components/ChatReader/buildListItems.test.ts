import { describe, test, expect } from 'vitest'
import { buildListItems } from './buildListItems'
import type { Message } from '../../types'

function makeMessage(overrides: Partial<Message> & { timestamp: Date }): Message {
  return {
    id: String(Math.random()),
    sender: 'Alice',
    text: 'Hello',
    mediaFilename: null,
    isSystemMessage: false,
    ...overrides,
  }
}

const jan1 = new Date(2023, 0, 1, 10, 0, 0)
const jan1Late = new Date(2023, 0, 1, 23, 0, 0)
const jan2 = new Date(2023, 0, 2, 9, 0, 0)
const jan3 = new Date(2023, 0, 3, 12, 0, 0)

describe('buildListItems', () => {
  test('returns empty array for empty input', () => {
    expect(buildListItems([])).toEqual([])
  })

  test('single message produces one separator and one message item', () => {
    const messages = [makeMessage({ timestamp: jan1 })]
    const items = buildListItems(messages)
    expect(items).toHaveLength(2)
    expect(items[0].type).toBe('date-separator')
    expect(items[1].type).toBe('message')
  })

  test('separator date matches the first message of that day', () => {
    const messages = [makeMessage({ timestamp: jan1 })]
    const items = buildListItems(messages)
    const sep = items[0]
    if (sep.type !== 'date-separator') throw new Error('expected separator')
    expect(sep.date).toBe(jan1)
  })

  test('multiple messages on the same day share one separator', () => {
    const messages = [
      makeMessage({ timestamp: jan1 }),
      makeMessage({ timestamp: jan1Late }),
    ]
    const items = buildListItems(messages)
    expect(items).toHaveLength(3) // 1 separator + 2 messages
    expect(items.filter((i) => i.type === 'date-separator')).toHaveLength(1)
  })

  test('messages on different days get separate separators', () => {
    const messages = [
      makeMessage({ timestamp: jan1 }),
      makeMessage({ timestamp: jan2 }),
    ]
    const items = buildListItems(messages)
    expect(items).toHaveLength(4) // 2 separators + 2 messages
    expect(items.filter((i) => i.type === 'date-separator')).toHaveLength(2)
  })

  test('three-day chat produces three separators', () => {
    const messages = [
      makeMessage({ timestamp: jan1 }),
      makeMessage({ timestamp: jan1Late }),
      makeMessage({ timestamp: jan2 }),
      makeMessage({ timestamp: jan3 }),
      makeMessage({ timestamp: jan3 }),
    ]
    const items = buildListItems(messages)
    const separators = items.filter((i) => i.type === 'date-separator')
    expect(separators).toHaveLength(3)
  })

  test('separators appear immediately before the first message of each day', () => {
    const messages = [
      makeMessage({ timestamp: jan1 }),
      makeMessage({ timestamp: jan2 }),
    ]
    const items = buildListItems(messages)
    expect(items[0].type).toBe('date-separator')
    expect(items[1].type).toBe('message')
    expect(items[2].type).toBe('date-separator')
    expect(items[3].type).toBe('message')
  })

  test('preserves message order', () => {
    const m1 = makeMessage({ id: '1', timestamp: jan1 })
    const m2 = makeMessage({ id: '2', timestamp: jan1Late })
    const items = buildListItems([m1, m2])
    const msgItems = items.filter((i) => i.type === 'message')
    expect(msgItems[0].type === 'message' && msgItems[0].message.id).toBe('1')
    expect(msgItems[1].type === 'message' && msgItems[1].message.id).toBe('2')
  })

  test('system messages are included in the list', () => {
    const messages = [
      makeMessage({ timestamp: jan1, isSystemMessage: true, sender: '', text: 'Alice created group' }),
      makeMessage({ timestamp: jan1, sender: 'Alice', text: 'Hello' }),
    ]
    const items = buildListItems(messages)
    expect(items).toHaveLength(3)
    const msgItems = items.filter((i) => i.type === 'message')
    expect(msgItems[0].type === 'message' && msgItems[0].message.isSystemMessage).toBe(true)
  })

  test('each date-separator has a stable unique id', () => {
    const messages = [
      makeMessage({ timestamp: jan1 }),
      makeMessage({ timestamp: jan2 }),
      makeMessage({ timestamp: jan3 }),
    ]
    const items = buildListItems(messages)
    const ids = items
      .filter((i) => i.type === 'date-separator')
      .map((i) => (i.type === 'date-separator' ? i.id : ''))
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(3)
  })
})
