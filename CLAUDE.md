# Dictionary — Vocabulary Flashcard App

A React flashcard app for building vocabulary. Built with Vite, Tailwind CSS v4, and shadcn/ui (in **JavaScript/JSX — no TypeScript**).

## Running it

```
npm install      # first time
npm run dev      # dev server at localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Project structure

```
index.html                 # Vite entry — iOS meta tags, Inter font, the SYNC theme script, #root
src/main.jsx               # React entry — mounts <App>, imports index.css
src/App.jsx                # Owns cards state + every storage mutation; tab, settings, import-flow, theme state
src/index.css              # Tailwind import, theme tokens, obsidian/slate vars, study crossfade, mobile/scrollbar CSS
src/lib/
  storage.js               # DATA LAYER — the only file that touches card localStorage
  theme.js                 # Theme preferences — the only other file that touches localStorage
  validate.js              # validateWord, POS lists, the shared STATUSES config
  importExport.js          # parseMdFile, readFileAsText, exportCardsAsZip (uses the jszip npm package)
  devtools.js              # Sample data + window.dev console helpers
  utils.js                 # shadcn cn() helper
src/components/
  ui/                      # shadcn primitives (Button, Card, Dialog, Input, Select, Tabs, …)
  Header.jsx               # Sticky header: title, Learn/Review tab switch, settings gear
  LearnTab.jsx             # Toolbar (search/filter/sort) + card grid + the form/view dialogs
  CardItem.jsx             # One card, incl. its inline delete-confirm state
  StatusDots.jsx           # The 3 traffic-light status buttons on a card
  StatusFilterDots.jsx     # The 3-dot multi-select status filter (Learn + Review)
  CardFormDialog.jsx       # Add / edit form with validation
  ViewCardDialog.jsx       # Full-size card view with ←/→ navigation
  ReviewTab.jsx            # Flip card, deck, nav, status row, keyboard shortcuts
  SettingsDialog.jsx       # Display/theme, import/export, and the Developer (seed/clear/log) section
  ImportDuplicatesDialog.jsx  # Per-file overwrite checkboxes
  ImportSummaryDialog.jsx     # Post-import counts + per-file details
```

## Rules for this project

- **JavaScript + JSX only — no TypeScript.** shadcn is configured with `tsx: false` (see `components.json`); the `@/` import alias resolves to `src/` (`jsconfig.json` + `vite.config.js`).
- **Use shadcn primitives** from `@/components/ui/...` (Button, Card, Dialog, Input, Select, Tabs, Textarea, Label, Checkbox) rather than hand-rolled equivalents. Add more with `npx shadcn@latest add <name>`.
- **Tailwind utility classes, no inline styles.** Tailwind v4 is configured in CSS (`@import "tailwindcss"` in `index.css`) — there is no `tailwind.config.js`.
- **All card localStorage access goes through `src/lib/storage.js`.** Theme prefs are the one other thing in localStorage, isolated in `src/lib/theme.js`. Nothing else should touch `localStorage` directly.
- **Keep state simple and explicit.** Plain `useState` lifted to the component that owns it, props passed down. No state-management library, no context. `App.jsx` holds the cards array and re-reads storage via `refreshCards()` after each mutation.
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

Stored as a JSON array in localStorage under key `"flashcards"`. Old cards with `known: boolean` are auto-migrated in `storage.js`'s internal `loadAll()`.

## storage.js — public API (named ES exports)

| Function | Description |
|---|---|
| `getCards()` | All cards |
| `getCard(id)` | Single card or null |
| `findDuplicate(word, pos)` | Match on word + POS (case-insensitive) — powers the duplicate warning |
| `addCard({word, partOfSpeech, definition})` | Creates a card with status `"new"` |
| `updateCard(id, changes)` | Merges changes |
| `deleteCard(id)` | Removes by id |
| `setStatus(id, status)` | Sets `"new"` / `"semi"` / `"known"` |
| `clearAll()` | Wipes all cards |
| `bulkAdd(cards)` | Adds many in one write (import) |
| `bulkUpdate(updates)` | Updates many in one write (import) |

Import it as a namespace so call sites read naturally: `import * as storage from "@/lib/storage"` → `storage.getCards()`.

## How state flows

`App.jsx` is the single source of UI truth for cards:

- It holds `cards` (mirrored from storage) and every mutation handler (`handleAddCard`, `handleSetStatus`, …). Each handler calls a `storage.*` function and then `refreshCards()`.
- `LearnTab` owns its own toolbar state (search, POS filter, the `filterStatuses` Set, group-by-status) plus which dialog is open (`viewCardId`, `deletingCardId`, the add/edit `formState`). It computes the filtered+sorted `visibleCards` during render.
- `ReviewTab` owns the deck: `deckIds` (an array of ids, so a shuffle survives status changes), `index`, `flipped`, and its own `reviewFilterStatuses` Set. A `useEffect` on `[cards, reviewFilterStatuses]` reconciles deck membership and clamps the index.
- Dialogs keep only their local field/confirm state.

## Key UI decisions & patterns

### Tabs
shadcn `Tabs` (controlled via `value`/`onValueChange` in `App.jsx`). The `TabsList` lives in the header; the two `TabsContent` panels are in `<main>`. Radix unmounts the inactive panel, so `ReviewTab`'s keyboard listener is automatically scoped to when Review is visible.

### Status dots & filters
`STATUSES` in `validate.js` is the single source for the three statuses (value, label, fill/border color classes). `StatusDots` (per-card, `h-3.5`) sets a card's status; `StatusFilterDots` (`h-4`) is a multi-select filter shared by both tabs. The "always keep at least one status active" rule lives in each tab's toggle handler (`if (set.has(s) && set.size === 1) return`).

### Inline delete confirm
No separate confirm modal. `LearnTab` tracks a single `deletingCardId` (so only one card can be confirming at a time). `CardItem` renders its confirm UI in place when `isConfirmingDelete` is true. `ViewCardDialog` does the same with local `confirmingDelete` state, and its `onEscapeKeyDown`/`onInteractOutside` dismiss the confirm before closing the dialog.

### Study flip
A CSS opacity crossfade (`.study-card-inner` / `.study-card-face` in `index.css`) — toggling a `flipped` class swaps front/back. Keyboard shortcuts (active on the Review tab, ignored while typing or when a dialog is open): `←`/`→` navigate, `Space` flips, `1`/`2`/`3` set status.

### Import / export
- **Export** (`exportCardsAsZip`) — a `.zip` of one `.md` per card, named `vocab_export_YYYYMMDD.zip`.
- **Import** — `parseMdFile` validates each file strictly against the word template (see `word-template.md`). The flow is driven by `importFlow` state in `App.jsx`: `null` → (if duplicates) `{phase:"duplicates"}` → `{phase:"summary"}`. `SettingsDialog` only owns the hidden file input.

### Theme
Two independent settings, both owned by `src/lib/theme.js` (the only non-storage localStorage user):
- **Mode** (`theme` key: `light`/`dark`) toggles the `dark` class on `<html>`.
- **Color theme** (`color-theme` key: `obsidian`/`slate`; legacy `default` → `slate`) sets `data-theme` on `<html>`.

Components style themselves with shadcn **semantic token classes** (`bg-card`, `border-border`, `text-primary`, …). The themes are then pure CSS-variable overrides in `index.css` — `html[data-theme="obsidian"]` (and its `.dark` variant) redefine `--background`, `--card`, `--border`, etc. No per-component theme selectors.

A small inline script in `index.html` applies both the `dark` class and `data-theme` **before first paint** so the iOS PWA status-bar area never flashes the wrong color (React effects run after paint).

### iOS / PWA
`index.html` keeps `viewport-fit=cover`, `apple-mobile-web-app-capable`, and the `black-translucent` status bar. `index.css` puts the page background on both `<html>` and `<body>` (so the status-bar area matches) and keeps `overflow-x: hidden` on `<body>` only. The header uses `pt-[env(safe-area-inset-top)]`. On phones (`max-width: 767px`) the root font scales to 18px and small dots get a 44×44 tap target via the `.dot-tap-target` class.

## Parts of speech

The dropdowns currently surface `adjective`, `noun`, `verb` (`POS_OPTIONS` in `validate.js`). Import accepts the full set in `VALID_POS`: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection.

## Dev tools

The Settings dialog has a **Developer** section with Seed / Clear / Log buttons. The same helpers are on `window.dev` in development (`npm run dev`):

- `window.dev.seed()` — add ~8 sample cards with varied statuses
- `window.dev.clear()` — wipe all cards (asks for confirmation)
- `window.dev.log()` — `console.table` all cards
- `window.dev.count()` — return the card count
