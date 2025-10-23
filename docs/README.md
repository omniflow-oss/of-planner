# Capacity Planner (PRD v2.9)

A lightweight, single‑page capacity planner to schedule people on projects day‑by‑day. Built with Nuxt 3, Vue 3, Pinia, TailwindCSS and TypeScript.

## Features
- Dual views: People View and Project View (same data model)
- Sticky left sidebar with row labels/actions; stays visible on horizontal scroll
- Sticky app header with compact controls and subtle blur
- Infinite scroll feel: auto‑extend days when near edges
- Day grid with today marker; week boundaries slightly emphasized
- Create assignments by clicking empty timeline area (quick create popover)
- “Add …” row opens the full creation flow (fallback via prompt in this prototype)
- Drag bars to move; resize from left/right; snap to full days
- Allocation per day: 1, 0.75, 0.5, 0.25 with visible badge
- Overlaps allowed; vertical lane stacking per subrow
- Local data model in Pinia; simple demo data seeded

## Tech Stack
- Nuxt 3 (SPA), Vue 3 Composition API, TypeScript
- Pinia for state management
- TailwindCSS for styling (plus a few project utilities in `assets/tailwind.css`)
- Vitest + Vue Test Utils for tests

## Project Structure
- `app.vue` — app shell, sticky header
- `pages/index.vue` — root page, mounts the timeline
- `components/` — UI components
  - `Timeline.vue` — header row + scroll area with rows
  - `ViewSwitcher.vue` — mode, date and zoom controls
  - `internal/RowGroup.vue` — group header + subrows (left labels + right track)
  - `internal/RowTracks.vue` — track renderer (alternate minimal variant)
  - `internal/shared/AssignmentBar.vue` — draggable/resizable bar
- `stores/usePlannerStore.ts` — Pinia store (people, projects, assignments, view)
- `types/planner.ts` — domain types (Assignment, Person, Project, ViewState)
- `composables/useDate.ts` — ISO date helpers (add, clamp, iterate)
- `utils/lanes.ts` — lane stacking algorithm for overlapping bars
- `assets/tailwind.css` — Tailwind layers and small utility classes
- `docs/prd.md` — Product requirements (v2.9)
- `AGENTS.md` — Repo guidelines for contributors/agents

## UI Conventions (condensed look)
- Left column width: 240px; sticky on the left
- Row minimum height: 44px; lane height: 30px; bar height: 28px
- Compact typography (base ~13.5px; controls `text-xs`/`[11px]`)
- Subtle grid: day `slate-100`, week `slate-200`; today `amber-500/90`

## Getting Started (Development)
- Prereqs: Node 18+, npm 10+
- Install: `npm install`
- Run dev: `npm run dev`
- Build: `npm run build`
- Preview prod build: `npm run preview`
- Run tests: `npm test`
- Lint: `npm run lint`

Nuxt dev server runs with HMR; open the printed localhost URL.

## Common Dev Tasks
- Change zoom (px/day): use the +/– control in the header or update in store via `store.setPxPerDay()`.
- Adjust timeline sizing constants: see `AGENTS.md` and components using 240px/44px/30px/28px.
- Add initial data: edit `stores/usePlannerStore.ts` arrays for `people`, `projects`, `assignments`.
- Modify lane stacking: see `utils/lanes.ts` (returns `items[]` with `_lane` plus `laneCount`).
- Update quick create defaults: handled in `components/Timeline.vue` and `internal/RowGroup.vue` (`onAddFromSidebar`, empty click popover).
- Styling: prefer Tailwind utility classes; shared utilities are in `assets/tailwind.css` (`.today-line`, `.grid-v`, `.bar-shadow`).

## Data Model (essentials)
- `Assignment { id, person_id, project_id, start, end, allocation, subtitle? }`
- `ViewState { mode, start, days, px_per_day, selected_id }`
- Dates are ISO (UTC 00:00), inclusive range; daily snap for interactions.

## Persistence
This prototype keeps state in memory (Pinia). Add your own persistence later (API/localStorage). The PRD references localStorage for a full app; feel free to wire it in.

## Tests
- Run all tests: `npm test`
- Vitest config: `vitest.config.ts`

## Documentation
- Product requirements: `docs/prd.md`
- Contributor/agent guidelines: `AGENTS.md`

## License
Internal project; no license specified.

