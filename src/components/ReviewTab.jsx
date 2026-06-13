import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { STATUSES } from "@/lib/validate";
import { cn } from "@/lib/utils";
import StatusFilterDots from "./StatusFilterDots";

const ALL_STATUSES = new Set(STATUSES.map((s) => s.value));

// Per-status styling for the three large "mark as…" buttons.
const STATUS_BUTTON = {
  new: {
    active: "bg-red-400 border-red-400 text-gray-900 font-semibold",
    inactive:
      "border-red-400 text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-400/10",
  },
  semi: {
    active: "bg-yellow-400 border-yellow-400 text-gray-900 font-semibold",
    inactive:
      "border-yellow-400 text-yellow-600 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-400/10",
  },
  known: {
    active: "bg-green-400 border-green-400 text-gray-900 font-semibold",
    inactive:
      "border-green-400 text-green-600 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-400/10",
  },
};

export default function ReviewTab({ cards, onSetStatus }) {
  const [reviewFilterStatuses, setReviewFilterStatuses] = useState(
    () => new Set(ALL_STATUSES)
  );
  const [deckIds, setDeckIds] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Reconcile the deck whenever cards or the filter change: keep the existing
  // order for ids still eligible (so a shuffle survives a status change) and
  // append any newly-eligible ids at the end.
  useEffect(() => {
    const eligibleIds = cards
      .filter((c) => reviewFilterStatuses.has(c.status))
      .map((c) => c.id);
    const eligibleSet = new Set(eligibleIds);
    setDeckIds((prev) => {
      const kept = prev.filter((id) => eligibleSet.has(id));
      const keptSet = new Set(kept);
      const added = eligibleIds.filter((id) => !keptSet.has(id));
      return [...kept, ...added];
    });
  }, [cards, reviewFilterStatuses]);

  const safeIndex = deckIds.length ? Math.min(index, deckIds.length - 1) : 0;
  const currentId = deckIds[safeIndex];
  const currentCard = currentId
    ? cards.find((c) => c.id === currentId) ?? null
    : null;

  // Show the front of each new card.
  useEffect(() => {
    setFlipped(false);
  }, [currentId]);

  // Keyboard shortcuts. This component only mounts while the Review tab is
  // active (Radix unmounts inactive tab panels), so the listener is naturally
  // scoped to this view.
  useEffect(() => {
    function handleKey(e) {
      if (e.target.matches?.("input, textarea, select")) return;
      if (e.target.closest?.('[role="dialog"]')) return; // settings open
      if (deckIds.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => Math.min(deckIds.length - 1, i + 1));
      } else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "1") {
        onSetStatus(currentId, "new");
      } else if (e.key === "2") {
        onSetStatus(currentId, "semi");
      } else if (e.key === "3") {
        onSetStatus(currentId, "known");
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [deckIds, currentId, onSetStatus]);

  function toggleFilterStatus(status) {
    setReviewFilterStatuses((prev) => {
      if (prev.has(status) && prev.size === 1) return prev; // keep at least one
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
    setIndex(0);
  }

  function shuffle() {
    setDeckIds((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setIndex(0);
  }

  const hasAnyCards = cards.length > 0;

  return (
    <div className="mx-auto max-w-sm">
      {/* Filter row — visible whenever any cards exist, even if the deck is empty */}
      {hasAnyCards && (
        <div className="mb-4 flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusFilterDots
              active={reviewFilterStatuses}
              onToggle={toggleFilterStatus}
            />
          </div>
        </div>
      )}

      {currentCard ? (
        <>
          <div
            className="mb-6 h-[260px] cursor-pointer"
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            aria-label="Flip card"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
          >
            <div className={cn("study-card-inner", flipped && "flipped")}>
              <div className="study-card-face study-card-front border bg-card shadow-sm">
                <p className="study-word mb-2 text-center text-3xl font-semibold">
                  {currentCard.word}
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  {currentCard.partOfSpeech}
                </p>
              </div>
              <div className="study-card-face study-card-back border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950">
                <p className="text-center text-base leading-relaxed text-foreground">
                  {currentCard.definition}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {safeIndex + 1} / {deckIds.length}
          </p>

          {/* Mark-as status row */}
          <div className="mt-3 flex justify-center gap-3">
            {STATUSES.map((s) => {
              const isActive = currentCard.status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onSetStatus(currentId, s.value)}
                  aria-pressed={isActive}
                  className={cn(
                    "w-24 rounded-lg border py-2 text-sm transition-colors",
                    isActive
                      ? STATUS_BUTTON[s.value].active
                      : STATUS_BUTTON[s.value].inactive
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Nav row */}
          <div className="mt-3 mb-2 flex justify-center gap-3">
            <Button
              variant="outline"
              className="w-24"
              disabled={safeIndex === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              ← Prev
            </Button>
            <Button variant="outline" className="w-24" onClick={shuffle}>
              Shuffle
            </Button>
            <Button
              variant="outline"
              className="w-24"
              disabled={safeIndex >= deckIds.length - 1}
              onClick={() =>
                setIndex((i) => Math.min(deckIds.length - 1, i + 1))
              }
            >
              Next →
            </Button>
          </div>
        </>
      ) : (
        <div className="mb-6 flex h-[260px] items-center justify-center rounded-2xl border">
          <p className="px-8 text-center text-sm leading-relaxed text-muted-foreground">
            No words to review.
          </p>
        </div>
      )}
    </div>
  );
}
