# Repository Guidelines

## Project Structure & Module Organization
- `docs/` contains product documentation. Start with `docs/prd.md` (Capacity Planner — PRD v2.9) as the functional source of truth.
- `.nuxt/` holds Nuxt’s generated build artifacts and types; do not edit or commit changes here manually.
- Application source should follow Nuxt conventions when added: `app/`, `components/`, `pages/`, `composables/`, `stores/` (Pinia), `assets/`, `public/`.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — run the Nuxt dev server with HMR.
- `npm run build` — production build; outputs to `.output/` (and generates `.nuxt/`).
- `npm run preview` — preview the production build locally.
- `npm test` — run unit and component tests (Vitest).
Notes: Node 18+ recommended; use npm (this repo tracks `package-lock.json`).

## Coding Style & Naming Conventions
- Vue 3 Composition API with `<script setup>` and TypeScript.
- TailwindCSS for layout and styling; avoid custom CSS unless dynamic sizing.
- Components: PascalCase (`UserCard.vue`) with colocated tests `UserCard.spec.ts`.
- Composables: `composables/useX.ts`; Pinia stores: `stores/useXStore.ts` matching PRD types.
- Follow the data model in `docs/prd.md` (e.g., `Assignment`, `Person`, `Project`, `ViewState`).
- Run `npm run lint` if configured; ESLint + Prettier defaults.

## UI Guidelines — Slick & Condensed
- Use compact typography by default: base around `text-[13.5px]`; control labels `text-[11px]`–`text-xs`.
- Condensed paddings: buttons/inputs around `px-2 py-1`; group headers `px-3 py-2`.
- Sticky chrome:
  - App header is `sticky top-0` with subtle `backdrop-blur` and `border-slate-200/70`.
  - Left column (row labels/actions) in the timeline is `sticky left-0 z-10 bg-white`.
- Timeline layout constants:
  - Left column width: `240px`.
  - Row min height: `44px`; lane height: `30px`; assignment bar height: `28px`.
  - Day header chips are compact and use `text-[11px]`.
- Grid aesthetics are subtle: normal day lines `slate-100`, week lines `slate-200`; today marker uses `bg-amber-500/90`.
- Prefer Tailwind utilities and the helper classes in `assets/tailwind.css` (e.g., `.today-line`, `.grid-v`, `.bar-shadow`). Avoid ad‑hoc inline styles unless computed sizing/positioning.

## Testing Guidelines
- Framework: Vitest + Vue Test Utils; optional Playwright for e2e.
- Place unit tests under `tests/unit/` or `components/**/__tests__/`.
- Name tests `*.spec.ts`; cover core flows: creation by empty-zone click, modal creation, drag/resize with daily snap, allocation changes, and view switching.
- Aim for meaningful coverage on the Pinia store logic (`assignments`, `people`, `projects`, `view`).

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- PRs must include: clear description, link to issue/task, and UI screenshots/GIFs when changing timeline behavior.
- Keep PRs small and focused; include checklist for tests and docs updates when applicable.

## Architecture Notes
- Pinia store is the single source of truth; both views derive from `assignments[]` without duplication.
- Timeline uses per-row lane stacking for overlapping assignations; drag/resize snaps to 1 day.
- Sidebar contains row/subrow labels and actions; matrix shows assignments only. The sidebar column is sticky so labels remain visible while scrolling horizontally.
