import { useEffect, useState } from 'react'
import type { Message } from '../../types'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  senderColor: string
  mediaFile: File | null
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function MediaDisplay({ file, filename }: { file: File | null; filename: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // No actual file — was exported as "xxx omitted"
  if (!file) {
    return <div className={styles.mediaOmitted}>📎 {filename}</div>
  }

  if (file.type.startsWith('image/')) {
    return objectUrl ? (
      <img src={objectUrl} alt={file.name} className={styles.mediaImage} />
    ) : null
  }

  if (file.type.startsWith('video/')) {
    return objectUrl ? (
      <video src={objectUrl} controls className={styles.mediaVideo} />
    ) : null
  }

  if (file.type.startsWith('audio/')) {
    return objectUrl ? <audio src={objectUrl} controls className={styles.mediaAudio} /> : null
  }

  return objectUrl ? (
    <a href={objectUrl} download={file.name} className={styles.mediaFile}>
      📎 {file.name}
    </a>
  ) : null
}

export function MessageBubble({ message, isOwn, senderColor, mediaFile }: MessageBubbleProps) {
  if (message.isSystemMessage) {
    return (
      <div className={styles.system}>
        <span className={styles.systemText}>{message.text}</span>
      </div>
    )
  }

  return (
    <div className={`${styles.row} ${isOwn ? styles.rowOwn : styles.rowOther}`}>
      <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
        {!isOwn && (
          <span className={styles.senderName} style={{ color: senderColor }}>
            {message.sender}
          </span>
        )}

        {message.mediaFilename && (
          <MediaDisplay file={mediaFile} filename={message.mediaFilename} />
        )}

        {message.text && !message.mediaFilename && (
          <p className={styles.text}>{message.text}</p>
        )}

        {/* Show text caption below media if both exist */}
        {message.text && message.mediaFilename && (
          <p className={styles.caption}>{message.text}</p>
        )}

        <span className={styles.timestamp}>{formatTime(message.timestamp)}</span>
      </div>
    </div>
  )
}
