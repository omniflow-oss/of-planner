# Refactor Plan — Components & Composables Cleanup (v2)

Scope: remove duplication, dead code, and unclean code across components/composables with no behavior change, following PRD v2.9 and repo style.

## Inventory of Issues

- Unused/legacy components
  - components/internal/RowTracks.vue — legacy alternate track; not imported anywhere (only docs mention). Duplicates grid and quick‑create now handled by RowGroup + Timeline.
  - components/internal/RowSidebar.vue — never imported; replaced by LeftPaneCell + RowGroup.

- Duplicated logic
  - Grid math duplicated between RowGroup (preview) and AssignmentBar (bar position/width). Centralize X→day index and business‑day segment sizing in a tiny util.
  - Weekend checks scattered (useTimeline.ts, RowGroup.vue); standardize on useDate.ts helpers.

- Dead code / unused imports & vars
  - composables/useTimelineScroll.ts — unused import: vitest reporter type; Boolean vs boolean typing.
  - components/Timeline.vue — unused imports: addDaysISO, calendarSpanForWeekdays; unused destructured values: isWeekend, yearSegments, yearColumns; unused ref: gridEl.
  - components/internal/RowGroup.vue — unused todayISO/todayIndex; headerAssignments computed not rendered (only laneCount side effect).
  - components/internal/shared/AssignmentBar.vue — unused imports: daysBetweenInclusive, parseISO, toISO; unused touch handlers state.

- Unclean code
  - Console logs in RowGroup drag/create flow.
  - Minor inline CSS where dynamic sizing is fine; otherwise continue preferring Tailwind.
  - Prompt/confirm/alert UX in Timeline is acceptable for prototype; plan to swap for a small modal later.

## Plan (Phased)

Phase 1 — Low risk hygiene (keep behavior)
- Remove unused imports/vars and debug logs:
  - useTimelineScroll.ts: drop vitest type; use boolean.
  - Timeline.vue: prune unused imports/destructuring; drop gridEl.
  - RowGroup.vue: remove console.log; remove todayISO/todayIndex; compute headerLaneCount without creating headerAssignments list just for side effects.
  - AssignmentBar.vue: remove unused imports and touch placeholders.

Phase 2 — Prune dead code
- Move unused alternates to components/_archive/ or delete (documented as deprecated):
  - internal/RowTracks.vue
  - internal/RowSidebar.vue

Phase 3 — Extract small shared helpers
- Add utils/grid.ts:
  - indexFromX(x: number, offsets: number[] | null, pxPerDay: number, daysLength: number): number
  - businessSegment(startISO: string, startDayISO: string, endDayISO: string, pxPerDay: number): { left: number; width: number }
- Update RowGroup.vue to use grid helpers for preview and empty‑click mapping; ensure weekend logic uses useDate.ts.

Phase 4 — UX (optional, still non‑breaking)
- Replace prompt/confirm/alert in Timeline.vue with lightweight modal component to match PRD’s full creation flow; keep quick‑create popover intact.

Phase 5 — Tests + lint
- Add Vitest coverage:
  - utils/grid.spec.ts — X→day index and business segment math.
  - RowGroup.spec.ts — drag‑to‑create emits with correct start/duration; preview sizing math.
  - useTimelineScroll.spec.ts — init 7‑week window; prepend/append weekday extensions.
- Run `npm run lint`; keep types strict.

## File Checklist

- components/Timeline.vue
  - Remove unused imports/destructuring; keep create/edit popover behavior.

- components/internal/RowGroup.vue
  - Remove logs and unused today computations.
  - Use utils/grid.ts for index/preview; compute header lane count explicitly.

- components/internal/shared/AssignmentBar.vue
  - Prune unused imports/state.

- composables/useTimelineScroll.ts
  - Remove unused vitest type; boolean typing.

- components/internal/RowTracks.vue, components/internal/RowSidebar.vue
  - Archive/delete and document deprecation.

## Acceptance
- No visual regression (header/body alignment, grids, today marker).
- Drag/resize unchanged; quick‑create popover still emits same payloads.
- No unused imports/logs; dead files archived/removed.

## PR/Commit Guidance
- Conventional commits per repo (refactor:, chore:, test:, docs:).
- Separate PRs by phase if preferred; include before/after GIFs only if visual changes occur (not expected in P1–P3).

