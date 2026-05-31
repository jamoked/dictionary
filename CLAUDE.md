# Lexicon — Vocabulary Flashcard App

A vanilla JS/HTML/CSS flashcard app for building vocabulary. No build step — open `index.html` directly in a browser, or run `python3 -m http.server` and visit `localhost:8000`.

## Project structure

```
index.html        # All markup — header, tabs, form, list view, study view, dev tools panel
css/styles.css    # Card fade animation, collapsible form, CSS custom properties
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

### Card layout (app.js — renderCardList)
Each card uses a **two-column CSS grid** (`grid-template-columns: 1fr auto`) for the header row so word/POS and traffic lights/edit icons share the same row heights — guaranteeing exact vertical alignment:
- Row 1: word (left) | traffic-light status dots (right)
- Row 2: part of speech italic (left) | edit + delete icon buttons (right)
- Row 3: definition spans full width (separate `<p>` below the grid)

### Traffic light status dots
Three small rounded-square buttons (`w-3 h-3 rounded`) per card:
- **Active**: solid fill (`bg-red-400` / `bg-yellow-400` / `bg-green-400`)
- **Inactive**: outline only (`border border-red-400` etc.) — same color as fill for consistency
- Clicking sets status via `storage.setStatus()` and re-renders (stays on current card in study mode)
- Study mode has larger dots (`w-4 h-4`) in their own row between the counter and nav controls

### Icons (app.js — ICON_EDIT, ICON_DELETE, ICON_MOON, ICON_SUN)
Inline SVG constants at the top of app.js. Feather-style line icons, 13–15px. Theme toggle uses `innerHTML` (not `textContent`) to set SVG icons. Edit/delete buttons are near-invisible (`text-gray-300 dark:text-gray-600`) until hovered.

### Form panel (collapsible)
- Trigger: full-width card-styled button (`+ Add a card`), centered content, sits below search/filter above the card list
- Panel: `form-collapsible` CSS class — instant height change (no animation), content fades in via `opacity 0.15s ease` on the inner `> div`
- Same form reused for edit: `openForm()` / `closeForm()` in app.js manage state
- Duplicate check runs on submit: warns only when same `word + partOfSpeech` exists

### Study mode
- Deck excludes `status === "known"` cards by default; "Include known" toggle adds them back
- Status dots between counter and nav controls — clicking updates status in place, no auto-advance
- Card flip: simple opacity crossfade (`0.18s ease`) between front and back faces — no 3D transform

### Responsive grid
Cards use `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. Container is `max-w-5xl`.

### Theme
Tailwind `class` dark-mode. `applyTheme(isDark)` sets `innerHTML` on the toggle button. Persisted in localStorage; defaults to `prefers-color-scheme` on first visit.

### Search / filter
- Search input placeholder shows live word count: `Search N words…` (updated in `renderCardList`)
- Filter dropdown default option: `Filter by…` (value `""` = show all)

## Inline SVG icons (app.js)

```js
ICON_EDIT   // pencil, 13px
ICON_DELETE // trash, 13px
ICON_MOON   // crescent, 15px
ICON_SUN    // sun with rays, 15px
```

## Style reference

Obsidian-website feel: whitespace, `Inter` font, violet accent (`#7c3aed`), clean light/dark themes. Cards: `rounded-xl`, `shadow-sm`, `hover:shadow-md hover:border-gray-300`. Status dots: `rounded` (rounded square, not circle).

## Parts of speech (dropdown values)

noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection

## Dev tools

Collapsible panel at bottom of page. Also on `window.dev` in the browser console:

- `window.dev.seed()` — add ~8 sample cards with varied statuses (known/semi/new)
- `window.dev.clear()` — wipe all cards (with confirm)
- `window.dev.log()` — `console.table` all cards
- `window.dev.count()` — return card count
