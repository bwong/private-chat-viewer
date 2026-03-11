import { useRef, useMemo, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChatData } from '../../types'
import { buildListItems } from './buildListItems'
import { searchMessages } from './searchMessages'
import { findNearestListIndex } from './findNearestListIndex'
import { parseWhatsAppChat, detectDateOrder } from '../../parser/parseWhatsAppChat'
import type { DateOrder, DateOrderConfidence } from '../../parser/parseWhatsAppChat'
import { MessageBubble } from './MessageBubble'
import { DateSeparator } from './DateSeparator'
import { SearchPanel } from './SearchPanel'
import { CalendarPanel } from './CalendarPanel'
import { MediaGalleryPanel } from './MediaGalleryPanel'
import styles from './ChatReader.module.css'
import { strings } from '../../strings'
import { formatDateLabel } from './formatDateLabel'

const sp = strings.participantPicker
const sd = strings.dateFormatPicker
const sh = strings.header
const sg = strings.mediaGallery

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
  currentUser: string | null
  onSelect: (name: string) => void
  onSkip: () => void
  onDismiss: () => void
}

function ParticipantPicker({ participants, currentUser, onSelect, onSkip, onDismiss }: ParticipantPickerProps) {
  const [manualName, setManualName] = useState('')
  const [showManual, setShowManual] = useState(participants.length === 0)

  const handleManualSubmit = useCallback(() => {
    const name = manualName.trim()
    if (name) onSelect(name)
  }, [manualName, onSelect])

  return (
    <div className={styles.pickerOverlay} onClick={onDismiss}>
      <div className={styles.pickerCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pickerCardHeader}>
          <h2 className={styles.pickerTitle}>{sp.title}</h2>
          <button className={styles.pickerDismiss} onClick={onDismiss} aria-label={sp.dismiss}>✕</button>
        </div>
        <p className={styles.pickerSubtitle}>{sp.subtitle}</p>

        {participants.length > 0 && (
          <ul className={styles.pickerList}>
            {participants.map((name) => (
              <li key={name}>
                <button
                  className={`${styles.pickerOption} ${name === currentUser ? styles.pickerOptionActive : ''}`}
                  onClick={() => onSelect(name)}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!showManual && participants.length > 0 && (
          <button className={styles.pickerNotListed} onClick={() => setShowManual(true)}>
            {sp.notListed}
          </button>
        )}

        {showManual && (
          <div className={styles.pickerManual}>
            {participants.length === 0 && (
              <p className={styles.pickerManualNote}>{sp.manualNote}</p>
            )}
            <div className={styles.pickerManualRow}>
              <input
                className={styles.pickerManualInput}
                type="text"
                placeholder={sp.manualPlaceholder}
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
                {sp.confirm}
              </button>
            </div>
          </div>
        )}

        <button className={styles.pickerSkip} onClick={onSkip}>
          {sp.skip}
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
  const [pickerOpen, setPickerOpen] = useState(() => localStorage.getItem(storageKey) === null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [dateOrderPickerOpen, setDateOrderPickerOpen] = useState(false)

  const [dateOrder, setDateOrder] = useState<DateOrder>(
    () => detectDateOrder(chat.rawText).order,
  )
  const [dateOrderConfidence] = useState<DateOrderConfidence>(
    () => detectDateOrder(chat.rawText).confidence,
  )
  const [messages, setMessages] = useState(chat.messages)

  function handleSelectDateOrder(order: DateOrder) {
    setDateOrderPickerOpen(false)
    if (order === dateOrder) return
    setDateOrder(order)
    setMessages(parseWhatsAppChat(chat.rawText, order))
  }

  const listItems = useMemo(() => buildListItems(messages), [messages])

  const { minDate, maxDate } = useMemo(() => {
    const msgs = messages.filter((m) => !m.isSystemMessage)
    if (msgs.length === 0) {
      const now = new Date()
      return { minDate: now, maxDate: now }
    }
    return { minDate: msgs[0].timestamp, maxDate: msgs[msgs.length - 1].timestamp }
  }, [messages])

  const participants = useMemo(
    () => [...new Set(messages.filter((m) => !m.isSystemMessage).map((m) => m.sender))],
    [messages],
  )
  const senderColors = useMemo(() => buildSenderColors(participants), [participants])

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

  // Derive the floating date label from the first *visible* virtual item.
  // We skip overscan items (those whose bottom edge is at or above the scroll offset)
  // so the date reflects what's actually on screen, not items rendered off-screen above.
  // Hide the chip when the topmost visible item is itself a date-separator to avoid doubling.
  const floatingDate = useMemo(() => {
    const scrollOffset = virtualizer.scrollOffset ?? 0
    const virtualItems = virtualizer.getVirtualItems()
    const firstVisible = virtualItems.find((v) => v.start + v.size > scrollOffset)
    if (!firstVisible) return null

    const topIndex = firstVisible.index
    // If the first visible item is a date separator, the separator itself is visible — no chip needed
    if (listItems[topIndex]?.type === 'date-separator') return null

    for (let i = topIndex; i >= 0; i--) {
      const item = listItems[i]
      if (item?.type === 'date-separator') {
        return formatDateLabel(item.date)
      }
    }
    return null
  }, [virtualizer.getVirtualItems(), virtualizer.scrollOffset, listItems])

  function handleSelectUser(name: string) {
    localStorage.setItem(storageKey, name)
    setCurrentUser(name)
    setPickerOpen(false)
  }

  function handleSkip() {
    localStorage.setItem(storageKey, '')
    setCurrentUser('')
    setPickerOpen(false)
  }

  function handleChangeUser() {
    setPickerOpen(true)
  }

  function handleSelectResult(listIndex: number) {
    virtualizer.scrollToIndex(listIndex, { align: 'start', behavior: 'smooth' })
  }

  function handleCloseSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  function handleSelectDate(date: Date) {
    const idx = findNearestListIndex(date, listItems)
    if (idx !== -1) {
      virtualizer.scrollToIndex(idx, { align: 'start', behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onReset}>
          {sh.back}
        </button>

        <div className={styles.stats}>
          <span>{sh.statMessages(messages.length)}</span>
          <span>{sh.statParticipants(participants.length)}</span>
          {chat.mediaFiles.size > 0 && (
            <span>{sh.statMedia(chat.mediaFiles.size)}</span>
          )}
        </div>

        <button className={styles.youButton} onClick={handleChangeUser}>
          {currentUser ? sh.youLabel(currentUser) : sh.noIdentity} ▾
        </button>

        <button
          className={styles.dateOrderButton}
          onClick={() => setDateOrderPickerOpen(true)}
          title={sh.dateFormatButtonTitle}
        >
          {dateOrder === 'mm/dd' ? 'M/D' : 'D/M'}
        </button>

        <button
          className={`${styles.searchButton} ${searchOpen ? styles.searchButtonActive : ''}`}
          onClick={() => setSearchOpen((o) => !o)}
          aria-label={sh.searchAriaLabel}
        >
          🔍
        </button>

        <button
          className={`${styles.searchButton} ${calendarOpen ? styles.searchButtonActive : ''}`}
          onClick={() => setCalendarOpen((o) => !o)}
          aria-label={sh.calendarAriaLabel}
        >
          📅
        </button>

        <button
          className={`${styles.searchButton} ${galleryOpen ? styles.searchButtonActive : ''}`}
          onClick={() => setGalleryOpen((o) => !o)}
          aria-label={sg.openAriaLabel}
        >
          🖼️
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

      {calendarOpen && (
        <CalendarPanel
          minDate={minDate}
          maxDate={maxDate}
          onSelect={handleSelectDate}
          onClose={() => setCalendarOpen(false)}
        />
      )}

      {/* ── Date order picker overlay ── */}
      {dateOrderPickerOpen && (
        <div className={styles.pickerOverlay} onClick={() => setDateOrderPickerOpen(false)}>
          <div className={styles.pickerCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.pickerTitle}>{sd.title}</h2>
            <p className={styles.pickerSubtitle}>{sd.subtitle}</p>
            {dateOrderConfidence === 'guessed' && (
              <p className={styles.pickerDetectedNote}>{sd.guessedNote}</p>
            )}
            <ul className={styles.pickerList}>
              <li>
                <button
                  className={`${styles.pickerOption} ${dateOrder === 'mm/dd' ? styles.pickerOptionActive : ''}`}
                  onClick={() => handleSelectDateOrder('mm/dd')}
                >
                  {sd.monthDay}
                </button>
              </li>
              <li>
                <button
                  className={`${styles.pickerOption} ${dateOrder === 'dd/mm' ? styles.pickerOptionActive : ''}`}
                  onClick={() => handleSelectDateOrder('dd/mm')}
                >
                  {sd.dayMonth}
                </button>
              </li>
            </ul>
            <button className={styles.pickerSkip} onClick={() => setDateOrderPickerOpen(false)}>
              {sd.cancel}
            </button>
          </div>
        </div>
      )}

      {/* ── Media gallery overlay ── */}
      {galleryOpen && (
        <MediaGalleryPanel
          messages={messages}
          mediaFiles={chat.mediaFiles}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* ── Participant picker overlay ── */}
      {pickerOpen && (
        <ParticipantPicker
          participants={participants}
          currentUser={currentUser}
          onSelect={handleSelectUser}
          onSkip={handleSkip}
          onDismiss={() => setPickerOpen(false)}
        />
      )}

      {/* ── Virtual message list ── */}
      <div ref={scrollRef} className={styles.scrollContainer}>
        {floatingDate && (
          <div className={styles.floatingDate}>
            <span className={styles.floatingDateLabel}>{floatingDate}</span>
          </div>
        )}
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
