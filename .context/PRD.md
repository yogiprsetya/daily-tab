# PRD: Minimalist New Tab Enhancer (Chrome Extension)

Goal

- Deliver a clean, single-page New Tab that boosts focus with fast shortcuts, lightweight todos, and notes.
- Zero branding; minimalist UI; efficient keyboard flows.
- Local-first using IndexedDB; no network.

Scope

- Override Chrome New Tab.
- Single page; no router; no sidebar.
- Settings live in the header.
- Dark/Light mode; three core widgets: Shortcut, Todo list, Notes.
- Local export/import.

Non-Goals

- Collaboration, multi-user, cloud sync.
- Calendars, reminders, time tracking.
- Widgets like weather, stocks, RSS.
- Branding, logos, marketing UI.

Personas

- Builder: developer/product person who wants speed and minimalism.
- Focused Writer: quick notes and simple tasks.
- Power Clicker: frequent sites with muscle memory and keys.

User Stories

- Toggle theme instantly and persist choice.
- Open shortcuts directly or via overlay open-in-new-tab.
- Add/edit/reorder shortcuts fast.
- Manage a simple todo list on the right.
- Jot minimal notes bottom-left without leaving the page.
- Export/import my data locally.

Layout Map

- Top-left: Shortcut widget
- Right: Todo list widget
- Bottom-left: Notes widget
- Header: settings only (theme, density, export/import, reset)

Detailed layout is documented in `Layout.md`.

Widgets

## Shortcut widget (top-left)

- Display: user-defined list with favicon/title; tags supported (MVP), reorderable.
- Open behavior: click opens in current tab; overlay or modifier opens in new tab.
- Overlay quick-open: searchable list (Ctrl+K / O), keyboard nav; Enter opens in new tab.
- CRUD: add/edit/delete; drag or arrow reorder; optional pin.
- Keyboard: S add; J/K or arrows navigate; Enter activate; Esc dismiss overlay.
- Tagging: add/remove tags; filter by tag; overlay search matches titles and tags.

Todo list widget (right)

- Items: title, status (todo/done), order; inline add/edit; delete.
- Filters: All / Active / Done (chips in header).
- Optional “Today” flag for quick focus (no dates).
- Keyboard: A add; Space toggle done; J/K navigate; D delete focused.

Notes widget (bottom-left)

- Multiple notes (MVP) with plain text.
- List of notes with quick add; select to edit; reorder.
- Auto-save with debounce; minimal timestamp.
- Expand/collapse per note; optional monospace toggle.
- Keyboard: N focus; Ctrl+Enter toggle collapse; Esc blur. (Post-MVP)

Theme & Accessibility (global)

- Dark/Light toggle in header; persists to IndexedDB.
- Auto-detect system theme on first run; user override stored.
- WCAG AA contrast; visible focus rings; ARIA roles; respects prefers-reduced-motion.

Data & Storage (localStorage → IndexedDB in v1.x)

- Current (v0.1): localStorage with JSON serialization.
  - Keys: `dt_settings`, `dt_shortcuts`, `dt_navbar_links`, `dt_todos`, `dt_notes`, `dt_layout`.
  - Planned migration to IndexedDB with versioned schema.
- DB name (future): daily-tab; versioned schema with migrations.
- Object stores (future):
  - settings: { id: "global", theme: "dark|light|system", density: "compact|comfortable" (default: compact tuned for comfort), createdAt, updatedAt }
  - shortcuts: { id (uuid), title, url, tags?: string[], pinned?, order, createdAt, updatedAt }
  - todos: { id (uuid), title, status: "todo|done", today?: boolean, order, createdAt, updatedAt }
  - notes: { id (uuid), title?: string, content: string, order: number, createdAt, updatedAt }
  - navbar_links: { id (uuid), title, url, createdAt, updatedAt } [max 5 items]
- Indexes (future):
  - shortcuts: by order, pinned, tags (multiEntry)
  - todos: by status, order, today
  - notes: by order
  - navbar_links: by createdAt
- Export/Import: single JSON file containing all stores; includes schema version.
- Safeguards: basic size checks for large notes; backup before migration.

Technical Approach

Chrome Extension

- Manifest V3.
- chrome_url_overrides.newtab → index.html.
- No special permissions for IndexedDB; favicon via site or fallback letter tile.
- CSP-safe assets; no remote scripts.

Frontend

- Single-page React (Vite). No router.
- State persisted via localStorage (IndexedDB planned for v1.x).
- Theme via CSS variables; prefers-color-scheme detection.
- **State Management**: Custom React hooks in `/src/state/`:
  - `useSettings()` — theme, density, persist to localStorage.
  - `useNavbarLinks()` — navbar link CRUD, 5-link max, persist to localStorage.
  - Similar hooks for todos, notes, and shortcuts planned.
- **Components**:
  - Header/Navbar with navbar link display and dialog trigger.
  - ShortcutsDialog (decoupled) — add/manage navbar links.
  - Shortcut, Todo, Notes widgets in main layout.
  - Modular UI primitives from shadcn/ui.
- Drag-and-drop via native HTML5 or lightweight lib.
- Performance: debounced writes; batched updates; lazy render where sensible.

Privacy & Security

- Local-only data; zero network calls.
- No telemetry; no tracking.
- Clear reset and export/import flows.

Performance Targets

- New Tab paint < 120ms on mid-range hardware.
- First Interactive < 200ms.
- IndexedDB operations debounced and ~10ms typical.

Success Metrics (local, optional)

- Shortcut activation rate.
- Todo completion rate.
- Notes usage frequency.

Risks & Mitigations

- Favicon fetching variability → fallback letter tile.
- IndexedDB migration issues → versioning and backup on migrate.
- Over-clutter → minimalist defaults; limit visible items; collapsible widgets.

Release Plan

- v0.1: Theme, basic layout, IndexedDB scaffold.
- v0.2: Shortcut widget CRUD, tags support, direct/open-in-new-tab, overlay quick-open.
- v0.3: Todo widget CRUD and filters.
- v0.4: Notes widget (multiple notes) with autosave.
- v1.0: Export/Import, a11y polish, performance pass; optional keyboard shortcuts behind a setting.

Acceptance Criteria

- Theme persists and toggles instantly.
- Shortcut widget: direct open + overlay open-in-new-tab; CRUD + reorder persist; tags supported.
- Todo list widget: add/edit/delete; toggle done; filters persist.
- Notes widget: multiple notes CRUD; reorder; autosave; persist and restore on reload.
- Export produces valid JSON; Import restores full state.
- Single page (no router); no sidebar; header-only settings; no logo/brand text.
- All features operate fully offline.

Constraints

- Single page only; no router.
- No sidebar; optimize header for settings.
- Keep minimalist.
- No logo, text brand, etc.

Keyboard Quick Reference (post-MVP)

- MVP: Keyboard shortcuts disabled to avoid Chrome conflicts (enable later via setting).
- T: theme toggle
- Ctrl+K / O: open Shortcut overlay
- S: add shortcut
- N: focus notes
- A: add todo
- J/K or arrows: navigate lists
- Space: toggle todo
- Enter: activate; Esc: close overlays/blur

Product Decisions

- Shortcuts support tags in MVP (yes).
- Notes: multiple notes in MVP.
- Keyboard shortcuts: do not use in MVP; add post-MVP behind a setting.
- Default density: compact, tuned for comfort.
