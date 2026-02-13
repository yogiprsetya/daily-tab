# Layout Plan for Minimalist New Tab Enhancer

Desktop layout
- Header (top): compact row
  - Left: settings icon group (theme, density, export/import, reset)
  - Right: theme toggle
- Content grid (below header):
  - Columns: left 2fr, right 1fr; gap 16px (12px in compact density)
  - Left column split into two rows:
    - Row 1 (≈60% viewport height): Shortcut widget
      - Grid of tiles (auto-fit 3–5 columns responsive)
      - Full-tile click opens in current tab (one click)
      - Corner overlay button opens in new tab
      - Minimal per-tile menu (⋮) for edit/delete
    - Row 2 (remaining height): Notes widget
      - List of notes on the left; editor panel to the right (or single-area editor if space is tight)
      - Inline add; reorder drag handle; collapsible note editor
  - Right column (full-height): Todo list widget
    - Header chips: All / Active / Done
    - Inline add at top; list scrolls independently
    - Item row: checkbox, title (inline edit), delete, drag handle

Mobile layout (vertical stack)
- Order: Shortcuts → Todos → Notes
- Each widget is a card with compact header actions (add, filter, collapse)
- Shortcuts: 2-column tiles; overlay “new tab” button remains visible
- Todos: single column list; inline add at top
- Notes: list first, tap to open editor below

Sizing and spacing
- Header height: 48px
- Grid gap: 16px (12px in compact density)
- Widget padding: 12–16px
- Tile size: 64–88px square, auto-fit via CSS grid
- Independent vertical scrolling per widget; no horizontal overflow

Interactions (MVP, no keyboard)
- Shortcuts: one-click open; corner overlay opens new tab; quick edit via ⋮
- Todos: click checkbox toggles; title inline edit; drag reorder; chips filter
- Notes: tap to select; editor autosaves; drag reorder; per-note collapse

Accessibility
- Visible focus rings on all interactive elements
- ARIA roles: list, listitem, button; dialogs for overlays
- High-contrast themes; respects prefers-reduced-motion

Implementation hint (CSS Grid)
- Desktop: grid-template-columns: 2fr 1fr; left column uses two rows for shortcuts/notes
- Mobile: single column; widgets stacked in order