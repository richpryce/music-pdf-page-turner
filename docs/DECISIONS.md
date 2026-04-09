# Architecture Decision Log

## ADR-001: Next.js App Router (not Vite SPA)

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Need a deployable web app. Options: Vite SPA, Next.js Pages Router, Next.js App Router, plain HTML.

**Decision:** Next.js 14 with App Router.

**Reasoning:**
- Zero-config Vercel deployment (important for MVP delivery)
- TypeScript out of the box
- Easy to add server-side features later (cloud PDF storage, auth)
- App Router is the current recommended default
- Good ecosystem support for pdf.js and MediaPipe

**Trade-offs:** Slightly heavier than Vite SPA; overkill for purely static use, but deployment simplicity wins.

---

## ADR-002: pdf.js for PDF Rendering

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Need to render multi-page PDFs in-browser without server.

**Decision:** pdfjs-dist (Mozilla PDF.js).

**Reasoning:**
- Battle-tested, used by Firefox
- Handles complex PDFs (embedded fonts, images, vector graphics)
- Full client-side rendering — no data leaves the device
- react-pdf wrapper for easier React integration

**Trade-offs:** Large bundle size (~2MB); mitigated by dynamic import.

---

## ADR-003: MediaPipe FaceMesh for Gesture Detection

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Need reliable head-nod detection in-browser without a backend.

**Decision:** @mediapipe/face_mesh via CDN, using nose-tip Y-coordinate tracking.

**Reasoning:**
- Runs entirely in-browser via WASM + WebGL
- 468 facial landmarks provide robust tracking
- Nose tip (landmark 1) Y-coordinate is a reliable nod proxy
- No API key required; works offline after initial load

**Alternatives considered:**
- TensorFlow.js face-landmarks-detection: similar capability but larger dependency
- Rule-based webcam pixel analysis: unreliable

**Trade-offs:** ~8MB model download on first use; cached by browser after that.

---

## ADR-004: 3-Nod Gesture Design

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Need a gesture that is deliberate enough to prevent accidents but natural enough to use while playing.

**Decision:** 3 deliberate nods within a 3-second window triggers next page. 2-second cooldown follows.

**Reasoning:**
- 1 nod: too easy to trigger accidentally (cough, look at stand)
- 2 nods: borderline; may catch natural reading nods
- 3 nods: deliberate intent required
- 3-second window: accommodates natural nod tempo
- 2-second cooldown: prevents double triggers

---

## ADR-005: Client-Side Only PDF Handling

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Musicians' sheet music is often personal or licensed material.

**Decision:** PDF never leaves the device. File is read via FileReader API and rendered entirely in-browser.

**Reasoning:**
- Privacy: no music data uploaded to any server
- Simplicity: no backend storage needed for MVP
- Performance: no network round-trip for rendering

---

## ADR-006: Tailwind CSS for Styling

**Date:** 2026-04-09
**Status:** Accepted

**Context:** Need styling that is fast to develop and produces a clean, functional UI.

**Decision:** Tailwind CSS v3.

**Reasoning:**
- Utility-first: fast iteration
- Works seamlessly with Next.js
- Dark mode support (useful for stage use)
- No runtime overhead (purged at build time)

## Quick Reference

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Next.js App Router | Accepted | 2026-04-09 |
| ADR-002 | pdf.js for PDF Rendering | Accepted | 2026-04-09 |
| ADR-003 | MediaPipe FaceMesh | Accepted | 2026-04-09 |
| ADR-004 | 3-Nod Gesture Design | Accepted | 2026-04-09 |
| ADR-005 | Client-Side PDF Handling | Accepted | 2026-04-09 |
| ADR-006 | Tailwind CSS | Accepted | 2026-04-09 |
