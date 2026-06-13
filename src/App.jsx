import { useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Header";
import LearnTab from "@/components/LearnTab";
import ReviewTab from "@/components/ReviewTab";
import SettingsDialog from "@/components/SettingsDialog";
import ImportDuplicatesDialog from "@/components/ImportDuplicatesDialog";
import ImportSummaryDialog from "@/components/ImportSummaryDialog";
import * as storage from "@/lib/storage";
import {
  getInitialMode,
  getInitialColorTheme,
  applyMode,
  applyColorTheme,
} from "@/lib/theme";
import {
  parseMdFile,
  readFileAsText,
  exportCardsAsZip,
} from "@/lib/importExport";
import {
  registerDevTools,
  seedSampleCards,
  clearAllCards,
  logCards,
} from "@/lib/devtools";

export default function App() {
  // Cards are mirrored from storage. Every mutation goes through storage and
  // then calls refreshCards() to re-read the source of truth.
  const [cards, setCards] = useState(() => storage.getCards());
  const [tab, setTab] = useState("learn");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState(getInitialMode);
  const [colorTheme, setColorTheme] = useState(getInitialColorTheme);

  // null | { phase: "duplicates", reads, valid, errors, duplicates }
  //      | { phase: "summary", results }
  const [importFlow, setImportFlow] = useState(null);

  const refreshCards = () => setCards(storage.getCards());

  // Expose window.dev for console use during development only.
  useEffect(() => {
    if (import.meta.env.DEV) registerDevTools(() => setCards(storage.getCards()));
  }, []);

  // ── Card mutations ──────────────────────────────────────────
  const handleAddCard = (data) => {
    storage.addCard(data);
    refreshCards();
  };
  const handleUpdateCard = (id, data) => {
    storage.updateCard(id, data);
    refreshCards();
  };
  const handleDeleteCard = (id) => {
    storage.deleteCard(id);
    refreshCards();
  };
  const handleSetStatus = (id, status) => {
    storage.setStatus(id, status);
    refreshCards();
  };

  // ── Theme ───────────────────────────────────────────────────
  const handleModeChange = (next) => {
    setMode(next);
    applyMode(next);
  };
  const handleColorThemeChange = (next) => {
    setColorTheme(next);
    applyColorTheme(next);
  };

  // ── Import / export ─────────────────────────────────────────
  async function handleImportFiles(fileList) {
    // 1. Read all files before touching storage or the UI.
    const reads = await Promise.all(
      Array.from(fileList).map(async (f) => {
        try {
          return { filename: f.name, text: await readFileAsText(f) };
        } catch {
          return { filename: f.name, text: null, readError: true };
        }
      })
    );

    // 2. Parse and bucket into valid / duplicates / errors.
    const errors = [];
    const valid = [];
    const duplicates = [];
    for (const { filename, text, readError } of reads) {
      if (readError) {
        errors.push({ filename, reason: "Could not read file" });
        continue;
      }
      const parsed = parseMdFile(filename, text);
      if (!parsed.ok) {
        errors.push({ filename: parsed.filename, reason: parsed.reason });
        continue;
      }
      const existing = storage.findDuplicate(parsed.word, parsed.partOfSpeech);
      if (existing) duplicates.push({ parsed, existing });
      else valid.push(parsed);
    }

    // 3. If duplicates exist, ask the user; otherwise apply immediately.
    if (duplicates.length > 0) {
      setImportFlow({ phase: "duplicates", reads, valid, errors, duplicates });
    } else {
      applyImport({ reads, valid, errors, toOverwrite: [], toSkip: [] });
    }
  }

  function handleResolveDuplicates(overwriteIndices) {
    const { reads, valid, errors, duplicates } = importFlow;
    const toOverwrite = overwriteIndices.map((i) => duplicates[i]);
    const toSkip = duplicates.filter((_, i) => !overwriteIndices.includes(i));
    applyImport({ reads, valid, errors, toOverwrite, toSkip });
  }

  // Writes the import to storage (one batch per operation) and shows the summary.
  function applyImport({ reads, valid, errors, toOverwrite, toSkip }) {
    storage.bulkAdd(valid);
    storage.bulkUpdate(
      toOverwrite.map(({ existing, parsed }) => ({
        id: existing.id,
        changes: {
          word: parsed.word,
          partOfSpeech: parsed.partOfSpeech,
          definition: parsed.definition,
          status: parsed.status,
        },
      }))
    );
    refreshCards();

    // Build per-file results, preserving the original file order.
    const resultMap = new Map();
    for (const p of valid) resultMap.set(p.filename, { status: "added" });
    for (const { parsed } of toOverwrite)
      resultMap.set(parsed.filename, { status: "updated" });
    for (const { parsed } of toSkip)
      resultMap.set(parsed.filename, { status: "skipped" });
    for (const e of errors)
      resultMap.set(e.filename, { status: "failed", reason: e.reason });

    const results = reads.map((r) => ({
      filename: r.filename,
      ...resultMap.get(r.filename),
    }));
    setImportFlow({ phase: "summary", results });
  }

  function handleExport() {
    if (cards.length === 0) {
      alert("No cards to export.");
      return;
    }
    exportCardsAsZip(cards);
  }

  // ── Developer helpers (Settings dialog) ─────────────────────
  const handleSeed = () => {
    const added = seedSampleCards();
    refreshCards();
    alert(`Added ${added} sample card(s).`);
  };
  const handleClear = () => {
    if (confirm("Delete all flashcards? This cannot be undone.")) {
      clearAllCards();
      refreshCards();
    }
  };
  const handleLog = () => {
    logCards();
    alert("Card data logged to the browser console (F12 → Console tab).");
  };

  return (
    <Tabs value={tab} onValueChange={setTab} className="min-h-screen gap-0">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <TabsContent value="learn">
          <LearnTab
            cards={cards}
            onAddCard={handleAddCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onSetStatus={handleSetStatus}
          />
        </TabsContent>
        <TabsContent value="review">
          <ReviewTab cards={cards} onSetStatus={handleSetStatus} />
        </TabsContent>
      </main>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        mode={mode}
        colorTheme={colorTheme}
        onModeChange={handleModeChange}
        onColorThemeChange={handleColorThemeChange}
        onImportFiles={handleImportFiles}
        onExport={handleExport}
        onSeed={handleSeed}
        onClear={handleClear}
        onLog={handleLog}
      />

      <ImportDuplicatesDialog
        open={importFlow?.phase === "duplicates"}
        duplicates={
          importFlow?.phase === "duplicates" ? importFlow.duplicates : []
        }
        onResolve={handleResolveDuplicates}
      />
      <ImportSummaryDialog
        open={importFlow?.phase === "summary"}
        results={importFlow?.phase === "summary" ? importFlow.results : []}
        onClose={() => setImportFlow(null)}
      />
    </Tabs>
  );
}
