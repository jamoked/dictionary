import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as storage from "@/lib/storage";
import { validateWord, POS_OPTIONS, MAX_DEFINITION_LENGTH } from "@/lib/validate";

const EMPTY_ERRORS = { word: "", pos: "", definition: "" };

// Add / edit form. The same dialog handles both: when `card` is provided it
// pre-fills for editing, otherwise it's a blank "add" form. Validation matches
// the original app exactly, including the duplicate confirm on add.
export default function CardFormDialog({ open, card, onClose, onAdd, onUpdate }) {
  const editing = Boolean(card);
  const [word, setWord] = useState("");
  const [pos, setPos] = useState("");
  const [definition, setDefinition] = useState("");
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  // Reset the fields whenever the dialog opens (with or without a card to edit).
  useEffect(() => {
    if (open) {
      setWord(card?.word ?? "");
      setPos(card?.partOfSpeech ?? "");
      setDefinition(card?.definition ?? "");
      setErrors(EMPTY_ERRORS);
    }
  }, [open, card]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedWord = word.trim();
    const trimmedDefinition = definition.trim();

    if (!trimmedWord || !trimmedDefinition) return;

    if (!pos) {
      setErrors({ ...EMPTY_ERRORS, pos: "Please select a part of speech." });
      return;
    }

    const wordValidationError = validateWord(trimmedWord);
    if (wordValidationError) {
      setErrors({ ...EMPTY_ERRORS, word: wordValidationError });
      return;
    }

    if (trimmedDefinition.length > MAX_DEFINITION_LENGTH) {
      setErrors({
        ...EMPTY_ERRORS,
        definition: "Definition must be 200 characters or fewer.",
      });
      return;
    }

    const data = {
      word: trimmedWord,
      partOfSpeech: pos,
      definition: trimmedDefinition,
    };

    if (editing) {
      onUpdate(card.id, data);
      onClose();
      return;
    }

    // Duplicate check: only warn if the same word + part of speech already exists.
    const duplicate = storage.findDuplicate(trimmedWord, pos);
    if (duplicate) {
      const proceed = confirm(
        `A card for "${duplicate.word}" (${duplicate.partOfSpeech}) already exists.\n\nAdd another one anyway?`
      );
      if (!proceed) return;
    }

    onAdd(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit card" : "Add a card"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="input-word">Word</Label>
            <Input
              id="input-word"
              value={word}
              autoFocus
              placeholder="e.g. ephemeral"
              onChange={(e) => {
                setWord(e.target.value);
                if (errors.word) setErrors((p) => ({ ...p, word: "" }));
              }}
              aria-invalid={Boolean(errors.word)}
            />
            {errors.word && (
              <p className="text-xs text-destructive">{errors.word}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="input-pos">Part of speech</Label>
            <Select
              value={pos}
              onValueChange={(value) => {
                setPos(value);
                if (errors.pos) setErrors((p) => ({ ...p, pos: "" }));
              }}
            >
              <SelectTrigger
                id="input-pos"
                className="w-full"
                aria-invalid={Boolean(errors.pos)}
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {POS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pos && (
              <p className="text-xs text-destructive">{errors.pos}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="input-definition">Definition</Label>
            <Textarea
              id="input-definition"
              rows={2}
              value={definition}
              placeholder="e.g. lasting for a very short time"
              className="resize-none"
              onChange={(e) => {
                setDefinition(e.target.value);
                if (errors.definition)
                  setErrors((p) => ({ ...p, definition: "" }));
              }}
              aria-invalid={Boolean(errors.definition)}
            />
            {errors.definition && (
              <p className="text-xs text-destructive">{errors.definition}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit">
              {editing ? "Save changes" : "Add card"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
