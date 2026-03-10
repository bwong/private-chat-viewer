import type { Message } from '../types'

// iOS export format:    [DD/MM/YYYY, HH:MM:SS] Sender: text
// Android export format: DD/MM/YYYY, HH:MM - Sender: text
//                     or D/M/YY, H:MM AM/PM - Sender: text

const IOS_DATE_PREFIX_RE =
  /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2}):(\d{2})\] /

const ANDROID_DATE_PREFIX_RE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)? - /i

// U+200E LEFT-TO-RIGHT MARK — WhatsApp prepends this to system messages in iOS exports
const LTR_MARK = '\u200e'
const RTL_MARK = '\u200f'
const BIDI_MARKS_RE = /^[\u200e\u200f]+/

// Media attachment patterns
const IOS_MEDIA_ATTACHED_RE = /^<attached: (.+)>$/
const IOS_MEDIA_OMITTED_RE =
  /^[\u200e\u200f]?(image|video|audio|sticker|document|GIF) omitted$/u
const ANDROID_MEDIA_ATTACHED_RE = /^(.+) \(file attached\)$/

type Format = 'ios' | 'android'

interface RawEntry {
  timestamp: Date
  body: string
}

function detectFormat(text: string): Format {
  // Scan the first several lines to find the first timestamped one.
  // Header lines may appear before any timestamps.
  for (const line of text.split('\n').slice(0, 20)) {
    if (line.startsWith('[')) return 'ios'
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4},/.test(line)) return 'android'
  }
  return 'ios' // fallback
}

function parseDate(
  day: string,
  month: string,
  year: string,
  hour: string,
  minute: string,
  second: string | undefined,
  ampm: string | undefined,
): Date {
  let h = parseInt(hour, 10)
  const m = parseInt(minute, 10)
  const s = second ? parseInt(second, 10) : 0
  const y = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10)
  // WhatsApp uses DD/MM/YYYY globally; locale variations (MM/DD) are a known edge case
  const d = parseInt(day, 10)
  const mo = parseInt(month, 10) - 1 // 0-indexed month

  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  }

  return new Date(y, mo, d, h, m, s)
}

function extractIosEntry(line: string): RawEntry | null {
  const match = IOS_DATE_PREFIX_RE.exec(line)
  if (!match) return null
  const [, day, month, year, hour, minute, second] = match
  const timestamp = parseDate(day, month, year, hour, minute, second, undefined)
  const body = line.slice(match[0].length)
  return { timestamp, body }
}

function extractAndroidEntry(line: string): RawEntry | null {
  const match = ANDROID_DATE_PREFIX_RE.exec(line)
  if (!match) return null
  const [, day, month, year, hour, minute, second, ampm] = match
  const timestamp = parseDate(day, month, year, hour, minute, second, ampm)
  const body = line.slice(match[0].length)
  return { timestamp, body }
}

function extractMediaFilename(text: string): string | null {
  let m = IOS_MEDIA_ATTACHED_RE.exec(text)
  if (m) return m[1]

  m = ANDROID_MEDIA_ATTACHED_RE.exec(text)
  if (m) return m[1]

  if (IOS_MEDIA_OMITTED_RE.test(text)) {
    // e.g. "‎image omitted" — no actual filename, just a placeholder
    return text.replace(BIDI_MARKS_RE, '').trim()
  }

  return null
}

function entryToMessage(id: string, timestamp: Date, body: string): Message {
  // System message signals:
  //   iOS:     body starts with LTR_MARK (U+200E)
  //   Android: body has no ": " separator (no sender field)
  const startsWithBidi = body.startsWith(LTR_MARK) || body.startsWith(RTL_MARK)
  const colonIndex = body.indexOf(': ')

  if (startsWithBidi || colonIndex === -1) {
    return {
      id,
      timestamp,
      sender: '',
      text: body.replace(BIDI_MARKS_RE, '').trim(),
      mediaFilename: null,
      isSystemMessage: true,
    }
  }

  const sender = body.slice(0, colonIndex)
  const text = body.slice(colonIndex + 2)
  const mediaFilename = extractMediaFilename(text)

  return {
    id,
    timestamp,
    sender,
    text,
    mediaFilename,
    isSystemMessage: false,
  }
}

export function parseWhatsAppChat(rawText: string): Message[] {
  // Strip BOM if present
  const text = rawText.startsWith('\uFEFF') ? rawText.slice(1) : rawText
  const lines = text.split('\n').map((l) => l.trimEnd())

  const format = detectFormat(text)
  const extractEntry = format === 'ios' ? extractIosEntry : extractAndroidEntry

  const messages: Message[] = []
  let currentTimestamp: Date | null = null
  let currentBodyLines: string[] = []
  let idCounter = 0

  function flush(): void {
    if (currentTimestamp === null) return
    const body = currentBodyLines.join('\n').trimEnd()
    messages.push(entryToMessage(String(idCounter++), currentTimestamp, body))
    currentTimestamp = null
    currentBodyLines = []
  }

  for (const line of lines) {
    const entry = extractEntry(line)
    if (entry) {
      flush()
      currentTimestamp = entry.timestamp
      currentBodyLines = [entry.body]
    } else if (currentTimestamp !== null) {
      // Continuation line of a multi-line message
      currentBodyLines.push(line)
    }
    // Lines before the first timestamped message are ignored
  }

  flush()

  return messages
}
