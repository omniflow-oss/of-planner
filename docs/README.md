# Capacity Planner (PRD v2.9)

A lightweight, single‑page capacity planner to schedule people on projects day‑by‑day. Built with Nuxt 3, Vue 3, Pinia, TailwindCSS and TypeScript.

## Features
- Dual views: People View and Project View (same data model)
- Sticky left sidebar with row labels/actions; stays visible on horizontal scroll
- Sticky app header with compact controls and subtle blur
- Sticky timeline header with two rows (Month Year / D MMM) and synced grid overlay
- Infinite scroll feel: auto‑extend days when near edges
- Day grid with today marker; week boundaries slightly emphasized
- Create assignments by clicking empty timeline area (quick create popover)
- “Add …” row opens the full creation flow (fallback via prompt in this prototype)
- Drag bars to move; resize from left/right; snap to full days
- Allocation per day: 1, 0.75, 0.5, 0.25 with visible badge
- Overlaps allowed; vertical lane stacking per subrow
- Local data model in Pinia; simple demo data seeded
- Default zoom: 56 px/day; initial window: week‑2, week‑1, current, next 4 weeks

## Tech Stack
- Nuxt 3 (SPA), Vue 3 Composition API, TypeScript
- Pinia for state management
- TailwindCSS for styling (plus a few project utilities in `assets/tailwind.css`)
- Vitest + Vue Test Utils for tests

## Project Structure
- `app.vue` — app shell, sticky header
- `pages/index.vue` — root page, mounts the timeline
- `components/` — UI components
  - `Timeline.vue` — header row + scroll area with rows (syncs header/body scroll)
  - `timeline/TimelineHeader.vue` — two‑line header (Month Year / D MMM) + GridOverlay
  - `ViewSwitcher.vue` — mode, date and zoom controls
  - `internal/RowGroup.vue` — group header + subrows (left labels + right track)
  - `internal/RowTracks.vue` — track renderer (deprecated; archived/removed)
  - `internal/shared/AssignmentBar.vue` — draggable/resizable bar
  - `internal/shared/GridOverlay.vue` — vertical grid + today marker (shared with header)
  - `internal/LeftPaneCell.vue` — left pane cell for labels and “Add …” row
  - `shell/AppHeader.vue`, `shell/AppFooter.vue` — app chrome
- `stores/usePlannerStore.ts` — Pinia store (people, projects, assignments, view)
- `types/planner.ts` — domain types (Assignment, Person, Project, ViewState)
- `composables/useDate.ts` — ISO date helpers (add, clamp, iterate, business‑day spans)
- `composables/useTimeline.ts` — timeline derivations (days, columns, segments)
- `composables/useTimelineScroll.ts` — init window + infinite scroll
- `utils/lanes.ts` — lane stacking algorithm for overlapping bars
- `assets/tailwind.css` — Tailwind layers and small utility classes
- `docs/prd.md` — Product requirements (v2.9)
- `AGENTS.md` — Repo guidelines for contributors/agents

## UI Conventions (condensed look)
- Left column width: 240px; sticky on the left
- Row minimum height: 44px; lane height: 30px; bar height: 28px
- Compact typography (base ~13.5px; controls `text-xs`/`[11px]`)
- Subtle grid: day `slate-100`, week `slate-200`; today `amber-500/90`
- Default zoom: 56 px/day; header/body scroll kept in sync

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
- Change default zoom: `stores/usePlannerStore.ts` → `view.px_per_day`
- Tune initial window: `composables/useTimelineScroll.ts` (init to 7 weeks)
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

## Component & Composable Reference (short)
- `Timeline.vue` — Shell for header + scroll area; wires `useTimeline`, `useTimelineScroll` and syncs `scrollLeft`.
- `timeline/TimelineHeader.vue` — 2‑row header; accepts `scrollLeft` and uses shared `GridOverlay`.
- `internal/RowGroup.vue` — Group header + subrows; left pane via `LeftPaneCell`; right track with `GridOverlay` and bars.
- `internal/LeftPaneCell.vue` — Label cell and “Add …”; emits `click`.
- `internal/shared/GridOverlay.vue` — Day/week grid and today marker using offsets/pxPerDay.
- `internal/shared/AssignmentBar.vue` — Drag/resize interactions; reads `pxPerDay`.
- `useTimeline.ts` — Derives `days` (weekdays), columns, segments and `weekStarts`.
- `useTimelineScroll.ts` — Initial 7‑week window + infinite scroll near edges.
- `useDate.ts` — Date math helpers and weekday spans.

## License
Internal project; no license specified.
