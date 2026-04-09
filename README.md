# Music PDF Page Turner

A web-based music PDF viewer with **hands-free page turning** via head-nod gesture detection. Musicians nod 3 times deliberately to advance to the next page — no hands needed.

## Demo

Open a PDF score → Enable Camera → Nod 3× to turn the page.

## Features

- **PDF rendering** — client-side only, no uploads, using Mozilla's pdf.js
- **Head-nod gesture detection** — MediaPipe FaceMesh tracks your nose tip in real-time
- **Configurable gesture** — adjust required nod count (2–5), sensitivity, time window, cooldown
- **Undo** — press `U` or click Undo within 5 seconds of a page turn
- **Keyboard shortcuts** — `→` / `Space` for next, `←` for previous
- **Debug display** — live camera thumbnail + gesture progress bar

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm test             # Run Vitest unit tests (32 tests)
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| PDF Rendering | pdfjs-dist (client-side, no server) |
| Gesture Detection | MediaPipe FaceMesh (CDN, WASM) |
| Tests | Vitest + React Testing Library |
| Deployment | Vercel |

## Gesture Design

- **3 deliberate nods** within a 3-second window → page turns
- **2-second cooldown** after each turn (prevents double-turns)
- **Undo** available for 5 seconds after each turn
- All parameters are configurable via the sidebar

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel --prod
```

Or connect the GitHub repo at vercel.com for automatic deploys.

### Any static host

```bash
npm run build
# Deploy .next/ directory
```

## Privacy

PDFs are never uploaded. All processing happens in your browser.
Camera feed is processed locally by MediaPipe — no video data leaves your device.

## Future Roadmap

- Audio pitch following (detect musical cues for automatic page turns)
- BLE foot pedal support
- React Native / Android port
- Cloud PDF library sync
