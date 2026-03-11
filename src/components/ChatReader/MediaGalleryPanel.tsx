import { useEffect, useState } from 'react'
import type { Message } from '../../types'
import { MediaLightbox } from './MediaLightbox'
import styles from './MediaGalleryPanel.module.css'
import { strings } from '../../strings'

const s = strings.mediaGallery

type MediaKind = 'image' | 'video' | 'audio' | 'other'

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'avi', 'webm', '3gp', 'mkv'])
const AUDIO_EXTS = new Set(['mp3', 'aac', 'ogg', 'wav', 'm4a', 'opus', 'flac'])

function getKind(file: File): MediaKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'audio'
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  return 'other'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByMonth(items: MediaItem[]): { label: string; items: MediaItem[] }[] {
  const groups: Map<string, MediaItem[]> = new Map()
  for (const item of items) {
    const label = item.timestamp.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(item)
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

// ── Gallery item ──────────────────────────────────────────────────────────────

interface GalleryItemProps {
  file: File
  kind: MediaKind
  sender: string
  timestamp: Date
}

function GalleryItem({ file, kind, sender, timestamp }: GalleryItemProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!objectUrl) return null

  const canLightbox = kind === 'image' || kind === 'video'
  const label = `${sender} · ${formatDate(timestamp)}`

  function handleClick() {
    if (canLightbox) {
      setLightboxOpen(true)
    } else {
      const a = document.createElement('a')
      a.href = objectUrl!
      a.download = file.name
      a.click()
    }
  }

  return (
    <>
      <button className={styles.item} onClick={handleClick} title={label}>
        {kind === 'image' && (
          <img src={objectUrl} alt={file.name} className={styles.thumbnail} />
        )}
        {kind === 'video' && (
          <div className={`${styles.thumbnail} ${styles.videoThumb}`}>
            <span className={styles.mediaIcon}>▶</span>
          </div>
        )}
        {kind === 'audio' && (
          <div className={`${styles.thumbnail} ${styles.audioThumb}`}>
            <span className={styles.mediaIcon}>♪</span>
            <span className={styles.thumbLabel}>{file.name}</span>
          </div>
        )}
        {kind === 'other' && (
          <div className={`${styles.thumbnail} ${styles.fileThumb}`}>
            <span className={styles.mediaIcon}>📎</span>
            <span className={styles.thumbLabel}>{file.name}</span>
          </div>
        )}
      </button>
      {lightboxOpen && objectUrl && (kind === 'image' || kind === 'video') && (
        <MediaLightbox
          file={file}
          objectUrl={objectUrl}
          kind={kind}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

// ── MediaGalleryPanel ─────────────────────────────────────────────────────────

interface MediaItem {
  file: File
  kind: MediaKind
  sender: string
  timestamp: Date
}

interface MediaGalleryPanelProps {
  messages: Message[]
  mediaFiles: Map<string, File>
  onClose: () => void
}

export function MediaGalleryPanel({ messages, mediaFiles, onClose }: MediaGalleryPanelProps) {
  const items: MediaItem[] = messages
    .filter((m) => m.mediaFilename != null && mediaFiles.has(m.mediaFilename))
    .map((m) => {
      const file = mediaFiles.get(m.mediaFilename!)!
      return { file, kind: getKind(file), sender: m.sender, timestamp: m.timestamp }
    })

  const photos = items.filter((i) => i.kind === 'image')
  const videos = items.filter((i) => i.kind === 'video')
  const audio = items.filter((i) => i.kind === 'audio')
  const files = items.filter((i) => i.kind === 'other')

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{s.title}</h2>
          <button className={styles.close} onClick={onClose} aria-label={s.close}>
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>{s.empty}</p>
        ) : (
          <div className={styles.content}>
            {photos.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>{s.photos(photos.length)}</h3>
                {groupByMonth(photos).map((group) => (
                  <div key={group.label} className={styles.monthGroup}>
                    <h4 className={styles.monthTitle}>{group.label}</h4>
                    <div className={styles.grid}>
                      {group.items.map((item, i) => <GalleryItem key={i} {...item} />)}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {videos.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>{s.videos(videos.length)}</h3>
                {groupByMonth(videos).map((group) => (
                  <div key={group.label} className={styles.monthGroup}>
                    <h4 className={styles.monthTitle}>{group.label}</h4>
                    <div className={styles.grid}>
                      {group.items.map((item, i) => <GalleryItem key={i} {...item} />)}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {audio.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>{s.audio(audio.length)}</h3>
                {groupByMonth(audio).map((group) => (
                  <div key={group.label} className={styles.monthGroup}>
                    <h4 className={styles.monthTitle}>{group.label}</h4>
                    <div className={`${styles.grid} ${styles.gridList}`}>
                      {group.items.map((item, i) => <GalleryItem key={i} {...item} />)}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {files.length > 0 && (
              <section>
                <h3 className={styles.sectionTitle}>{s.files(files.length)}</h3>
                {groupByMonth(files).map((group) => (
                  <div key={group.label} className={styles.monthGroup}>
                    <h4 className={styles.monthTitle}>{group.label}</h4>
                    <div className={`${styles.grid} ${styles.gridList}`}>
                      {group.items.map((item, i) => <GalleryItem key={i} {...item} />)}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
