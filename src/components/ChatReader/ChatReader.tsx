import { useRef, useMemo, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChatData } from '../../types'
import { buildListItems } from './buildListItems'
import { searchMessages } from './searchMessages'
import { MessageBubble } from './MessageBubble'
import { DateSeparator } from './DateSeparator'
import { SearchPanel } from './SearchPanel'
import styles from './ChatReader.module.css'

// Palette for colour-coding senders in group chats
const SENDER_COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#0288d1',
  '#00897b', '#43a047', '#f4511e', '#8d6e63', '#546e7a',
]

function getStorageKey(participants: string[]): string {
  return 'chatreader:currentUser:' + [...participants].sort().join(',')
}

function buildSenderColors(participants: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  participants.forEach((p, i) => {
    map[p] = SENDER_COLORS[i % SENDER_COLORS.length]
  })
  return map
}

// ── Participant picker overlay ────────────────────────────────────────────────

interface ParticipantPickerProps {
  participants: string[]
  onSelect: (name: string) => void
  onSkip: () => void
}

function ParticipantPicker({ participants, onSelect, onSkip }: ParticipantPickerProps) {
  const [manualName, setManualName] = useState('')
  const [showManual, setShowManual] = useState(participants.length === 0)

  const handleManualSubmit = useCallback(() => {
    const name = manualName.trim()
    if (name) onSelect(name)
  }, [manualName, onSelect])

  return (
    <div className={styles.pickerOverlay}>
      <div className={styles.pickerCard}>
        <h2 className={styles.pickerTitle}>Who are you in this chat?</h2>
        <p className={styles.pickerSubtitle}>
          Your messages will appear on the right, just like in WhatsApp.
        </p>

        {participants.length > 0 && (
          <ul className={styles.pickerList}>
            {participants.map((name) => (
              <li key={name}>
                <button className={styles.pickerOption} onClick={() => onSelect(name)}>
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!showManual && participants.length > 0 && (
          <button className={styles.pickerNotListed} onClick={() => setShowManual(true)}>
            My name isn't listed…
          </button>
        )}

        {showManual && (
          <div className={styles.pickerManual}>
            {participants.length === 0 && (
              <p className={styles.pickerManualNote}>
                Participants could not be detected automatically. Type your name exactly as it
                appears in the chat:
              </p>
            )}
            <div className={styles.pickerManualRow}>
              <input
                className={styles.pickerManualInput}
                type="text"
                placeholder="Your name in the chat"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                autoFocus
              />
              <button
                className={styles.pickerManualConfirm}
                onClick={handleManualSubmit}
                disabled={!manualName.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        <button className={styles.pickerSkip} onClick={onSkip}>
          Skip — show all messages on the left
        </button>
      </div>
    </div>
  )
}

// ── ChatReader ────────────────────────────────────────────────────────────────

interface ChatReaderProps {
  chat: ChatData
  onReset: () => void
}

export function ChatReader({ chat, onReset }: ChatReaderProps) {
  const storageKey = getStorageKey(chat.participants)

  // null  → haven't chosen yet (show picker)
  // ''    → skipped (all messages left-aligned)
  // name  → that participant is "you"
  const [currentUser, setCurrentUser] = useState<string | null>(
    () => localStorage.getItem(storageKey),
  )

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const listItems = useMemo(() => buildListItems(chat.messages), [chat.messages])
  const senderColors = useMemo(() => buildSenderColors(chat.participants), [chat.participants])

  const { results: searchResults, capped: searchCapped } = useMemo(
    () => searchMessages(searchQuery, listItems),
    [searchQuery, listItems],
  )

  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: listItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  function handleSelectUser(name: string) {
    localStorage.setItem(storageKey, name)
    setCurrentUser(name)
  }

  function handleSkip() {
    localStorage.setItem(storageKey, '')
    setCurrentUser('')
  }

  function handleChangeUser() {
    localStorage.removeItem(storageKey)
    setCurrentUser(null)
  }

  function handleSelectResult(listIndex: number) {
    virtualizer.scrollToIndex(listIndex, { align: 'start', behavior: 'smooth' })
  }

  function handleCloseSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onReset}>
          ← Back
        </button>

        <div className={styles.stats}>
          <span>{chat.messages.length.toLocaleString()} messages</span>
          <span>{chat.participants.length} participants</span>
          {chat.mediaFiles.size > 0 && (
            <span>{chat.mediaFiles.size.toLocaleString()} media</span>
          )}
        </div>

        {currentUser !== null && (
          <button className={styles.youButton} onClick={handleChangeUser}>
            {currentUser ? `You: ${currentUser}` : 'No identity set'} ▾
          </button>
        )}

        <button
          className={`${styles.searchButton} ${searchOpen ? styles.searchButtonActive : ''}`}
          onClick={() => setSearchOpen((o) => !o)}
          aria-label="Search messages"
        >
          🔍
        </button>
      </header>

      {searchOpen && (
        <SearchPanel
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={searchResults}
          capped={searchCapped}
          onSelect={handleSelectResult}
          onClose={handleCloseSearch}
        />
      )}

      {/* ── Participant picker overlay ── */}
      {currentUser === null && (
        <ParticipantPicker
          participants={chat.participants}
          onSelect={handleSelectUser}
          onSkip={handleSkip}
        />
      )}

      {/* ── Virtual message list ── */}
      <div ref={scrollRef} className={styles.scrollContainer}>
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = listItems[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.type === 'date-separator' ? (
                  <DateSeparator date={item.date} />
                ) : (
                  <MessageBubble
                    message={item.message}
                    isOwn={!!currentUser && item.message.sender === currentUser}
                    senderColor={senderColors[item.message.sender] ?? '#888'}
                    mediaFile={
                      item.message.mediaFilename
                        ? (chat.mediaFiles.get(item.message.mediaFilename) ?? null)
                        : null
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
