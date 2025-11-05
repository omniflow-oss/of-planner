# Refactor Plan — Components & Composables Cleanup (v2)

Scope: remove duplication, dead code, and unclean code across components/composables with no behavior change, following PRD v2.9 and repo style.

## ✅ Recently Implemented: Drag-and-Drop Functionality

### Group-Level Drag & Drop
- **Timeline.vue**: Added VueDraggableNext wrappers for both person and project view RowGroups
- **RowGroup.vue**: Added group drag handle (`group-drag-handle` class) to header
- **Store Integration**: Added `peopleSortOrder` and `projectsSortOrder` arrays to Pinia store for persistence
- **Sort Handlers**: Implemented `onPersonSortEnd` and `onProjectSortEnd` to save new order to store
- **Reactive Ordering**: Sortable arrays respect stored order and handle new items automatically

### Subrow-Level Drag & Drop  
- **RowGroup.vue**: Enhanced existing VueDraggableNext for subrows with store persistence
- **Store Integration**: Added `subrowSortOrders: Record<string, string[]>` to store per-group subrow order
- **Smart Initialization**: Automatically initializes sort order for new groups
- **Constraint Enforcement**: Time-off rows (`.disable-drag`) always stay at top regardless of drag operations
- **Persistence Actions**: Added `updateSubrowSortOrder()` and `getSubrowSortOrder()` store methods

### Dependencies
- **vue-draggable-next**: Installed and integrated for all drag-and-drop functionality
- **TypeScript Support**: Updated `PlannerState` type to include new sort order properties

### Key Features
- ✅ **Persistent State**: Both group and subrow order maintained across page refreshes
- ✅ **Cross-View Independence**: Person and project views maintain separate sort orders  
- ✅ **Constraint-Based**: Time-off rows automatically stay pinned at top
- ✅ **Smart Handling**: New items automatically integrate with existing sort order
- ✅ **Data Integrity**: Sort changes tracked as data modifications in store

### Testing Drag & Drop Functionality
To verify the implementation works correctly:

1. **Group-Level Sorting**:
   - Switch to person view, drag group headers by the grip icon
   - Switch to project view, drag project group headers
   - Refresh page - order should be maintained
   - Switch between views - each maintains independent order

2. **Subrow-Level Sorting**:
   - Within any group, drag individual subrows by their grip handles  
   - Time-off rows should remain at top even when dragged
   - Add new assignments - they should appear in saved order
   - Refresh page - subrow order should be maintained per group

3. **Constraint Verification**:
   - Try dragging a time-off row below regular rows
   - System should automatically move it back to top
   - Regular rows can be reordered freely below time-off rows

## Current Known Issues

### Header Interaction Problems
- **RowGroup.vue**: Header timeline area has `disabled-rows` class with `pointer-events: none`
- **Impact**: Prevents creating timeoff events directly in header area
- **Solution**: Remove `disabled-rows` class and add proper mouse event handlers for header interactions
- **Priority**: High - affects core timeoff functionality

### Store TypeScript Errors
- **usePlannerStore.ts**: Multiple TypeScript compilation errors need fixing
- **Issues**: Undefined property access, type mismatches in assignment operations
- **Impact**: Development warnings, potential runtime issues
- **Priority**: Medium - doesn't block functionality but affects code quality

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

### ✅ Completed (Drag & Drop Implementation)
- **components/Timeline.vue**
  - ✅ Added VueDraggableNext wrappers for group-level sorting
  - ✅ Implemented sort persistence with store integration
  - ✅ Added reactive sorting arrays that respect stored order
  - 🔄 Still needs: unused imports/destructuring cleanup

- **components/internal/RowGroup.vue**  
  - ✅ Added group drag handle in header
  - ✅ Enhanced subrow drag-and-drop with store persistence
  - ✅ Implemented constraint enforcement for time-off rows
  - 🔄 Still needs: remove logs, unused today computations, fix header interaction issue

- **stores/usePlannerStore.ts**
  - ✅ Added sort order state properties (`peopleSortOrder`, `projectsSortOrder`, `subrowSortOrders`)
  - ✅ Implemented sort order management actions
  - ❌ Needs: TypeScript error fixes

- **types/planner.ts**
  - ✅ Updated `PlannerState` type with new sort order properties

### 🔄 In Progress / Pending
- **components/internal/RowGroup.vue**
  - ❌ Fix header interaction issue (remove `disabled-rows`, add mouse handlers)
  - 🔄 Remove logs and unused today computations
  - 🔄 Use utils/grid.ts for index/preview; compute header lane count explicitly

- **components/internal/shared/AssignmentBar.vue**
  - 🔄 Prune unused imports/state

- **composables/useTimelineScroll.ts**
  - 🔄 Remove unused vitest type; boolean typing

- **components/internal/RowTracks.vue, components/internal/RowSidebar.vue**
  - 🔄 Archive/delete and document deprecation

## Immediate Action Items (Priority Order)

### 🚨 Critical (Blocks User Functionality)
1. **Fix Header Interaction Issue** (RowGroup.vue)
   - Remove `disabled-rows` class from header timeline area
   - Add mouse event handlers for timeoff creation in header
   - Test timeoff event creation workflow

### ⚠️ High Priority (Code Quality)
2. **Fix TypeScript Errors** (usePlannerStore.ts)
   - Add null checks for undefined property access
   - Fix type mismatches in assignment operations
   - Ensure strict type compliance

3. **Grid Utils Extraction** (utils/grid.ts)
   - Extract shared grid math from RowGroup and AssignmentBar
   - Implement `indexFromX()` and `businessSegment()` utilities
   - Update components to use centralized grid helpers

### 📋 Medium Priority (Cleanup)
4. **Remove Debug Code** (Multiple files)
   - Remove console.log statements from RowGroup drag operations
   - Clean up unused imports in Timeline.vue
   - Remove unused today computations in RowGroup.vue

5. **Archive Dead Components**
   - Move RowTracks.vue and RowSidebar.vue to _archive/
   - Document deprecation and replacement components

## Acceptance Criteria
- ✅ Drag-and-drop functionality works for both groups and subrows with persistence
- ✅ Time-off events can be created in header area without `disabled-rows` blocking
- ✅ No TypeScript compilation errors
- ✅ No visual regression (header/body alignment, grids, today marker)
- ✅ Drag/resize unchanged; quick‑create popover still emits same payloads
- ✅ No unused imports/logs; dead files archived/removed

## PR/Commit Guidance
- Conventional commits per repo (refactor:, chore:, test:, docs:).
- Separate PRs by phase if preferred; include before/after GIFs only if visual changes occur (not expected in P1–P3).

