# Capacity Coverage & Controls — Implementation Plan

Objectives
- Show total man-days on each assignment bar and per project/person row.
- Add Collapse All / Expand All controls under the People/Project view label.
- In group header rows (main rows), show per-day coverage with color-coded backgrounds: over-assigned (red, pastel), fully assigned (green, pastel), under-assigned (yellow, pastel), plus a small percentage label.

Scope Notes
- “Man-days” = businessDaysBetweenInclusive(start, end) × allocation.
- “Per project/person totals” are computed within the currently visible window to keep numbers relevant (days[] in the timeline), not global across all time.
- Color overlays and percentages are rendered in RowGroup’s header track (main row), not per subrow.

Data & Calculations
- Assignment man-days: md(a) = businessDaysBetweenInclusive(a.start, a.end) × a.allocation.
- Visible window clamp: only count days that intersect the current days[] window.
- Group totals:
  - People View → per project row under a person: optional; primary total shown on the person’s main row header.
  - Project View → per project’s main row header.
- Daily coverage map (for a group id):
  - For each day in days[]: sum allocations of assignments that include that day (consider business days only).
  - Coverage categories:
    - > 1.0 → over-assigned (red, 15% opacity)
    - == 1.0 → fully assigned (green, 15% opacity)
    - 0 < x < 1.0 → under-assigned (amber, 15% opacity)
    - 0 → no overlay.
  - Percentage label: round(sum × 100)%, shown compactly inside the cell (e.g., top-right, text-[10px]).

UI Changes
- AssignmentBar.vue
  - Add a small badge at right end with total man-days (e.g., “5d”, or “3.5d” when fractional). Tooltip: “Total man-days in this assignment”.
- RowGroup.vue (header track)
  - Compute visible-window group total MD and show a compact badge near the group label (right side header lane).
  - Render a per-day overlay grid (absolute children on the header track) using dayOffsets/pxPerDay for accurate placement; each cell gets background color by category and a small percentage label.
- Timeline.vue (top-left label area)
  - Under the People/Project label, add two buttons: “Collapse all”, “Expand all”. Minimal compact buttons (`px-2 py-1 text-[11px]`).
  - Provide via inject a reactive event or version token to trigger all RowGroup expanded state updates.

Architecture
- New composable: composables/useCapacity.ts
  - API: useCapacity(assignmentsRef, daysRef, group: { type: 'person'|'project', id: string })
    - returns: { daily: number[], totalMD: number, formattedDaily: string[] }
  - Visible-window clamping: intersect assignment ranges with days[] indices; treat only weekdays (days[] already weekdays).
- Minor utils: utils/alloc.ts
  - clampToWindow(startIso, endISO, days[]): returns [startIdx, endIdx] within window or null.
  - manDays(startIso, endISO, allocation): number (business days × allocation).
- Expand/Collapse all
  - Provide in app or Timeline: provide('rowGroupControls', { expandAllToken, collapseAllToken }).
  - RowGroup listens to tokens via watch() and sets local expanded = true/false.

Implementation Steps
1) Composables & utils
- Add utils/alloc.ts with manDays() and clampToWindow().
- Add composables/useCapacity.ts to compute daily coverage and totals per group.

2) AssignmentBar man-days badge
- Compute md = manDays(assignment.start, assignment.end, assignment.allocation).
- Render a compact badge (text-[11px]) at the right side of the bar, keep truncation of content.

3) Group totals & daily overlays in RowGroup header
- Inject assignmentsRef (already present) + useCapacity for { type, id }.
- Add a compact total badge in header right.
- Render overlay cells:
  - For i in days: calc left = dayOffsets[i], width = dayOffsets[i+1]-left (fallback pxPerDay), set bg by category.
  - Render a small percentage label; hide below a minimum cell width (e.g., < 44px) to avoid clutter.

4) Collapse/Expand all controls
- Timeline.vue: add two buttons near the People/Project label.
- Provide 'rowGroupControls' with two refs (expandAllToken, collapseAllToken) that tick (Date.now()) to trigger.
- RowGroup.vue: watch tokens; set expanded accordingly.

5) Tests
- utils/alloc.spec.ts: manDays (integer and fractional allocations), clampToWindow.
- useCapacity.spec.ts: compute daily[] and totalMD for sample assignments; thresholds for categories.
- RowGroup.spec.ts: token triggers expand/collapse; header overlays render correct number of cells.
- AssignmentBar.spec.ts: badge displays correct man-days.

6) Styling
- Tailwind classes: textures via bg-red-500/15, bg-green-500/15, bg-amber-400/15.
- Labels: text-[10px] text-slate-700 with subtle shadow for readability.

Acceptance Criteria
- Man-days badge visible on each AssignmentBar with correct value.
- Group header shows a total MD for the visible window and per-day overlays with correct coloring and percentage.
- Collapse/Expand all buttons toggle all RowGroup expanded states in the current view.
- No regressions: dragging/resizing, quick-create, scroll sync remain intact.

Out of Scope
- Persisting collapsed state across navigation.
- Summaries across hidden days beyond the visible window.

