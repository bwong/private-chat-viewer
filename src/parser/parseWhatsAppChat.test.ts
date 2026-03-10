import { describe, test, expect } from 'vitest'
import { parseWhatsAppChat, detectDateOrder } from './parseWhatsAppChat'

import iosBasic from './fixtures/ios-basic.txt?raw'
import iosAmpm from './fixtures/ios-ampm.txt?raw'
import androidBasic from './fixtures/android-basic.txt?raw'
import androidAmpm from './fixtures/android-ampm.txt?raw'
import multiline from './fixtures/multiline.txt?raw'
import systemMessages from './fixtures/system-messages.txt?raw'
import mediaRefs from './fixtures/media-refs.txt?raw'

// ─── iOS basic ───────────────────────────────────────────────────────────────

describe('iOS basic format', () => {
  const messages = parseWhatsAppChat(iosBasic)

  test('parses correct number of messages', () => {
    expect(messages).toHaveLength(6)
  })

  test('parses sender correctly', () => {
    expect(messages[0].sender).toBe('Alice')
    expect(messages[1].sender).toBe('Bob')
  })

  test('parses text correctly', () => {
    expect(messages[0].text).toBe('Happy New Year! 🎉')
    expect(messages[3].text).toBe('Just staying home, nothing special.')
  })

  test('parses timestamp correctly', () => {
    const ts = messages[0].timestamp
    expect(ts.getFullYear()).toBe(2023)
    expect(ts.getMonth()).toBe(0) // January = 0
    expect(ts.getDate()).toBe(1)
    expect(ts.getHours()).toBe(10)
    expect(ts.getMinutes()).toBe(0)
    expect(ts.getSeconds()).toBe(0)
  })

  test('parses end-of-day timestamp correctly', () => {
    const ts = messages[5].timestamp
    expect(ts.getHours()).toBe(23)
    expect(ts.getMinutes()).toBe(59)
    expect(ts.getSeconds()).toBe(59)
  })

  test('marks messages as non-system', () => {
    messages.forEach((m) => expect(m.isSystemMessage).toBe(false))
  })

  test('assigns sequential ids', () => {
    expect(messages.map((m) => m.id)).toEqual(['0', '1', '2', '3', '4', '5'])
  })
})

// ─── iOS AM/PM format (US locale) ────────────────────────────────────────────

describe('iOS AM/PM format', () => {
  const messages = parseWhatsAppChat(iosAmpm)

  test('parses correct number of messages', () => {
    expect(messages).toHaveLength(7)
  })

  test('parses senders correctly', () => {
    expect(messages[0].sender).toBe('Brian')
    expect(messages[3].sender).toBe('Nina')
  })

  test('parses 9:27:59 PM correctly (hour 21)', () => {
    expect(messages[0].timestamp.getHours()).toBe(21)
    expect(messages[0].timestamp.getMinutes()).toBe(27)
    expect(messages[0].timestamp.getSeconds()).toBe(59)
  })

  test('parses 12:00:01 AM correctly (hour 0)', () => {
    expect(messages[5].timestamp.getHours()).toBe(0)
  })

  test('parses 12:00:30 PM correctly (hour 12)', () => {
    expect(messages[6].timestamp.getHours()).toBe(12)
  })

  test('parses text correctly', () => {
    expect(messages[0].text).toBe('Hi there')
  })

  test('marks messages as non-system', () => {
    messages.forEach((m) => expect(m.isSystemMessage).toBe(false))
  })
})

// ─── Android basic ───────────────────────────────────────────────────────────

describe('Android basic format', () => {
  const messages = parseWhatsAppChat(androidBasic)

  test('parses correct number of messages', () => {
    expect(messages).toHaveLength(6)
  })

  test('parses sender correctly', () => {
    expect(messages[0].sender).toBe('Alice')
    expect(messages[1].sender).toBe('Bob')
  })

  test('parses text correctly', () => {
    expect(messages[0].text).toBe('Happy New Year! 🎉')
  })

  test('parses timestamp correctly', () => {
    const ts = messages[0].timestamp
    expect(ts.getFullYear()).toBe(2023)
    expect(ts.getMonth()).toBe(0)
    expect(ts.getDate()).toBe(1)
    expect(ts.getHours()).toBe(10)
    expect(ts.getMinutes()).toBe(0)
  })

  test('marks messages as non-system', () => {
    messages.forEach((m) => expect(m.isSystemMessage).toBe(false))
  })
})

// ─── Android AM/PM ───────────────────────────────────────────────────────────

describe('Android AM/PM format', () => {
  const messages = parseWhatsAppChat(androidAmpm)

  test('parses correct number of messages', () => {
    expect(messages).toHaveLength(5)
  })

  test('parses AM hours correctly (10 AM → hour 10)', () => {
    expect(messages[0].timestamp.getHours()).toBe(10)
  })

  test('parses PM hours correctly (12 PM → hour 12)', () => {
    expect(messages[2].timestamp.getHours()).toBe(12)
  })

  test('parses 11:59 PM correctly (hour 23)', () => {
    expect(messages[3].timestamp.getHours()).toBe(23)
    expect(messages[3].timestamp.getMinutes()).toBe(59)
  })

  test('parses 12:00 AM correctly (hour 0)', () => {
    expect(messages[4].timestamp.getHours()).toBe(0)
  })
})

// ─── Multi-line messages ──────────────────────────────────────────────────────

describe('multi-line messages', () => {
  const messages = parseWhatsAppChat(multiline)

  test('parses correct number of messages (not lines)', () => {
    expect(messages).toHaveLength(4)
  })

  test('joins continuation lines with newline', () => {
    expect(messages[0].text).toBe(
      'This is a long message\nthat continues on the second line\nand even a third line here.',
    )
  })

  test('handles bullet-list continuation', () => {
    expect(messages[2].text).toBe('Also wanted to say:\n- point one\n- point two\n- point three')
  })
})

// ─── System messages ─────────────────────────────────────────────────────────

describe('system messages', () => {
  const messages = parseWhatsAppChat(systemMessages)

  test('parses correct total number of messages', () => {
    expect(messages).toHaveLength(8)
  })

  test('marks encryption notice as system message', () => {
    expect(messages[0].isSystemMessage).toBe(true)
    expect(messages[0].text).toContain('end-to-end encrypted')
  })

  test('marks group creation as system message', () => {
    expect(messages[1].isSystemMessage).toBe(true)
    expect(messages[1].sender).toBe('')
  })

  test('marks add-member as system message', () => {
    expect(messages[2].isSystemMessage).toBe(true)
  })

  test('marks leave event as system message', () => {
    expect(messages[7].isSystemMessage).toBe(true)
    expect(messages[7].text).toBe('Bob left')
  })

  test('does not mark regular messages as system', () => {
    expect(messages[4].isSystemMessage).toBe(false)
    expect(messages[4].sender).toBe('Alice')
  })
})

// ─── Media references ────────────────────────────────────────────────────────

describe('media references', () => {
  const messages = parseWhatsAppChat(mediaRefs)

  test('detects iOS "image omitted"', () => {
    expect(messages[0].mediaFilename).toBe('image omitted')
    expect(messages[0].sender).toBe('Alice')
  })

  test('detects iOS <attached: filename>', () => {
    expect(messages[2].mediaFilename).toBe('IMG-20230101-WA0001.jpg')
  })

  test('detects iOS "video omitted"', () => {
    expect(messages[3].mediaFilename).toBe('video omitted')
  })

  test('detects iOS "audio omitted"', () => {
    expect(messages[4].mediaFilename).toBe('audio omitted')
  })

  test('detects iOS "document omitted"', () => {
    expect(messages[5].mediaFilename).toBe('document omitted')
  })

  test('detects iOS "sticker omitted"', () => {
    expect(messages[7].mediaFilename).toBe('sticker omitted')
  })

  test('non-media messages have null mediaFilename', () => {
    expect(messages[1].mediaFilename).toBeNull()
  })
})

// ─── Edited messages ──────────────────────────────────────────────────────────

describe('edited messages', () => {
  test('strips inline " ‎<This message was edited>" (real iOS format) and sets isEdited=true', () => {
    // Real iOS format: edited mark appended inline with a U+200E bidi mark
    const text =
      '[6/23/23, 7:03:28 AM] Brian: P woke up at 620 \u200e<This message was edited>'
    const messages = parseWhatsAppChat(text)
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toBe('P woke up at 620')
    expect(messages[0].isEdited).toBe(true)
  })

  test('strips continuation-line <This message was edited> and sets isEdited=true', () => {
    const text =
      '[01/01/2023, 10:00:00] Alice: Hello world\n<This message was edited>'
    const messages = parseWhatsAppChat(text)
    expect(messages).toHaveLength(1)
    expect(messages[0].text).toBe('Hello world')
    expect(messages[0].isEdited).toBe(true)
  })

  test('does not set isEdited for unedited messages', () => {
    const messages = parseWhatsAppChat('[01/01/2023, 10:00:00] Alice: Hello')
    expect(messages[0].isEdited).toBeFalsy()
  })

  test('handles multi-line message followed by edited mark', () => {
    const text =
      '[01/01/2023, 10:00:00] Alice: Line one\nLine two\n<This message was edited>'
    const messages = parseWhatsAppChat(text)
    expect(messages[0].text).toBe('Line one\nLine two')
    expect(messages[0].isEdited).toBe(true)
  })

  test('preserves media filename and sets isEdited for edited media messages', () => {
    const text =
      '[01/01/2023, 10:00:00] Alice: <attached: photo.jpg>\n<This message was edited>'
    const messages = parseWhatsAppChat(text)
    expect(messages[0].mediaFilename).toBe('photo.jpg')
    expect(messages[0].isEdited).toBe(true)
  })
})

// ─── detectDateOrder ──────────────────────────────────────────────────────────

describe('detectDateOrder', () => {
  test('certain mm/dd when second number > 12 (e.g. 12/19/23)', () => {
    const result = detectDateOrder('[12/19/23, 9:12:09 AM] Nina: test')
    expect(result.order).toBe('mm/dd')
    expect(result.confidence).toBe('certain')
  })

  test('certain dd/mm when first number > 12 (e.g. 13/01/2023)', () => {
    const result = detectDateOrder('[13/01/2023, 10:00:00] Alice: Hello')
    expect(result.order).toBe('dd/mm')
    expect(result.confidence).toBe('certain')
  })

  test('guessed mm/dd from AM/PM when all dates ambiguous', () => {
    const result = detectDateOrder('1/1/23, 10:00 AM - Alice: hi')
    expect(result.order).toBe('mm/dd')
    expect(result.confidence).toBe('guessed')
  })

  test('guessed dd/mm from 24h when all dates ambiguous', () => {
    const result = detectDateOrder('[01/01/2023, 10:00:00] Alice: Hello')
    expect(result.order).toBe('dd/mm')
    expect(result.confidence).toBe('guessed')
  })

  test('guessed dd/mm for empty text', () => {
    const result = detectDateOrder('')
    expect(result.order).toBe('dd/mm')
    expect(result.confidence).toBe('guessed')
  })
})

// ─── parseWhatsAppChat dateOrderOverride ──────────────────────────────────────

describe('parseWhatsAppChat dateOrderOverride', () => {
  test('override dd/mm forces DD/MM parsing even on AM/PM export', () => {
    // [1/3/23] with AM/PM auto-detects as MM/DD → January 3
    // with dd/mm override → March 1
    const msgs = parseWhatsAppChat('[1/3/23, 9:00:00 AM] Alice: hi', 'dd/mm')
    expect(msgs[0].timestamp.getMonth()).toBe(2) // March = 2
    expect(msgs[0].timestamp.getDate()).toBe(1)
  })

  test('override mm/dd forces MM/DD parsing on 24h export', () => {
    // [3/1/2023] with 24h auto-detects as DD/MM → January 3
    // with mm/dd override → March 1... wait, day > 12 so verify unambiguous
    // Use [1/3/2023] 24h: auto=DD/MM → March 1, override=MM/DD → January 3
    const msgs = parseWhatsAppChat('[1/3/2023, 10:00:00] Alice: hi', 'mm/dd')
    expect(msgs[0].timestamp.getMonth()).toBe(0) // January = 0
    expect(msgs[0].timestamp.getDate()).toBe(3)
  })
})

// ─── iOS AM/PM date order (US locale MM/DD) ───────────────────────────────────

describe('iOS AM/PM US locale date order', () => {
  test('parses MM/DD/YY correctly when day > 12 (unambiguous)', () => {
    // 12/19/23 must be December 19 — month 19 is impossible, so first = month, second = day
    const messages = parseWhatsAppChat('[12/19/23, 9:12:09 AM] Nina: test message')
    expect(messages).toHaveLength(1)
    const ts = messages[0].timestamp
    expect(ts.getFullYear()).toBe(2023)
    expect(ts.getMonth()).toBe(11) // December = 11
    expect(ts.getDate()).toBe(19)
    expect(ts.getHours()).toBe(9)
    expect(ts.getMinutes()).toBe(12)
  })

  test('parses ambiguous date as MM/DD when AM/PM present', () => {
    // [4/10/11] with AM/PM → April 10, 2011 (not October 4)
    const messages = parseWhatsAppChat('[4/10/11, 9:27:59 PM] Brian: Hi')
    const ts = messages[0].timestamp
    expect(ts.getMonth()).toBe(3) // April = 3
    expect(ts.getDate()).toBe(10)
    expect(ts.getFullYear()).toBe(2011)
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('returns empty array for empty input', () => {
    expect(parseWhatsAppChat('')).toEqual([])
  })

  test('strips BOM from start of file', () => {
    const withBom = '\uFEFF[01/01/2023, 10:00:00] Alice: Hello'
    const messages = parseWhatsAppChat(withBom)
    expect(messages).toHaveLength(1)
    expect(messages[0].sender).toBe('Alice')
  })

  test('ignores lines before first timestamped message', () => {
    const text = 'some header line\nanother line\n[01/01/2023, 10:00:00] Alice: Hi'
    const messages = parseWhatsAppChat(text)
    expect(messages).toHaveLength(1)
  })

  test('handles Windows-style CRLF line endings', () => {
    const text = '[01/01/2023, 10:00:00] Alice: Hello\r\n[01/01/2023, 10:01:00] Bob: Hi\r\n'
    const messages = parseWhatsAppChat(text)
    expect(messages).toHaveLength(2)
    expect(messages[0].text).toBe('Hello')
  })

  test('handles iOS exports where every line is prefixed with U+200E', () => {
    // Some iOS exports prepend the LTR mark to all lines, not just system messages
    const text =
      '\u200e[01/01/2023, 10:00:00] Alice: Hello\n' +
      '\u200e[01/01/2023, 10:01:00] Bob: World\n' +
      '\u200e[01/01/2023, 10:02:00] \u200eAlice created group "Test"\n'
    const messages = parseWhatsAppChat(text)
    expect(messages).toHaveLength(3)
    expect(messages[0].sender).toBe('Alice')
    expect(messages[0].text).toBe('Hello')
    expect(messages[1].sender).toBe('Bob')
    expect(messages[2].isSystemMessage).toBe(true)
  })
})
