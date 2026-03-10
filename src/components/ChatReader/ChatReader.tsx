import type { ChatData } from '../../types'
import styles from './ChatReader.module.css'

interface ChatReaderProps {
  chat: ChatData
  onReset: () => void
}

export function ChatReader({ chat, onReset }: ChatReaderProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onReset}>
          ← Load another chat
        </button>
        <div className={styles.stats}>
          <span>{chat.messages.length.toLocaleString()} messages</span>
          <span>{chat.participants.length} participants</span>
          {chat.mediaFiles.size > 0 && <span>{chat.mediaFiles.size} media files</span>}
        </div>
      </header>

      <main className={styles.main}>
        {/* Message list and search will be built here */}
        <p className={styles.placeholder}>
          Chat loaded successfully. Message viewer coming soon.
        </p>
      </main>
    </div>
  )
}
