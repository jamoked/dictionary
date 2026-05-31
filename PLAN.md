# Vocabulary Flashcard App — Build Plan

## Context

The user is learning to code and wants to build a vocabulary flashcard web app as a
hands-on project. The project directory (`/Users/jamoked/code/projects/dictionary`) is
currently empty — this is a greenfield build. The goal is a clean, beginner-maintainable
app where the user can add vocabulary cards (word, part of speech, definition), browse/manage
them, and study them with a flip-card review mode. Data persists in the browser via
localStorage, but the data-access code is isolated so a real backend can be swapped in later
with minimal changes.

Per the user's global preferences: **vanilla JavaScript, HTML, CSS only** (no frameworks),
**Tailwind for styling** (via CDN — no build step, easiest for a learner), **localStorage**
for storage behind a dedicated data layer, **separation of concerns**, and **simple, explicit,
well-commented code** that the user can read back and maintain.

## Decisions captured from the user

- **Review experience:** Both a browsable **list view** (manage cards) and a **flip-card study mode**, shown as two tabs.
- **Part of speech:** **Dropdown** with a preset list (noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection).
- **Features:** Edit & delete · Search/filter · Shuffle in study mode · Mark as known · Duplicate detection.
- **Duplicate rule:** Warn (prompt to confirm) only when **the same word + same part of speech** already exists. `book (noun)` and `book (verb)` coexist freely.
- **Known cards:** Study mode **hides known cards by default**, with an **"Include known" toggle** to bring them back.
- **Visual style:** Clean, minimal, modern — **Obsidian-website feel** (whitespace, modern sans-serif, purple/violet accent) with a **light/dark mode toggle** that remembers the user's choice.

## File structure

```
dictionary/
├── index.html        # Markup: header/tabs, add-card form, list view, study view, dev tools panel
├── PLAN.md           # This file
├── CLAUDE.md         # Project instructions for Claude Code
├── css/
│   └── styles.css    # Custom CSS: card-flip animation, theme accent vars
└── js/
    ├── storage.js    # DATA LAYER — the only file that touches localStorage (swap point for a backend)
    ├── devtools.js   # Testing/debug helpers — seed sample cards, clear data, log state
    └── app.js        # UI logic — reads/writes via storage.js, renders, handles events
```

**Why this split:** `storage.js` is the **seam** for later backend work. Today it reads/writes
localStorage; later its functions become API calls and nothing else in the app needs to know.
This directly serves the "minimal changes to add a real database" goal.

## Data model

Each card is a plain object:

```js
{
  id: "uuid",            // crypto.randomUUID()
  word: "ubiquitous",
  partOfSpeech: "adjective",
  definition: "present, appearing, or found everywhere",
  known: false,
  createdAt: 1717000000000   // Date.now()
}
```

Stored as a JSON array in localStorage under a single key: `"flashcards"`.

## `storage.js` — the data layer

Pure data functions, no DOM. All localStorage access lives here.

| Function | Returns | Notes |
|---|---|---|
| `getCards()` | array | all cards |
| `getCard(id)` | card or `null` | single lookup |
| `findDuplicate(word, pos)` | card or `null` | case-insensitive, trimmed match on word + POS |
| `addCard({ word, partOfSpeech, definition })` | new card | assigns id/known/createdAt |
| `updateCard(id, changes)` | updated card | merges changes |
| `deleteCard(id)` | void | removes by id |
| `toggleKnown(id)` | void | flips the `known` flag |
| `clearAll()` | void | wipes all cards (used by dev tools) |

Internal `loadAll()` / `saveAll()` helpers wrap JSON parse/stringify with a try/catch so a
corrupt store doesn't crash the app.

## `app.js` — UI logic

Wires the DOM to the data layer. Organized in clear sections:

1. **Tab switching** — toggle between "My Cards" (list) and "Study" views.
2. **Add/Edit form** — word, part of speech (dropdown), definition. On submit: validate → check for duplicate → if found, `confirm()` before saving. Same form reused for editing.
3. **List view rendering** — responsive grid: word, POS badge, definition, known badge, Edit / Delete buttons.
4. **Search & filter** — search box (word, case-insensitive) + POS filter dropdown; re-renders on input.
5. **Study mode** — deck excludes known cards by default; flip on click; Prev/Next; shuffle; mark as known.
6. **Theme toggle** — Tailwind `class` dark-mode; persisted in localStorage; defaults to OS preference.

## `devtools.js` — testing helpers

Collapsible panel at the bottom of the page:

- **Add sample cards** — seeds ~8 vocab cards (including a `book (noun)` / `book (verb)` pair)
- **Clear all data** — wipes storage after a confirm
- **Log to console** — `console.table` of all cards
- **Card count** — live display

All functions also exposed on `window.dev` for direct browser-console use.

## Verification checklist

1. Open `index.html` in a browser (or `python3 -m http.server` → `localhost:8000`)
2. **Add cards** — 3–4 words appear in the list
3. **Duplicate rule** — `book (noun)` twice triggers prompt; `book (verb)` does not
4. **Edit/Delete** — change a definition; delete a card (confirm prompt)
5. **Search/filter** — list narrows correctly
6. **Study mode** — flip, Prev/Next, counter, shuffle, mark as known, include-known toggle
7. **Theme** — toggle persists across page reload
8. **Persistence** — all cards survive a page reload
9. **Dev tools** — seed, log, clear all work; card count updates

## Out of scope for v1

Real backend/auth, spaced-repetition scheduling, import/export, multiple decks.
