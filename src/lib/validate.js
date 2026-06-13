// validate.js — shared validation + small constants used across the UI.

// The parts of speech offered in the dropdowns. The full list is kept here so
// import validation can accept any of them, even though the dropdown currently
// only surfaces the first three (the rest are commented out in the UI for now).
export const POS_OPTIONS = ["adjective", "noun", "verb"];

export const VALID_POS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
];

export const MAX_DEFINITION_LENGTH = 200;

// The three review statuses, in display order, with their labels and colors.
// Shared by the status dots, filter dots, and group headers.
export const STATUSES = [
  { value: "new", label: "New", groupLabel: "New", fill: "bg-red-400", border: "border-red-400" },
  { value: "semi", label: "Learning", groupLabel: "Learning", fill: "bg-yellow-400", border: "border-yellow-400" },
  { value: "known", label: "Known", groupLabel: "Known", fill: "bg-green-400", border: "border-green-400" },
];

// Validates a word against dictionary-appropriate characters.
// Allows letters (including accented), spaces (phrasal verbs), hyphens, apostrophes.
// Returns an error string, or null if valid.
export function validateWord(word) {
  if (/^\d/.test(word)) return "Words can't start with a number.";
  if (!/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s'-]*$/.test(word))
    return "Invalid format: words can only contain spaces, hyphens and apostrophes";
  return null;
}
