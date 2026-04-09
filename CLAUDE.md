# CLAUDE.md

## Project Overview

**What:** Web-based music PDF viewer with hands-free head-nod gesture page turning via MediaPipe FaceMesh + browser camera
**Stack:** Next.js 14, TypeScript, Tailwind CSS, pdfjs-dist, MediaPipe FaceMesh (CDN)
**Status:** Active development (MVP complete)

## Commands

```
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build
npm test             # Run Vitest unit tests
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
```

## Structure

```
src/
  app/            # Next.js App Router (layout.tsx, page.tsx, globals.css)
  components/     # UI components (pdf-viewer, gesture-status, camera-preview)
  hooks/          # React hooks (use-pdf-viewer, use-gesture-detector)
  utils/          # Pure utilities (nod-detector)
  types/          # Type definitions (index.ts)
tests/
  unit/           # Vitest unit tests
  setup.ts        # Test setup
docs/             # SPEC.md, DECISIONS.md
openspec/specs/   # Feature specifications
```

## Naming

- **Files:** kebab-case (`user-service.ts`)
- **Classes/Types:** PascalCase (`UserService`)
- **Functions/Vars:** camelCase (`getUserById`)
- **Constants:** SCREAMING_SNAKE (`MAX_RETRY_COUNT`)
- **Booleans:** is/has/should prefix

## Operating Model

- **OpenSpec** defines what to build (requirements, acceptance criteria, decisions)
- **Beads** tracks how work executes (queue, dependencies, progress)
- **Human checkpoint approvals** gate transitions between major phases

## Beads — MANDATORY (enforced by hooks)

**STOP. Do not write or edit code without an active beads issue.**

### Before ANY code change

1. Run `bd list` to see current issues
2. If no in-progress issue exists:
   - Pick one: `bd ready` (shows unblocked issues)
   - Or create one: `bd create "description" -p <priority> --json`
3. Mark it active: `bd update <id> --status in_progress`

### During work

- **Commit after every meaningful change** — don't batch all changes into one commit at the end
- Commit with issue ID: `git commit -m "type(scope): description (bd-xxx)"`
- Sync periodically: `bd sync`

### When done

1. Close the issue: `bd close <id> --reason "Completed" --json`
2. Sync: `bd sync`
3. Run tests before finishing

### Critical rules

- NEVER use `bd edit` (interactive — agents cannot use it)
- Use `bd update <id> --title/--description/--notes` instead
- Always use `--json` flag when creating/querying for structured output
- Run `bd sync` after making issue changes
- Include issue ID `(bd-xxx)` in commit messages

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Execution Loop (default)

1. Read active OpenSpec artifact (`openspec/changes/*` preferred, else `openspec/specs/*`)
2. Start/pick a bead and mark `in_progress`
3. Implement one thin vertical slice with outside-in tests
4. Run verification (`test`, `lint`, `typecheck` where available)
5. Checkpoint summary for human approval at phase boundary
6. Commit with `(bd-xxx)`, sync beads, continue or close

## Git

Commit format: `type(scope): description (bd-xxx)`
Branch naming: `feature/*`, `fix/*` from `main`

## Do Not Modify

- `package-lock.json` manually
- `.env` files
- `infrastructure/` without explicit request

## Always

- Follow outside-in test order: acceptance/E2E -> integration -> unit
- Run tests before marking work complete
- Update `docs/DECISIONS.md` for architectural changes
- Keep bead notes linked to spec paths (`Spec source: openspec/...`)
- Run `bd sync` before ending a session

## Context Files

- `docs/SPEC.md` - Project specification
- `docs/DECISIONS.md` - Architecture decisions
- `openspec/specs/` - Feature specifications
