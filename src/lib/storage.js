// storage.js — DATA LAYER
// This is the only file that reads from or writes to localStorage for card data.
// All other files call these functions instead of touching localStorage directly.
// Later, if you add a real backend, you only need to change this one file.

const STORAGE_KEY = "flashcards";

// Valid status values for a card.
const STATUSES = ["new", "semi", "known"];

// --- Internal helpers ---

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cards = raw ? JSON.parse(raw) : [];
    // Migrate older cards that used a boolean `known` field to the new `status` field.
    return cards.map((card) => {
      if (card.status === undefined) {
        return { ...card, status: card.known ? "known" : "new" };
      }
      return card;
    });
  } catch {
    // If the stored data is somehow corrupted, start fresh rather than crash.
    return [];
  }
}

function saveAll(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

// --- Public API ---

export function getCards() {
  return loadAll();
}

export function getCard(id) {
  return loadAll().find((c) => c.id === id) ?? null;
}

// Returns the existing card if word + partOfSpeech already exist (case-insensitive).
// Used to warn the user before adding a duplicate.
export function findDuplicate(word, partOfSpeech) {
  const normalWord = word.trim().toLowerCase();
  const normalPos = partOfSpeech.trim().toLowerCase();
  return (
    loadAll().find(
      (c) =>
        c.word.toLowerCase() === normalWord &&
        c.partOfSpeech.toLowerCase() === normalPos
    ) ?? null
  );
}

export function addCard({ word, partOfSpeech, definition }) {
  const cards = loadAll();
  const newCard = {
    id: crypto.randomUUID(),
    word: word.trim(),
    partOfSpeech,
    definition: definition.trim(),
    status: "new",
    createdAt: Date.now(),
  };
  cards.push(newCard);
  saveAll(cards);
  return newCard;
}

export function updateCard(id, changes) {
  const cards = loadAll();
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) return null;
  cards[index] = { ...cards[index], ...changes };
  saveAll(cards);
  return cards[index];
}

export function deleteCard(id) {
  const cards = loadAll().filter((c) => c.id !== id);
  saveAll(cards);
}

// Sets a card's review status to one of: "new", "semi", "known".
export function setStatus(id, status) {
  if (!STATUSES.includes(status)) return;
  const cards = loadAll();
  const card = cards.find((c) => c.id === id);
  if (card) {
    card.status = status;
    saveAll(cards);
  }
}

export function clearAll() {
  saveAll([]);
}

// Adds multiple new cards in a single localStorage write.
// Each item should have { word, partOfSpeech, definition, status }.
// Returns the number of cards added.
export function bulkAdd(newCards) {
  if (newCards.length === 0) return 0;
  const cards = loadAll();
  const now = Date.now();
  newCards.forEach(({ word, partOfSpeech, definition, status }) => {
    cards.push({
      id: crypto.randomUUID(),
      word: word.trim(),
      partOfSpeech,
      definition: definition.trim(),
      status: STATUSES.includes(status) ? status : "new",
      createdAt: now,
    });
  });
  saveAll(cards);
  return newCards.length;
}

// Updates multiple existing cards by id in a single localStorage write.
// Each item should have { id, changes } where changes is merged into the card.
// Returns the number of cards updated.
export function bulkUpdate(updates) {
  if (updates.length === 0) return 0;
  const cards = loadAll();
  let count = 0;
  updates.forEach(({ id, changes }) => {
    const index = cards.findIndex((c) => c.id === id);
    if (index !== -1) {
      cards[index] = { ...cards[index], ...changes };
      count++;
    }
  });
  saveAll(cards);
  return count;
}
