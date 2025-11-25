Perfect 👌 Here's the **complete PRD v2.9** — consolidated and ready for development — including **all previous features** (dual view, daily snap, allocations, overlaps) **and the new feature for adding by clicking on empty zones with day count selection**.
It is structured to be directly usable in a **Nuxt + Nuxt UI + Pinia** implementation.

---

# Capacity Planner — PRD v2.9

*(People View / Project View, fractional allocation, daily snap, overlaps, click creation)*

---

## 1. 🎯 Objective

Create a **visual planner** to organize **assignments between people and projects**, day by day.
The system must allow:

* Visualizing availability and allocations (full or partial),
* Creating assignments directly from the timeline (click or button),
* Moving/resizing bars by **complete day steps**,
* Displaying both perspectives: **People View** and **Project View**.

---

## 2. 🧭 Visualization Modes

| View             | Main Row         | Sub-rows            | Special Row              |
| ---------------- | ---------------- | ------------------- | ------------------------ |
| **People View**  | Person           | Assigned projects   | ➕ "Add project"          |
| **Project View** | Project          | Assigned people     | ➕ "Add person"           |

* Clicking the **People** ↔ **Projects** tab changes the hierarchy while keeping **zoom, Today, scroll**.
* Both views use the **same store** (`assignments[]`): no duplication.

---

## 3. ⚙️ Data Model

```ts
export type Allocation = 1 | 0.75 | 0.5 | 0.25;

export type Person = { id: string; name: string; avatar?: string | null };
export type Project = { id: string; name: string; color?: string | null; emoji?: string | null };

export type Assignment = {
  id: string;
  person_id: string;
  project_id: string;
  start: string; // ISO UTC 00:00
  end: string;   // ISO UTC 00:00, inclusive
  allocation: Allocation; // per day
  subtitle?: string | null;
};

export type ViewMode = 'person' | 'project';

export type ViewState = {
  mode: ViewMode;
  start: string;
  days: number;
  px_per_day: number; // 24–64
  selected_id: string | null;
};

export type PlannerState = {
  people: Person[];
  projects: Project[];
  assignments: Assignment[];
  view: ViewState;
  meta: { version: '2.9.0' };
};
```

---

## 4. ✏️ Creating an Assignment

### 4.1 From the "➕ Add …" row

* Click on the **last sub-row**:

  * **People View** → "➕ Add project"
  * **Project View** → "➕ Add person"
* Opens a **complete modal**:

  ```
  [Select existing project/person] or [Create new]
  [Start date]  [End date]
  [Allocation ▼ 1 | 0.75 | 0.5 | 0.25]
  [Optional subtitle]
  [Validate]
  ```

### 4.2 Click on **empty zone** of the timeline

* **Detects clicked day** (snap to day):

  ```ts
  dayIndex = Math.round((x - trackLeft) / px_per_day);
  start = addDays(view.start, dayIndex);
  ```
* **Quick-Create Popover**:

  * `Duration (days)` → numeric field (min 1, default 5)
  * `Allocation` → radio (1 / 0.75 / 0.5 / 0.25)
  * If outside sub-row → request **complementary entity**:

    * People View → select or create project
    * Project View → select or create person
  * Buttons: **Create**, **Cancel**

**Automatic calculation:**

```ts
end = addDays(start, duration_days - 1);
createAssignment({ person_id, project_id, start, end, allocation });
```

### 4.3 Validation

* Valid dates, `end ≥ start`
* Known or created entities
* Duration ≥ 1
* Allocation ∈ {1, 0.75, 0.5, 0.25}

---

## 5. 🎛️ Bar Interactions

### Movement

* **Granularity**: 1 day → horizontal snap to nearest day.
* **Duration** and **allocation** unchanged.

### Resizing

* **Granularity**: 1 day.
* **Clamp**: `start ≤ end`.

### Allocation

* Context menu or dialog:

  ```
  Change allocation:
  • 1 full day
  • 0.75 d
  • 0.5 d
  • 0.25 d
  ```
* Immediate update + autosave.

### Overlap

* **Allowed** (multiple bars can overlap on the same day / sub-row).
* Visual management through **vertical stacking** ("lanes").
* Future option: alert if allocation sum > 1.

---

## 6. 🧩 Visual rendering (timeline)

| Element                     | Details                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| **Timeline header**         | Two lines: `Month Year` (top), `D MMM` (bottom). Sticky and synchronized with scroll. |
| **Day grid**                | Column = 1 day; subtle lines `slate-100`, week `slate-200`.                     |
| **Today marker**            | Accented vertical line `amber-500/90`.                                          |
| **Bars (Assignments)**     | Color = project; name + allocation badge; height 28px; rounded corners.         |
| **Subrows**                 | Framed, light background, minimum height 44px; lane stacking 30px.              |
| **Last sub-row**            | "➕ Add …" visible, light gray background, ➕ icon on left.                       |
| **Quick creation popover**  | Arrow anchored to cell, compact form, focus on duration.                        |
| **Stacking**                | Overlapped lanes with slight vertical offset.                                   |
| **Left sticky column**      | Label/action column (280px) is `sticky left-0` during scroll.                   |
| **Sticky header**           | App header bar `sticky top-0` with subtle blur.                                 |

Condensed design (slick & pro)
- Compact typography by default: base ~13.5px; UI elements in `text-xs`/`[11px]`.
- Compact controls: `px-2 py-1` for inputs/buttons; reduced day chips.
- Default zoom: `56 px/day`.
- Light shadows on bars (`.bar-shadow`) and important containers.

---

## 7. 🧠 Global UX

### Global behavior

| Action                | Effect                        |
| --------------------- | ----------------------------- |
| Empty click in subrow | Quick creation popover        |
| Click on "Add …"      | Complete modal                |
| Move / Resize         | Snap to day                   |
| Click on bar          | Opens edit modal              |
| Double-click          | Quick edit mode               |
| Keyboard arrows       | Move one day                  |
| Shift + arrows        | Move 5 days                   |
| Delete                | Delete                        |
| Tab People / Projects | Change view, keep zoom/scroll |
| Default opening       | Show week-2, week-1, current week, next 4 weeks |

---

### Search

- **Location**: Global search input is located in the top app header and filters both People and Project views.
- **Behavior**: Loading a new dataset, resetting changes, or clearing all data will clear the search input to prevent stale filters from hiding newly-loaded content.

## 8. 🔒 Business Rules

| Rule                                          | Detail |
| --------------------------------------------- | ------ |
| One person ↔ multiple projects (OK)           |        |
| One project ↔ multiple people (OK)            |        |
| Overlaps OK, stacked in lanes                 |        |
| Fractional allocation (1, 0.75, 0.5, 0.25)   |        |
| Snap = 1 day                                  |        |
| Minimum duration = 1 day                      |        |
| Data persisted in localStorage                |        |
| Complete JSON import/export (with allocation) |        |

---

## 9. 💾 Persistence

* Autosave (`localStorage["planner_state_v2_9"]`, throttle 300 ms)
* JSON import/export via header buttons
* Zod schema validation and automatic migration (adding `allocation` and `duration`)

---

## 10. 📊 Insights Drawer

* **People** view: total assigned days, average allocation, number of active projects.
* **Projects** view: total active days, average allocation, number of active people.
* CSV export.
* Real-time calculation on visible viewport.

---

## 11. ⚙️ Performance & Architecture

### Stack

* **Nuxt 3 SPA**
* **Nuxt UI** (popover, dialog, tabs, inputs)
* **Pinia** (main store)
* **dayjs** (dates)
* **@vueuse/core** (autosave, event listeners)
* **zod** (validation)

### Structure

```
/types/domain.ts
/stores/planner.ts
/composables/
  useLanes.ts
  useDate.ts
  useCreatePopover.ts
/components/
  PlannerHeader.vue
  SidebarPeople.vue
  SidebarProjects.vue
  TimelineGrid.vue
  PersonRow.vue
  ProjectRow.vue
  AssignmentBar.vue
  CreatePopover.vue
  CreateModal.vue
  EditDialog.vue
  InsightsDrawer.vue
/pages/planner.vue
```

### Performance

* Row virtualization (vueuse/useVirtualList)
* Transform-synchronized scroll (GPU)
* contain: layout paint
* rAF for movements

---

## 12. ✅ Acceptance Criteria

| # | Criteria                                                                      |
| - | ----------------------------------------------------------------------------- |
| 1 | Empty zone click → quick creation popover (clicked day, duration input).      |
| 2 | "Add …" click → complete modal.                                               |
| 3 | Move / resize by 1-day steps.                                                 |
| 4 | Fractional allocation 1/0.75/0.5/0.25.                                       |
| 5 | Overlaps allowed.                                                             |
| 6 | People / Projects toggle keeps context.                                       |
| 7 | Export / Import preserves everything.                                         |
| 8 | No console errors.                                                            |
| 9 | Left sticky column visible during horizontal scroll.                          |
| 10 | Sticky headers (app + timeline) synchronized with horizontal scroll.          |
| 11 | Condensed style applied (column width 280px, bars 28px, lanes 30px, zoom 56 px/day). |
| 12 | On load: week-2 → current week → next 4 weeks visible.                       |

---

## 13. 🔬 Test Scenarios

| Test                     | Action                                       | Expected Result         |
| ------------------------ | -------------------------------------------- | ----------------------- |
| Quick creation           | Click day N (People View, Project B), duration=4 | Bar [N..N+3], alloc 1   |
| Out-of-subrow creation   | Main row click → choose project, duration=2  | Assignment created      |
| Fractional               | Allocation=0.5                               | "½" badge visible       |
| Movement                 | Drag bar → +2 days                           | Start +2, End +2        |
| Resize                   | Stretch right → +1 day                       | End +1                  |
| Overlap                  | Two bars same day                            | Stacked vertically      |
| Switch view              | Project View shows same result               |                         |
| Export/Import            | Identical data reloaded                      |                         |
| Performance              | 50 people × 365 days fluid                  |                         |

---

## 14. 📍 Roadmap

| Version | Feature                 | Description                            |
| ------- | ----------------------- | -------------------------------------- |
| 3.0     | Multi-select            | Move multiple bars                     |
| 3.1     | Undo/Redo               | Local history                          |
| 3.2     | Visual overloads        | Warning color if > 1 d total          |
| 3.3     | Business calendar       | Non-assignable weekends                |
| 3.4     | Proportional height     | Visually represents allocation         |
| 3.5     | Dependent links         | Visual links between related bars      |