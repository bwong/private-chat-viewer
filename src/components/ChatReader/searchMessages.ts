import type { ListItem } from './buildListItems'

export interface SearchResult {
  messageId: string
  sender: string
  timestamp: Date
  text: string
  listIndex: number
}

const MAX_RESULTS = 200

export function searchMessages(
  query: string,
  listItems: ListItem[],
): { results: SearchResult[]; capped: boolean } {
  const q = query.trim()
  if (!q) return { results: [], capped: false }

  const lower = q.toLowerCase()
  const results: SearchResult[] = []

  for (let i = 0; i < listItems.length; i++) {
    const item = listItems[i]
    if (item.type !== 'message') continue
    const { message } = item
    if (message.isSystemMessage || !message.text) continue
    if (message.text.toLowerCase().includes(lower)) {
      results.push({
        messageId: message.id,
        sender: message.sender,
        timestamp: message.timestamp,
        text: message.text,
        listIndex: i,
      })
      if (results.length >= MAX_RESULTS) {
        return { results, capped: true }
      }
    }
  }

  return { results, capped: false }
}
