# Dictionary — Vocabulary Flashcard App

A vanilla JS/HTML/CSS flashcard app for building vocabulary. No build step — open `index.html` directly in a browser, or run `python3 -m http.server` and visit `localhost:8000`.

## Project structure

```
index.html        # All markup — header, tabs, toolbar, card list, study view, modals, dev tools panel
css/styles.css    # Card flip animation, modal open/close animation, CSS custom properties
js/storage.js     # DATA LAYER — only file that touches localStorage
js/devtools.js    # Dev/testing helpers (seed data, clear, log)
js/app.js         # UI logic — reads/writes via storage.js only
```

## Rules for this project

- **Vanilla JS, HTML, CSS only.** No frameworks, no npm, no build step.
- **Tailwind via Play CDN** — configured in a `<script>` tag in `index.html` with `darkMode: 'class'`. Supports JIT arbitrary values like `grid-cols-[1fr_auto]`.
- **All localStorage access goes through `storage.js`.** Never read/write `localStorage` directly from `app.js` or `devtools.js`.
- **No inline styles** — use Tailwind utility classes or `styles.css`. Exception: `grid-template-columns: 1fr auto` on card headers (no Tailwind shorthand).
- **Comments only where the WHY is non-obvious.**

## Data shape

```js
{
  id: string,           // crypto.randomUUID()
  word: string,
  partOfSpeech: string, // one of the preset dropdown values
  definition: string,
  status: "new" | "semi" | "known",  // traffic-light review status (default: "new")
  createdAt: number     // Date.now()
}
```

Stored as JSON array in localStorage under key `"flashcards"`. Old cards with `known: boolean` are auto-migrated in `loadAll()`.

## storage.js — public API

| Function | Description |
|---|---|
| `getCards()` | All cards |
| `getCard(id)` | Single card or null |
| `findDuplicate(word, pos)` | Match on word + POS (case-insensitive) — powers duplicate warning |
| `addCard({word, partOfSpeech, definition})` | Creates card with status: "new" |
| `updateCard(id, changes)` | Merges changes |
| `deleteCard(id)` | Removes by id |
| `setStatus(id, status)` | Sets "new" / "semi" / "known" |
| `clearAll()` | Wipes all cards |

## Key UI decisions & patterns

### Tabs
Two tabs: **Learn** (card list view) and **Review** (study/flip mode).

### Card layout (app.js — `createCardEl`)
Each card uses a **two-column CSS grid** (`grid-template-columns: 1fr auto`) for the header row so word/POS and traffic lights/edit icons share the same row heights — guaranteeing exact vertical alignment:
- Row 1: word (left) | traffic-light status dots (right)
- Row 2: part of speech italic (left) | edit + delete icon buttons (right)
- Row 3: definition spans full width (line-clamped to 2 lines via `.definition-clamp`)

Clicking the card body (anywhere except the action buttons) opens the **view modal**.

### Traffic light status dots
Three small rounded-square buttons (`w-3 h-3 rounded`) per card:
- **Active**: solid fill (`bg-red-400` / `bg-yellow-400` / `bg-green-400`)
- **Inactive**: outline only (`border border-red-400` etc.) — same color as fill for consistency
- Clicking sets status via `storage.setStatus()` and re-renders

In study mode the dots are larger (`w-5 h-5`) inside `w-12 h-12` square buttons so the tap target is the full square, not just the dot.

### Icons (app.js — ICON_EDIT, ICON_DELETE, ICON_MOON, ICON_SUN)
Inline SVG constants at the top of app.js. Feather-style line icons, 13–15px. Theme toggle uses `innerHTML` (not `textContent`) to set SVG icons. Edit/delete buttons are near-invisible (`text-gray-300 dark:text-gray-600`) until hovered.

### Modal system (styles.css + app.js)
Two modals share the same CSS pattern — `.modal-overlay` + `.modal-dialog`. The overlay starts at `opacity: 0; pointer-events: none` so it's in the DOM but unreachable; adding `.open` fades in the backdrop and slides the dialog into place. `display: none` is avoided so CSS transitions can run.

| Modal | ID | Purpose |
|---|---|---|
| Add / Edit | `#card-modal` | Replaces the old inline collapsible form |
| View card | `#view-modal` | Shows a card full-size; supports ←→ arrow key navigation |

Both modals close on backdrop click or **Escape**. Escape priority order: inline-delete → add/edit → view.

### Inline delete confirmation
There is no separate confirm modal. Instead, clicking delete replaces the card's content in place with a minimal "Delete `<word>`? / Cancel / Delete" UI, keeping the user's mouse right where it already is.

- **Card list**: `showInlineDeleteConfirm(id)` saves the card element's `innerHTML`, replaces it with the confirmation, and restores on Cancel. Only one card can be in confirm state at a time — triggering a second cancel cancels the first automatically. Escape also cancels.
- **View modal**: `showViewModalDeleteConfirm()` does the same thing to the `.modal-dialog` innerHTML. The modal stays open. `closeViewModal()` always restores the dialog's original HTML before closing so the static elements (`#view-word` etc.) are available for the next `openViewModal()` call.
- Both use event delegation so replacing innerHTML doesn't break any listeners.

### Toolbar (Learn tab)
Four controls in a row: search input, status filter pill, part-of-speech filter, sort/group dropdown.

- Search placeholder shows live count: `Search N words…`
- **Status filter pill** (`#filter-status-new/semi/known`): three `w-3 h-3` dot toggle buttons inside a bordered container. Multi-select — any combination of statuses can be active simultaneously. Empty set = show all. Managed by `filterStatuses` (a `Set`) and `updateStatusFilterDots()`.
- POS filter: `Filter by…` (value `""` = show all)
- Sort/group: **Group by name** (alphabetical, default) | **Group by status** — groups cards under New / Learning / Known headers with a colored dot

`getFilteredCards()` applies search, POS filter, and status filter together (AND logic).

When grouped by status, `renderCardList` renders section headers (dot + label + divider line) before each group's cards. Only non-empty groups appear.

### Form (add / edit card)
Same form element reused for both add and edit. `openForm()` / `closeForm()` open and close `#card-modal`. The form title and submit button text change based on `editingId`.

Validation on submit:
- Word field: duplicate check (`word + partOfSpeech`), shows inline `#word-error`
- Definition field: 200-character max, shows inline `#definition-error`
- Both errors clear on next `input` event

### Delete button hover
`.btn-delete:hover` is defined in `styles.css` (not a Tailwind class) because Tailwind's Play CDN only scans static HTML — it won't generate `hover:text-red-*` for classes that only appear inside JS-generated `innerHTML`.

### Study mode (Review tab)
The review section is constrained to `max-w-sm mx-auto` to keep the card flashcard-sized on large displays, consistent with the grid card scale on the Learn tab.

Layout top to bottom:
1. **Filter row** (top-right, `#study-filter`) — `filter` label + three `w-3 h-3` dot toggles. Visible whenever storage has cards. Managed by `reviewFilterStatuses` (a `Set`) independent of the Learn tab filter.
2. **Flip card** (`#study-card`) — opacity crossfade (`0.18s ease`) between front (word + POS) and back (definition). Click to flip.
3. **Nav row** (`#study-controls`) — counter (`2 / 8`) above, then `← Prev  Shuffle  Next →` below.
4. **Status row** (`#study-status-row`) — three `w-12 h-12` square buttons with `w-5 h-5` dot inside. Clicking marks the current card's status in place; no auto-advance.

`buildDeck()` reads from `storage.getCards()` filtered by `reviewFilterStatuses`. When the filter yields an empty deck, the card/nav/status elements hide but the filter row stays visible so the user can adjust it.

Keyboard shortcuts (active when Review tab is visible and no input is focused):
- `←` / `→` — navigate cards
- `Space` — flip card
- `1` / `2` / `3` — set status (new / semi / known)

### Responsive grid
Cards use `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. Container is `max-w-5xl`.

### Theme
Tailwind `class` dark-mode. `applyTheme(isDark)` sets `innerHTML` on the toggle button. Persisted in localStorage; defaults to `prefers-color-scheme` on first visit.

### Shared dot config
`STATUS_DOT_CONFIGS` in app.js holds the active/inactive Tailwind class strings for all `w-3 h-3` dot buttons. Used by both `updateStatusFilterDots()` (Learn tab) and `updateReviewFilterDots()` (Review tab). Study mode status dots use a separate inline config with `w-5 h-5`.

## Inline SVG icons (app.js)

```js
ICON_EDIT   // pencil, 13px
ICON_DELETE // trash, 13px
ICON_MOON   // crescent, 15px
ICON_SUN    // sun with rays, 15px
```

## Style reference

Obsidian-website feel: whitespace, `Inter` font, violet accent (`#7c3aed`), clean light/dark themes. Cards: `rounded-xl`, `shadow-sm`, `hover:shadow-md hover:border-gray-300`. Status dots: `rounded` (rounded square, not circle). All `button` and `select` elements get `cursor: pointer` globally via `styles.css`.

## Parts of speech (dropdown values)

noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection

## Dev tools

Collapsible panel at bottom of page. Also on `window.dev` in the browser console:

- `window.dev.seed()` — add ~8 sample cards with varied statuses (known/semi/new)
- `window.dev.clear()` — wipe all cards (with confirm)
- `window.dev.log()` — `console.table` all cards
- `window.dev.count()` — return card count
