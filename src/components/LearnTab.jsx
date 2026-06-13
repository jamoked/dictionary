import { Fragment, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, POS_OPTIONS } from "@/lib/validate";
import { cn } from "@/lib/utils";
import CardItem from "./CardItem";
import StatusFilterDots from "./StatusFilterDots";
import CardFormDialog from "./CardFormDialog";
import ViewCardDialog from "./ViewCardDialog";

const ALL_STATUSES = new Set(STATUSES.map((s) => s.value));

export default function LearnTab({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onSetStatus,
}) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState(""); // "" = all
  const [filterStatuses, setFilterStatuses] = useState(() => new Set(ALL_STATUSES));
  const [groupByStatus, setGroupByStatus] = useState(false);

  const [viewCardId, setViewCardId] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);
  // null = closed, { card: null } = add, { card } = edit.
  const [formState, setFormState] = useState(null);

  // Apply search + POS + status filters (AND), then sort alphabetically.
  const visibleCards = cards
    .filter((card) => {
      const matchesSearch = card.word
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPos = !filterPos || card.partOfSpeech === filterPos;
      const matchesStatus = filterStatuses.has(card.status);
      return matchesSearch && matchesPos && matchesStatus;
    })
    .sort((a, b) => a.word.localeCompare(b.word));

  // Escape cancels an in-progress inline delete confirmation.
  useEffect(() => {
    if (!deletingCardId) return;
    function handleKey(e) {
      if (e.key === "Escape") setDeletingCardId(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [deletingCardId]);

  function toggleFilterStatus(status) {
    setFilterStatuses((prev) => {
      if (prev.has(status) && prev.size === 1) return prev; // keep at least one
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function startEditFromView(id) {
    const card = cards.find((c) => c.id === id);
    setViewCardId(null);
    if (card) setFormState({ card });
  }

  function handleDeleteFromView(id) {
    setViewCardId(null);
    onDeleteCard(id);
  }

  const total = cards.length;

  function renderCard(card) {
    return (
      <CardItem
        key={card.id}
        card={card}
        isConfirmingDelete={deletingCardId === card.id}
        onOpen={() => setViewCardId(card.id)}
        onEdit={() => setFormState({ card })}
        onDelete={() => setDeletingCardId(card.id)}
        onCancelDelete={() => setDeletingCardId(null)}
        onConfirmDelete={() => {
          setDeletingCardId(null);
          onDeleteCard(card.id);
        }}
        onSetStatus={(status) => onSetStatus(card.id, status)}
      />
    );
  }

  return (
    <div>
      {/* Toolbar: search, status filter, POS filter, sort */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${total} word${total === 1 ? "" : "s"}…`}
          className="min-w-0 flex-1"
        />
        <div className="flex items-center gap-2">
          <div className="flex h-10 flex-none items-center gap-2 rounded-md border border-input bg-card px-3">
            <StatusFilterDots
              active={filterStatuses}
              onToggle={toggleFilterStatus}
            />
          </div>
          <Select
            value={filterPos || "all"}
            onValueChange={(value) =>
              setFilterPos(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-10 min-w-0 flex-1 sm:w-36" aria-label="Filter by part of speech">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {POS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={groupByStatus ? "status" : "alpha"}
            onValueChange={(value) => setGroupByStatus(value === "status")}
          >
            <SelectTrigger className="h-10 min-w-0 flex-1 sm:w-44" aria-label="Sort or group">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alpha">A-Z</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => setFormState({ card: null })}
        className="mb-4 h-auto w-full border-border bg-card py-3 text-primary shadow-sm hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="size-4" />
        Add Word
      </Button>

      {visibleCards.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No words in your collection.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groupByStatus
            ? STATUSES.map((s) => {
                const group = visibleCards.filter((c) => c.status === s.value);
                if (group.length === 0) return null;
                return (
                  <Fragment key={s.value}>
                    <div className="col-span-full mt-1 flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-sm", s.fill)} />
                      <span className="flex items-baseline gap-1">
                        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {s.groupLabel}
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground/60">
                          ({group.length})
                        </span>
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    {group.map(renderCard)}
                  </Fragment>
                );
              })
            : visibleCards.map(renderCard)}
        </div>
      )}

      <CardFormDialog
        open={formState !== null}
        card={formState?.card ?? null}
        onClose={() => setFormState(null)}
        onAdd={onAddCard}
        onUpdate={onUpdateCard}
      />

      <ViewCardDialog
        open={viewCardId !== null}
        cardId={viewCardId}
        visibleCards={visibleCards}
        onClose={() => setViewCardId(null)}
        onNavigate={setViewCardId}
        onEdit={startEditFromView}
        onDelete={handleDeleteFromView}
        onSetStatus={onSetStatus}
      />
    </div>
  );
}
