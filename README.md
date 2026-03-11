# Private Chat Viewer

A private, offline viewer for WhatsApp chat exports. No uploads, no server — everything runs entirely in your browser.

## Features

- **100% private** — your chat data never leaves your device
- Load a WhatsApp `.txt` export (with or without a media zip)
- Auto-detects date format (MM/DD vs DD/MM) from your export
- Scroll through messages in a familiar chat UI
- Floating date chip while scrolling (like WhatsApp/iMessage)
- Jump to any date via calendar
- Search messages
- Identify yourself to distinguish sent vs received messages
- Supports images, video, audio, and file attachments
- Click images or videos to view full-screen with download option
- Media gallery to browse all photos, videos, and files by month

## How to export your WhatsApp chat

**On iPhone:**
1. Open a chat → tap the contact name → Scroll down → **Export Chat**
2. Choose **With Media** or **Without Media**
3. Save or share the resulting `.zip` or `.txt` file

**On Android:**
1. Open a chat → tap ⋮ → **More** → **Export Chat**
2. Choose **With Media** or **Without Media**

## Usage

1. Go to [private-chat-viewer.vercel.app](https://private-chat-viewer.vercel.app) *(or self-host, see below)*
2. Drop your `.txt` export file (and optionally the media `.zip`) onto the page
3. Pick who you are in the conversation
4. Read your chat

## Self-hosting

### With Node

```bash
git clone https://github.com/bwong/private-chat-viewer.git
cd private-chat-viewer
npm install
npm run build
npm run preview
```

For local development with hot reload:

```bash
npm run dev
```

### With Docker

```bash
docker build -t private-chat-viewer .
docker run -p 8080:80 private-chat-viewer
```

Then open [http://localhost:8080](http://localhost:8080).

## Tech stack

- React + TypeScript
- Vite
- TanStack Virtual (virtualized message list)
- CSS Modules
- No backend, no tracking, no analytics

## Contributing

PRs welcome. Please open an issue first for large changes.

## License

MIT
