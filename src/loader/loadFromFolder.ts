import type { ChatData } from '../types'
import { parseWhatsAppChat } from '../parser/parseWhatsAppChat'

export async function loadFromFolder(files: FileList): Promise<ChatData> {
  const fileArray = Array.from(files)

  const chatFile = fileArray.find((f) => f.name === '_chat.txt')
  if (!chatFile) {
    throw new Error(
      'Could not find _chat.txt in the selected folder. Make sure you selected the unzipped WhatsApp export folder.',
    )
  }

  const text = await chatFile.text()
  const messages = parseWhatsAppChat(text)

  const mediaFiles = new Map<string, File>()
  for (const file of fileArray) {
    if (file.name !== '_chat.txt') {
      mediaFiles.set(file.name, file)
    }
  }

  const participants = [
    ...new Set(messages.filter((m) => !m.isSystemMessage).map((m) => m.sender)),
  ]

  return { messages, participants, mediaFiles, rawText: text }
}
