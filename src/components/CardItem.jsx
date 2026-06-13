import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusDots from "./StatusDots";

// One flashcard in the Learn grid. When `isConfirmingDelete` is true it swaps
// its contents for a small inline "Delete?" confirmation, keeping the user's
// cursor right where it already is (no separate modal).
export default function CardItem({
  card,
  isConfirmingDelete,
  onOpen,
  onEdit,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
  onSetStatus,
}) {
  if (isConfirmingDelete) {
    return (
      <Card className="items-center justify-center gap-2 p-5 text-center">
        <p className="text-sm font-semibold">Delete "{card.word}"?</p>
        <p className="text-xs text-muted-foreground">This cannot be undone.</p>
        <div className="mt-2 flex items-center gap-3">
          <Button variant="destructive" size="sm" onClick={onConfirmDelete}>
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelDelete}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer gap-3 p-5 transition-all hover:-translate-y-px hover:border-card-hover-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2">
        <span className="text-lg leading-tight font-semibold">{card.word}</span>
        <StatusDots status={card.status} onSetStatus={onSetStatus} />
        <span className="text-xs text-muted-foreground/70 italic">
          {card.partOfSpeech}
        </span>
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit"
            className="p-1 text-muted-foreground/40 transition-colors hover:text-primary"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete"
            className="p-1 text-muted-foreground/40 transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {card.definition}
      </p>
    </Card>
  );
}
