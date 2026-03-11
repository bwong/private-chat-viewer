import { useEffect, useState } from 'react'
import type { Message } from '../../types'
import styles from './MessageBubble.module.css'
import { strings } from '../../strings'
import { MediaLightbox } from './MediaLightbox'

const s = strings.messageBubble

const OMITTED_RE = /^(image|video|audio|sticker|document|GIF) omitted$/i
const DELETED_RE = /^\u200e?(You deleted this message\.|This message was deleted\.)$/i

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'webm', '3gp', 'mkv'])
const AUDIO_EXTS = new Set(['mp3', 'aac', 'ogg', 'wav', 'm4a', 'opus', 'flac'])

function getMediaKind(file: File): 'image' | 'video' | 'audio' | 'other' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  return 'other'
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  senderColor: string
  mediaFile: File | null
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const sl = strings.mediaLightbox

function MediaDisplay({ file, filename }: { file: File | null; filename: string }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!file) {
    const isOmitted = OMITTED_RE.test(filename.trim())
    return (
      <div className={styles.mediaPlaceholder}>
        <span className={styles.mediaPlaceholderIcon}>{isOmitted ? '🚫' : '🖼️'}</span>
        <span className={styles.mediaPlaceholderText}>
          {isOmitted ? s.mediaOmitted : s.mediaNotFound}
        </span>
        {!isOmitted && (
          <span className={styles.mediaPlaceholderFilename}>{filename}</span>
        )}
      </div>
    )
  }

  const kind = getMediaKind(file)

  if (kind === 'image') {
    return objectUrl ? (
      <>
        <img
          src={objectUrl}
          alt={file.name}
          className={`${styles.mediaImage} ${styles.mediaClickable}`}
          onClick={() => setLightboxOpen(true)}
        />
        {lightboxOpen && (
          <MediaLightbox file={file} objectUrl={objectUrl} kind="image" onClose={() => setLightboxOpen(false)} />
        )}
      </>
    ) : null
  }

  if (kind === 'video') {
    return objectUrl ? (
      <>
        <div className={styles.mediaVideoWrapper}>
          <video src={objectUrl} controls className={styles.mediaVideo} />
          <button
            className={styles.mediaExpandButton}
            onClick={() => setLightboxOpen(true)}
            aria-label={sl.expand}
            title={sl.expand}
          >
            ⛶
          </button>
        </div>
        {lightboxOpen && (
          <MediaLightbox file={file} objectUrl={objectUrl} kind="video" onClose={() => setLightboxOpen(false)} />
        )}
      </>
    ) : null
  }

  if (kind === 'audio') {
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

        {message.text && !message.mediaFilename && (() => {
          const isDeleted = DELETED_RE.test(message.text)
          return (
            <p className={`${styles.text} ${isDeleted ? styles.textDeleted : ''}`}>
              {isDeleted && <span className={styles.deletedIcon}>⊘</span>}
              {message.text}
            </p>
          )
        })()}

        {/* Show text caption below media if both exist */}
        {message.text && message.mediaFilename && (
          <p className={styles.caption}>{message.text}</p>
        )}

        <span className={styles.timestamp}>
          {message.isEdited && <span className={styles.editedLabel}>{s.edited}</span>}
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
