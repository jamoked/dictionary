import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusDots from "./StatusDots";

// Reads a single card full-size. Left/right arrows walk through the same
// filtered + sorted list shown on the Learn tab (`visibleCards`). Deleting asks
// for confirmation inline, without closing the dialog first; Escape cancels that
// confirmation before it closes the dialog.
export default function ViewCardDialog({
  open,
  cardId,
  visibleCards,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onSetStatus,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const card = visibleCards.find((c) => c.id === cardId) ?? null;

  // Reset the inline confirm whenever we open a different card or close.
  useEffect(() => {
    setConfirmingDelete(false);
  }, [cardId, open]);

  // Arrow-key navigation across the visible list (disabled while confirming).
  useEffect(() => {
    if (!open || confirmingDelete) return;
    function handleKey(e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const index = visibleCards.findIndex((c) => c.id === cardId);
      if (index === -1) return;
      const next = index + (e.key === "ArrowRight" ? 1 : -1);
      if (next >= 0 && next < visibleCards.length) {
        onNavigate(visibleCards[next].id);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, confirmingDelete, cardId, visibleCards, onNavigate]);

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-3 sm:max-w-md"
        // Escape / outside-click should dismiss the inline confirm first.
        onEscapeKeyDown={(e) => {
          if (confirmingDelete) {
            e.preventDefault();
            setConfirmingDelete(false);
          }
        }}
        onInteractOutside={(e) => {
          if (confirmingDelete) {
            e.preventDefault();
            setConfirmingDelete(false);
          }
        }}
      >
        {confirmingDelete ? (
          <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
            <DialogTitle className="text-sm font-semibold">
              Delete "{card.word}"?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This cannot be undone.
            </DialogDescription>
            <div className="mt-2 flex items-center gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(card.id)}
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2">
              <DialogTitle className="text-lg leading-tight font-semibold">
                {card.word}
              </DialogTitle>
              <StatusDots
                status={card.status}
                onSetStatus={(status) => onSetStatus(card.id, status)}
              />
              <span className="text-xs text-muted-foreground italic">
                {card.partOfSpeech}
              </span>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(card.id)}
                  aria-label="Edit"
                  className="p-1 text-muted-foreground/40 transition-colors hover:text-primary"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Delete"
                  className="p-1 text-muted-foreground/40 transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <DialogDescription className="text-sm leading-relaxed text-foreground">
              {card.definition}
            </DialogDescription>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
