import JSZip from 'jszip'
import type { ChatData } from '../types'
import { parseWhatsAppChat } from '../parser/parseWhatsAppChat'

export async function loadFromZip(file: File): Promise<ChatData> {
  const zip = await JSZip.loadAsync(file)

  // WhatsApp exports _chat.txt at the root of the zip
  const chatFile = zip.file('_chat.txt')
  if (!chatFile) {
    throw new Error(
      'Could not find _chat.txt in the zip file. Make sure you selected a WhatsApp export.',
    )
  }

  const text = await chatFile.async('string')
  const messages = parseWhatsAppChat(text)

  // Collect all media files (everything except _chat.txt)
  const mediaFiles = new Map<string, File>()
  const mediaPromises: Promise<void>[] = []

  zip.forEach((relativePath, zipEntry) => {
    if (relativePath === '_chat.txt' || zipEntry.dir) return
    const filename = relativePath.split('/').pop() ?? relativePath
    const promise = zipEntry.async('blob').then((blob) => {
      mediaFiles.set(filename, new File([blob], filename))
    })
    mediaPromises.push(promise)
  })

  await Promise.all(mediaPromises)

  const participants = [
    ...new Set(messages.filter((m) => !m.isSystemMessage).map((m) => m.sender)),
  ]

  return { messages, participants, mediaFiles }
}
