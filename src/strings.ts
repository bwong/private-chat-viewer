/**
 * All user-facing strings in one place.
 *
 * To add a new language, create a matching object that satisfies `typeof en`
 * and swap it in via a locale-selection mechanism (e.g. react-i18next).
 */
export const strings = {
  // ── Landing page ────────────────────────────────────────────────────────────
  landing: {
    privacyBanner: 'Your data never leaves this browser.',
    privacyDetail:
      'All processing happens locally. You can turn off your internet connection and this app will continue to work.',
    appTitle: 'WhatsApp Chat Reader',
    appSubtitle: 'Load a WhatsApp export to browse, read, and search your messages offline.',
    zipCardTitle: 'Upload .zip file',
    zipCardDetail: 'Select or drag & drop the .zip file exported directly from WhatsApp.',
    zipCardButton: 'Choose .zip file',
    folderCardTitle: 'Open folder',
    folderCardDetail:
      'Already unzipped? Select the folder that contains _chat.txt and your media files. Better for large exports.',
    folderCardButton: 'Choose folder',
    loadingMessage: 'Loading and parsing your chat… this may take a moment for large exports.',
    errorLabel: 'Error:',
    exportHint: 'To export from WhatsApp: open a chat → ⋮ menu → More → Export chat.',
    dropZipOnly: 'Please drop a .zip file. To load an unzipped folder, use the "Open folder" button.',
  },

  // ── Chat reader header ───────────────────────────────────────────────────────
  header: {
    back: '← Back',
    statMessages: (n: number) => `${n.toLocaleString()} messages`,
    statParticipants: (n: number) => `${n} participants`,
    statMedia: (n: number) => `${n.toLocaleString()} media`,
    youLabel: (name: string) => `You: ${name}`,
    noIdentity: 'No identity set',
    dateFormatButtonTitle: 'Change date format',
    searchAriaLabel: 'Search messages',
    calendarAriaLabel: 'Jump to date',
  },

  // ── Participant picker ───────────────────────────────────────────────────────
  participantPicker: {
    title: 'Who are you in this chat?',
    subtitle: 'Your messages will appear on the right, just like in WhatsApp.',
    notListed: "My name isn't listed…",
    manualNote:
      'Participants could not be detected automatically. Type your name exactly as it appears in the chat:',
    manualPlaceholder: 'Your name in the chat',
    confirm: 'Confirm',
    skip: 'Skip — show all messages on the left',
    dismiss: 'Close',
  },

  // ── Date format picker ───────────────────────────────────────────────────────
  dateFormatPicker: {
    title: 'Date format',
    subtitle: 'How are dates ordered in this chat? Select the format that matches your export.',
    guessedNote:
      'Could not detect with certainty — guessed from time format. Adjust if dates look wrong.',
    monthDay: 'Month / Day (e.g. 6/23/25)',
    dayMonth: 'Day / Month (e.g. 23/6/25)',
    cancel: 'Cancel',
  },

  // ── Search panel ─────────────────────────────────────────────────────────────
  search: {
    placeholder: 'Search messages…',
    closeAriaLabel: 'Close search',
    noResults: 'No results',
    manyResults: '200+ results',
    resultCount: (n: number) => `${n} result${n === 1 ? '' : 's'}`,
  },

  // ── Calendar panel ───────────────────────────────────────────────────────────
  calendar: {
    title: 'Jump to date',
    closeAriaLabel: 'Close calendar',
    prevAriaLabel: 'Previous month',
    nextAriaLabel: 'Next month',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    dayAbbreviations: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  },

  // ── Media gallery ────────────────────────────────────────────────────────────
  mediaGallery: {
    title: 'Media',
    close: 'Close',
    empty: 'No media files in this chat.',
    photos: (n: number) => `Photos (${n})`,
    videos: (n: number) => `Videos (${n})`,
    audio: (n: number) => `Audio (${n})`,
    files: (n: number) => `Files (${n})`,
    openAriaLabel: 'Browse media',
  },

  // ── Media lightbox ───────────────────────────────────────────────────────────
  mediaLightbox: {
    download: 'Download',
    close: 'Close',
    expand: 'View full size',
  },

  // ── Message bubble ───────────────────────────────────────────────────────────
  messageBubble: {
    mediaOmitted: 'Media not included in export',
    mediaNotFound: 'Photo no longer available',
    edited: 'Edited',
  },

  // ── Date separator ───────────────────────────────────────────────────────────
  dateSeparator: {
    today: 'Today',
    yesterday: 'Yesterday',
  },
} as const
