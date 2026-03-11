import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './MediaLightbox.module.css'
import { strings } from '../../strings'

const s = strings.mediaLightbox

interface MediaLightboxProps {
  file: File
  objectUrl: string
  kind: 'image' | 'video'
  onClose: () => void
  onJumpToMessage?: () => void
}

export function MediaLightbox({ file, objectUrl, kind, onClose, onJumpToMessage }: MediaLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
      className={styles.overlay}
      onClick={onClose}
    >
      <div className={styles.toolbar} onClick={(e) => e.stopPropagation()}>
        <span className={styles.filename}>{file.name}</span>
        {onJumpToMessage && (
          <button className={styles.jump} onClick={() => { onClose(); onJumpToMessage() }}>
            {strings.mediaGallery.jumpToMessage}
          </button>
        )}
        <a className={styles.download} href={objectUrl} download={file.name}>
          {s.download}
        </a>
        <button ref={closeRef} className={styles.close} onClick={onClose} aria-label={s.close}>
          ✕
        </button>
      </div>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        {kind === 'image' ? (
          <img src={objectUrl} alt={file.name} className={styles.image} />
        ) : (
          <video src={objectUrl} controls autoPlay className={styles.video} />
        )}
      </div>
    </div>,
    document.body,
  )
}
