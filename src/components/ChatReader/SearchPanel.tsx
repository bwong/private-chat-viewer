import { useRef, useEffect } from 'react'
import type { SearchResult } from './searchMessages'
import styles from './SearchPanel.module.css'
import { strings } from '../../strings'

const s = strings.search

const SNIPPET_WINDOW = 100
const SNIPPET_PRE = 35 // chars before match to show

interface SearchPanelProps {
  query: string
  onQueryChange: (q: string) => void
  results: SearchResult[]
  capped: boolean
  onSelect: (listIndex: number) => void
  onClose: () => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function Snippet({ text, query }: { text: string; query: string }) {
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)

  let start = 0
  if (idx > SNIPPET_PRE) start = idx - SNIPPET_PRE
  const end = start + SNIPPET_WINDOW
  const snippet = text.slice(start, Math.min(end, text.length))
  const leadEllipsis = start > 0
  const trailEllipsis = end < text.length

  const matchIdx = snippet.toLowerCase().indexOf(q)

  return (
    <>
      {leadEllipsis && <span className={styles.ellipsis}>…</span>}
      {matchIdx === -1 ? (
        snippet
      ) : (
        <>
          {snippet.slice(0, matchIdx)}
          <mark className={styles.mark}>{snippet.slice(matchIdx, matchIdx + query.length)}</mark>
          {snippet.slice(matchIdx + query.length)}
        </>
      )}
      {trailEllipsis && <span className={styles.ellipsis}>…</span>}
    </>
  )
}

export function SearchPanel({
  query,
  onQueryChange,
  results,
  capped,
  onSelect,
  onClose,
}: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const hasQuery = query.trim().length > 0

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          placeholder={s.placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button className={styles.closeBtn} onClick={onClose} aria-label={s.closeAriaLabel}>
          ✕
        </button>
      </div>

      {hasQuery && (
        <div className={styles.meta}>
          {results.length === 0
            ? s.noResults
            : capped
              ? s.manyResults
              : s.resultCount(results.length)}
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <ul className={styles.list}>
          {results.map((result) => (
            <li key={result.messageId}>
              <button className={styles.item} onClick={() => onSelect(result.listIndex)}>
                <div className={styles.itemMeta}>
                  <span className={styles.itemSender}>{result.sender}</span>
                  <span className={styles.itemDate}>{formatDate(result.timestamp)}</span>
                </div>
                <div className={styles.itemText}>
                  <Snippet text={result.text} query={query} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
