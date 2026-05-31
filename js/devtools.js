// devtools.js — TESTING & DEBUGGING HELPERS
// These tools make it fast to populate and reset the app while building.
// The panel in the UI calls these same functions.
// Also exposed on window.dev so you can call them from the browser console:
//   window.dev.seed()   → add sample cards
//   window.dev.clear()  → wipe all data
//   window.dev.log()    → print cards as a table in the console
//   window.dev.count()  → return the current card count

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

function seedSampleCards() {
  let added = 0;
  for (const card of SAMPLE_CARDS) {
    // Skip if this exact word + POS already exists
    if (!storage.findDuplicate(card.word, card.partOfSpeech)) {
      storage.addCard(card);
      added++;
    }
  }
  // Seed varied statuses so all three traffic-light states are visible immediately.
  const cards = storage.getCards();
  const adjectives = cards.filter((c) => c.partOfSpeech === "adjective");
  if (adjectives[0]) storage.setStatus(adjectives[0].id, "known");
  if (adjectives[1]) storage.setStatus(adjectives[1].id, "semi");
  // Remaining cards stay at the default "new" status.

  return added;
}

function clearData() {
  if (confirm("Delete all flashcards? This cannot be undone.")) {
    storage.clearAll();
    return true;
  }
  return false;
}

function logState() {
  console.table(storage.getCards());
}

function cardCount() {
  return storage.getCards().length;
}

// Expose on window so these are callable from the browser console during development
window.dev = { seed: seedSampleCards, clear: clearData, log: logState, count: cardCount };
