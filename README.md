# Dictionary

A minimal vocabulary flashcard app for building and reviewing your personal word list. No accounts, no sync, no install — just open it in a browser.

## Features

**Learn tab**
- Add cards with a word, part of speech, and definition
- Search, filter by part of speech, and filter by status (New / Learning / Known)
- Group cards alphabetically or by status
- Click any card to view the full definition in a focused modal
- Edit or delete cards inline — delete confirmation appears inside the card itself, no modal interruption

**Review tab**
- Flip cards to reveal definitions (click or press `Space`)
- Mark each card as New, Learning, or Known with one tap
- Filter the review deck by status to focus your session
- Shuffle the deck at any time
- Keyboard navigation: `←` `→` to move, `1` `2` `3` to mark status

**General**
- Traffic-light status system (red / yellow / green) visible at a glance across both tabs
- Light and dark mode, respects your OS preference on first visit
- All data stored locally in your browser — nothing leaves your device

## Running it

No build step required.

**Option A — open directly:**
```
open index.html
```

**Option B — local server (recommended, avoids some browser restrictions):**
```
python3 -m http.server
```
Then visit `http://localhost:8000`.

## Tech stack

- Vanilla JavaScript, HTML, CSS — no frameworks
- [Tailwind CSS](https://tailwindcss.com) via Play CDN for utility styling
- `localStorage` for persistence
- [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## Project structure

```
index.html        # All markup
css/styles.css    # Flip animation, modal transitions, custom properties
js/storage.js     # Data layer — the only file that touches localStorage
js/app.js         # UI logic
js/devtools.js    # Dev helpers (seed data, clear, log)
```

## Dev tools

A collapsible panel at the bottom of the page (also available as `window.dev` in the browser console) lets you seed sample cards, wipe data, and inspect storage without touching the UI.

```js
window.dev.seed()   // add ~8 sample cards
window.dev.clear()  // wipe all cards
window.dev.log()    // console.table all cards
window.dev.count()  // return card count
```
