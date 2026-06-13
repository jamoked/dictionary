// importExport.js — markdown import parsing + zip export.
// Pure helpers: they take/return plain data and never touch the DOM, so the
// React components stay in charge of the UI flow.

import JSZip from "jszip";
import { validateWord, VALID_POS, MAX_DEFINITION_LENGTH } from "@/lib/validate";

// Parses a .md file's content. Word comes from the filename (without .md extension).
// Returns { ok: true, filename, word, partOfSpeech, definition, status }
//      or { ok: false, filename, reason }
// Validates strictly against the word template: exactly "part of speech" and
// "definition" lines are required, "status" is the only allowed addition.
export function parseMdFile(filename, text) {
  const word = filename.replace(/\.md$/i, "").trim();

  const wordErr = validateWord(word);
  if (wordErr) return { ok: false, filename, reason: wordErr };

  if (!text.trim())
    return {
      ok: false,
      filename,
      reason: "Empty file: no valid properties found",
    };

  const invalid = {
    ok: false,
    filename,
    reason: "Invalid format: check file syntax",
  };

  // Normalize line endings and strip trailing blank lines
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  // Must open and close with ---
  if (lines[0] !== "---" || lines[lines.length - 1] !== "---") return invalid;

  // Lines between the --- delimiters
  const inner = lines.slice(1, -1);

  // Exactly 2 lines (template) or 3 lines (with optional status)
  if (inner.length < 2 || inner.length > 3) return invalid;

  // Line 1 must be "part of speech: ..."
  const posMatch = inner[0].match(/^part of speech:[ \t]*(.*)$/);
  if (!posMatch) return invalid;

  // Line 2 must be "definition: ..."
  const defMatch = inner[1].match(/^definition:[ \t]*(.*)$/);
  if (!defMatch) return invalid;

  // Line 3, if present, must be "status: ..."
  let rawStatus = null;
  if (inner.length === 3) {
    const statusMatch = inner[2].match(/^status:[ \t]*(.*)$/);
    if (!statusMatch) return invalid;
    rawStatus = statusMatch[1].trim();
  }

  const pos = posMatch[1].trim();
  const definition = defMatch[1].trim();

  // Collect empty required fields before giving up
  const missing = [];
  if (!pos) missing.push("part of speech");
  if (!definition) missing.push("definition");
  if (missing.length > 0)
    return {
      ok: false,
      filename,
      reason: "Missing " + missing.map((f) => `"${f}"`).join(" and "),
    };

  if (!VALID_POS.includes(pos.toLowerCase()))
    return {
      ok: false,
      filename,
      reason: `"${pos}" is not a valid part of speech`,
    };

  if (definition.length > MAX_DEFINITION_LENGTH)
    return { ok: false, filename, reason: "Definition exceeds 200 characters" };

  const validStatus = ["new", "semi", "known"].includes(rawStatus)
    ? rawStatus
    : "new";
  return {
    ok: true,
    filename,
    word,
    partOfSpeech: pos.toLowerCase(),
    definition,
    status: validStatus,
  };
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

// Builds a .zip of every card as a .md file and triggers a browser download.
// Filename: vocab_export_YYYYMMDD.zip
export async function exportCardsAsZip(cards) {
  const zip = new JSZip();
  cards.forEach((card) => {
    const content = `---\npart of speech: ${card.partOfSpeech}\ndefinition: ${card.definition}\nstatus: ${card.status}\n---\n`;
    // Replace characters that are invalid in filenames
    const filename = card.word.replace(/[<>:"/\\|?*]/g, "_") + ".md";
    zip.file(filename, content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const today = new Date();
  const stamp =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");
  a.download = `vocab_export_${stamp}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
