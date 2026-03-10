import { useRef, useState } from 'react'
import styles from './LandingPage.module.css'

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
      alert('Please drop a .zip file. To load an unzipped folder, use the "Open folder" button.')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.privacyBanner}>
        <span className={styles.privacyIcon}>🔒</span>
        <span>
          <strong>Your data never leaves this browser.</strong> All processing happens locally. You
          can turn off your internet connection and this app will continue to work.
        </span>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>WhatsApp Chat Reader</h1>
        <p className={styles.subtitle}>
          Load a WhatsApp export to browse, read, and search your messages offline.
        </p>

        <div className={styles.options}>
          {/* ZIP option */}
          <div
            className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={styles.cardIcon}>📦</div>
            <h2 className={styles.cardTitle}>Upload .zip file</h2>
            <p className={styles.cardDescription}>
              Select or drag & drop the <code>.zip</code> file exported directly from WhatsApp.
            </p>
            <button
              className={styles.button}
              onClick={() => zipInputRef.current?.click()}
              disabled={isLoading}
            >
              Choose .zip file
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
            <h2 className={styles.cardTitle}>Open folder</h2>
            <p className={styles.cardDescription}>
              Already unzipped? Select the folder that contains <code>_chat.txt</code> and your
              media files. Better for large exports.
            </p>
            <button
              className={styles.button}
              onClick={() => folderInputRef.current?.click()}
              disabled={isLoading}
            >
              Choose folder
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
          <p className={styles.status}>Loading and parsing your chat… this may take a moment for large exports.</p>
        )}

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <p className={styles.hint}>
          To export from WhatsApp: open a chat → ⋮ menu → More → Export chat.
        </p>
      </main>
    </div>
  )
}
