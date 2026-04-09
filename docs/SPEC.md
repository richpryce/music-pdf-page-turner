# Music PDF Page Turner — Product Specification

## Overview

A web-based music PDF viewer that allows musicians to turn pages hands-free using head-nod gestures detected via the device camera. Musicians playing instruments cannot use their hands for page turns, making gesture-based control a practical necessity.

## Target Users

- Instrumentalists (pianists, guitarists, violinists, etc.) reading sheet music
- Practice sessions and live performances
- Any musician who needs hands-free page navigation

## MVP Goals

1. Upload and render a PDF music score in-browser (no server upload required)
2. Navigate pages with on-screen previous/next controls
3. Detect head-nod gestures via browser camera to trigger next-page
4. Minimize accidental page turns with deliberate gesture (3 nods) + cooldown
5. Visual debug/status display for gesture calibration

## Core Features

### PDF Rendering
- Upload a local PDF file (File API, client-side only)
- Render pages using pdf.js (Mozilla's open source PDF renderer)
- Single-page display, fit-to-width for score readability
- Previous / Next page buttons
- Page indicator (e.g., "Page 3 of 47")
- Keyboard shortcuts: ArrowRight / Space → next, ArrowLeft → previous

### Gesture Detection
- Request camera permission gracefully on user action (not on load)
- Use MediaPipe FaceMesh for facial landmark tracking
- Track nose tip Y-coordinate to detect nods
- **Default gesture:** 3 deliberate nods within a 3-second window triggers next page
- Configurable sensitivity (nod threshold) and gesture window
- Cooldown period (2 seconds) after a page turn to prevent accidental double turns
- Undo last page turn: press `U` or click Undo button within 5 seconds

### Status / Debug Display
- Real-time camera feed thumbnail (small, corner overlay)
- Gesture status: "Waiting", "Nod detected (1/3)", "Nod detected (2/3)", "TURNING!"
- Current nod count within window
- Cooldown countdown indicator
- Enable/disable gesture detection toggle

### Calibration (Stretch)
- Sensitivity slider: adjust nod amplitude threshold
- Gesture window duration (2–5 seconds)
- Option to require N nods (2–5) before triggering

## Non-Goals for MVP

- Audio following / score synchronization
- Multi-page layouts (2-page spread)
- Page annotations or markup
- Cloud storage or user accounts
- Mobile app / native Android

## Future Architecture Hooks

The design deliberately separates concerns to support future growth:

| Layer | Now | Future |
|-------|-----|--------|
| Gesture source | Camera (MediaPipe) | Audio pitch following, BLE pedal |
| Rendering | Web (pdf.js) | React Native / Android native |
| Storage | LocalStorage / IndexedDB | Cloud sync |
| Detection | Rule-based nod counter | ML-based gesture classifier |

## Technical Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **PDF Rendering:** pdfjs-dist (Mozilla PDF.js)
- **Gesture Detection:** @mediapipe/face_mesh via CDN loader
- **Testing:** Vitest + React Testing Library + Playwright (E2E)
- **Deployment:** Vercel (primary), or Netlify/Cloudflare Pages as fallback

## User Flow

```
1. Land on page → "Upload a PDF score to get started"
2. User clicks "Open PDF" → file picker opens
3. PDF renders, page 1 shown
4. User clicks "Enable Camera" → browser permission prompt
5. Camera starts, small thumbnail shows in corner
6. Status shows "Ready — nod 3x to turn page"
7. User nods 3 times → status shows "1/3", "2/3", "Turning!"
8. Page advances, cooldown activates (2s)
9. User can press Undo or ← to go back
```

## Acceptance Criteria

- [ ] PDF opens and renders without server round-trip
- [ ] Next/Prev page controls work correctly
- [ ] Camera permission flow is clear and skippable
- [ ] 3 deliberate nods within 3 seconds advance the page
- [ ] Accidental single nods do NOT advance the page
- [ ] Cooldown prevents double-turns
- [ ] Status display shows gesture progress in real-time
- [ ] App builds and runs with `npm run dev`
- [ ] App passes `npm test` with meaningful test coverage
- [ ] Deployable to Vercel with zero configuration
