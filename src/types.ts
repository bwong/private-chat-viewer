export interface Message {
  id: string
  timestamp: Date
  sender: string
  text: string
  mediaFilename: string | null
  isSystemMessage: boolean
}

export interface ChatData {
  messages: Message[]
  participants: string[]
  mediaFiles: Map<string, File>
}

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; chat: ChatData }
  | { status: 'error'; message: string }
