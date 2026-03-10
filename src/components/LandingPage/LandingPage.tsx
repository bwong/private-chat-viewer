import { useRef, useState } from 'react'
import styles from './LandingPage.module.css'
import { strings } from '../../strings'

const s = strings.landing

interface LandingPageProps {
  isLoading: boolean
  error: string | null
  onZipFile: (file: File) => void
  onFolder: (files: FileList) => void
}

export function LandingPage({ isLoading, error, onZipFile, onFolder }: LandingPageProps) {
  const zipInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleZipInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onZipFile(file)
  }

  function handleFolderInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) onFolder(files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    if (file.name.endsWith('.zip')) {
      onZipFile(file)
    } else {
      // Surface a clear error rather than silently failing
      alert(s.dropZipOnly)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.privacyBanner}>
        <span className={styles.privacyIcon}>🔒</span>
        <span>
          <strong>{s.privacyBanner}</strong> {s.privacyDetail}
        </span>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>{s.appTitle}</h1>
        <p className={styles.subtitle}>{s.appSubtitle}</p>

        <div className={styles.options}>
          {/* ZIP option */}
          <div
            className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={styles.cardIcon}>📦</div>
            <h2 className={styles.cardTitle}>{s.zipCardTitle}</h2>
            <p className={styles.cardDescription}>{s.zipCardDetail}</p>
            <button
              className={styles.button}
              onClick={() => zipInputRef.current?.click()}
              disabled={isLoading}
            >
              {s.zipCardButton}
            </button>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className={styles.hiddenInput}
              onChange={handleZipInputChange}
            />
          </div>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          {/* Folder option */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>📂</div>
            <h2 className={styles.cardTitle}>{s.folderCardTitle}</h2>
            <p className={styles.cardDescription}>{s.folderCardDetail}</p>
            <button
              className={styles.button}
              onClick={() => folderInputRef.current?.click()}
              disabled={isLoading}
            >
              {s.folderCardButton}
            </button>
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error — webkitdirectory is not in the TS DOM types but works in all modern browsers
              webkitdirectory=""
              className={styles.hiddenInput}
              onChange={handleFolderInputChange}
            />
          </div>
        </div>

        {isLoading && (
          <p className={styles.status}>{s.loadingMessage}</p>
        )}

        {error && (
          <div className={styles.error}>
            <strong>{s.errorLabel}</strong> {error}
          </div>
        )}

        <p className={styles.hint}>{s.exportHint}</p>
      </main>
    </div>
  )
}
