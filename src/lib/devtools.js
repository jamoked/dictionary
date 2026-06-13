// devtools.js — TESTING & DEBUGGING HELPERS
// Used by the Developer section of the Settings dialog, and also exposed on
// window.dev so the same actions work from the browser console:
//   window.dev.seed()   → add sample cards
//   window.dev.clear()  → wipe all data (asks for confirmation)
//   window.dev.log()    → print cards as a table in the console
//   window.dev.count()  → return the current card count

import * as storage from "@/lib/storage";

const SAMPLE_CARDS = [
  { word: "ubiquitous", partOfSpeech: "adjective", definition: "present, appearing, or found everywhere" },
  { word: "ephemeral", partOfSpeech: "adjective", definition: "lasting for a very short time" },
  { word: "garrulous", partOfSpeech: "adjective", definition: "excessively talkative, especially on trivial matters" },
  { word: "serendipity", partOfSpeech: "noun", definition: "the occurrence of events by chance in a happy way" },
  { word: "loquacious", partOfSpeech: "adjective", definition: "tending to talk a great deal; talkative" },
  { word: "ameliorate", partOfSpeech: "verb", definition: "to make something bad or unsatisfactory better" },
  // Intentional pair — same word, different part of speech — to demo the duplicate rule
  { word: "book", partOfSpeech: "noun", definition: "a written or printed work consisting of pages" },
  { word: "book", partOfSpeech: "verb", definition: "to reserve or arrange in advance" },
];

// Adds the sample cards (skipping any that already exist) and returns how many
// were added. Also seeds a couple of varied statuses so all three traffic-light
// states are visible immediately.
export function seedSampleCards() {
  let added = 0;
  for (const card of SAMPLE_CARDS) {
    if (!storage.findDuplicate(card.word, card.partOfSpeech)) {
      storage.addCard(card);
      added++;
    }
  }
  const cards = storage.getCards();
  const adjectives = cards.filter((c) => c.partOfSpeech === "adjective");
  if (adjectives[0]) storage.setStatus(adjectives[0].id, "known");
  if (adjectives[1]) storage.setStatus(adjectives[1].id, "semi");
  return added;
}

export function clearAllCards() {
  storage.clearAll();
}

export function logCards() {
  console.table(storage.getCards());
}

export function countCards() {
  return storage.getCards().length;
}

// Wires the same helpers to window.dev for console use. `refresh` re-syncs the
// React UI after a console-driven change. Called once from App in dev mode.
export function registerDevTools(refresh) {
  window.dev = {
    seed: () => {
      const added = seedSampleCards();
      refresh();
      return added;
    },
    clear: () => {
      if (confirm("Delete all flashcards? This cannot be undone.")) {
        clearAllCards();
        refresh();
        return true;
      }
      return false;
    },
    log: logCards,
    count: countCards,
  };
}
