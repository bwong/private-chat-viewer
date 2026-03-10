import type { Message } from '../types'

// iOS export formats:
//   [DD/MM/YYYY, HH:MM:SS] Sender: text          (24h, global → DD/MM)
//   [M/D/YY, H:MM:SS AM/PM] Sender: text         (12h, US locale → MM/DD)
// Android export format: DD/MM/YYYY, HH:MM - Sender: text
//                     or D/M/YY, H:MM AM/PM - Sender: text

const IOS_DATE_PREFIX_RE =
  /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?\] /i

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

export type DateOrder = 'mm/dd' | 'dd/mm'

type Format = 'ios' | 'android'

interface RawEntry {
  timestamp: Date
  body: string
}

function detectFormat(text: string): Format {
  for (const line of text.split('\n').slice(0, 20)) {
    const clean = line.replace(BIDI_MARKS_RE, '')
    if (clean.startsWith('[')) return 'ios'
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4},/.test(clean)) return 'android'
  }
  return 'ios' // fallback
}

export type DateOrderConfidence = 'certain' | 'guessed'

/**
 * Detect the date component order from the raw export text.
 *
 * Scans the entire file but short-circuits as soon as an unambiguous date is
 * found (a component value that is impossible for one interpretation):
 *   first number > 12  → must be the day  → DD/MM, certain
 *   second number > 12 → must be the day  → MM/DD, certain
 *
 * Only if every date in the file has both components ≤ 12 (truly ambiguous)
 * does it fall back to a weaker signal:
 *   AM/PM seen anywhere → MM/DD, guessed
 *   24h throughout      → DD/MM, guessed
 */
export function detectDateOrder(
  rawText: string,
): { order: DateOrder; confidence: DateOrderConfidence } {
  const text = rawText.startsWith('\uFEFF') ? rawText.slice(1) : rawText
  let ampmSeen = false

  for (const line of text.split('\n')) {
    const clean = line.replace(BIDI_MARKS_RE, '')
    const m =
      IOS_DATE_PREFIX_RE.exec(clean) ?? ANDROID_DATE_PREFIX_RE.exec(clean)
    if (!m) continue
    const first = parseInt(m[1], 10)
    const second = parseInt(m[2], 10)
    if (first > 12) return { order: 'dd/mm', confidence: 'certain' }
    if (second > 12) return { order: 'mm/dd', confidence: 'certain' }
    if (m[7]) ampmSeen = true
  }

  return { order: ampmSeen ? 'mm/dd' : 'dd/mm', confidence: 'guessed' }
}

function parseDate(
  day: string,
  month: string,
  year: string,
  hour: string,
  minute: string,
  second: string | undefined,
  ampm: string | undefined,
  usLocale: boolean,
): Date {
  let h = parseInt(hour, 10)
  const m = parseInt(minute, 10)
  const s = second ? parseInt(second, 10) : 0
  const y = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10)

  // usLocale (MM/DD): first number is month, second is day.
  // International (DD/MM): first number is day, second is month.
  let d: number
  let mo: number
  if (usLocale) {
    mo = parseInt(day, 10) - 1
    d = parseInt(month, 10)
  } else {
    d = parseInt(day, 10)
    mo = parseInt(month, 10) - 1
  }

  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
  }

  return new Date(y, mo, d, h, m, s)
}

function extractIosEntry(line: string, usLocale: boolean): RawEntry | null {
  const clean = line.replace(BIDI_MARKS_RE, '')
  const match = IOS_DATE_PREFIX_RE.exec(clean)
  if (!match) return null
  const [, day, month, year, hour, minute, second, ampm] = match
  const timestamp = parseDate(day, month, year, hour, minute, second, ampm, usLocale)
  const body = clean.slice(match[0].length)
  return { timestamp, body }
}

function extractAndroidEntry(line: string, usLocale: boolean): RawEntry | null {
  const clean = line.replace(BIDI_MARKS_RE, '')
  const match = ANDROID_DATE_PREFIX_RE.exec(clean)
  if (!match) return null
  const [, day, month, year, hour, minute, second, ampm] = match
  const timestamp = parseDate(day, month, year, hour, minute, second, ampm, usLocale)
  const body = clean.slice(match[0].length)
  return { timestamp, body }
}

function extractMediaFilename(text: string): string | null {
  const clean = text.replace(BIDI_MARKS_RE, '')

  let m = IOS_MEDIA_ATTACHED_RE.exec(clean)
  if (m) return m[1]

  m = ANDROID_MEDIA_ATTACHED_RE.exec(clean)
  if (m) return m[1]

  if (IOS_MEDIA_OMITTED_RE.test(clean)) {
    return clean.trim()
  }

  return null
}

function entryToMessage(id: string, timestamp: Date, body: string): Message {
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
  let rawText = body.slice(colonIndex + 2)

  // Strip the edited annotation — appears inline with a bidi mark on the same line,
  // or as a continuation line depending on the platform/version.
  // e.g. "text ‎<This message was edited>" or "text\n<This message was edited>"
  const EDITED_MARK_RE = /[\n ][\u200e\u200f]*<This message was edited>$/
  const isEdited = EDITED_MARK_RE.test(rawText)
  if (isEdited) rawText = rawText.replace(EDITED_MARK_RE, '')

  const mediaFilename = extractMediaFilename(rawText)
  const text = mediaFilename ? '' : rawText

  return {
    id,
    timestamp,
    sender,
    text,
    mediaFilename,
    isSystemMessage: false,
    isEdited,
  }
}

export function parseWhatsAppChat(rawText: string, dateOrderOverride?: DateOrder): Message[] {
  const text = rawText.startsWith('\uFEFF') ? rawText.slice(1) : rawText
  const lines = text.split('\n').map((l) => l.trimEnd())

  const format = detectFormat(text)
  const dateOrder = dateOrderOverride ?? detectDateOrder(text).order
  const usLocale = dateOrder === 'mm/dd'

  const extractEntry =
    format === 'ios'
      ? (line: string) => extractIosEntry(line, usLocale)
      : (line: string) => extractAndroidEntry(line, usLocale)

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
      currentBodyLines.push(line)
    }
  }

  flush()

  return messages
}
