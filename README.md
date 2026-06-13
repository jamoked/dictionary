# Dictionary

A minimal vocabulary flashcard app for building and reviewing your personal word list. No accounts, no sync — your data stays in your browser.

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

```
npm install
npm run dev      # dev server at http://localhost:5173
```

Other scripts: `npm run build` (production build into `dist/`) and `npm run preview` (serve that build).

## Tech stack

- [React](https://react.dev) + [Vite](https://vite.dev) (JavaScript/JSX — no TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components
- [JSZip](https://stuk.github.io/jszip/) for `.zip` export
- `localStorage` for persistence
- [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## Project structure

```
index.html         # Vite entry — meta tags, Inter font, the pre-paint theme script
src/App.jsx        # Owns card state + all storage mutations; wires the tabs and dialogs
src/lib/           # storage (data layer), theme, validate, importExport, devtools
src/components/     # Header, Learn/Review tabs, cards, dialogs, and shadcn ui/ primitives
src/index.css      # Tailwind, theme tokens (slate/obsidian), and the few hand-written CSS rules
```

See `CLAUDE.md` for the full architecture notes.

## Dev tools

The Settings dialog has a **Developer** section (Seed / Clear / Log). The same helpers are on `window.dev` in development:

```js
window.dev.seed()   // add ~8 sample cards
window.dev.clear()  // wipe all cards
window.dev.log()    // console.table all cards
window.dev.count()  // return card count
```
