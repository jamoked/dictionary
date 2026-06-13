import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Shown during import when one or more files match existing cards. The user
// checks the ones to overwrite; `onResolve` receives the chosen indices.
// Escape / "Skip all" resolve with an empty selection (overwrite nothing).
export default function ImportDuplicatesDialog({ open, duplicates, onResolve }) {
  // Default: every duplicate checked (overwrite), matching the original.
  const [checked, setChecked] = useState(() => duplicates.map(() => true));

  useEffect(() => {
    setChecked(duplicates.map(() => true));
  }, [duplicates]);

  function toggle(i) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function confirm() {
    onResolve(duplicates.map((_, i) => i).filter((i) => checked[i]));
  }

  const count = duplicates.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onResolve([])}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {count} duplicate word{count === 1 ? "" : "s"} found
          </DialogTitle>
          <DialogDescription>
            These words already exist. Check the ones you want to overwrite.
          </DialogDescription>
        </DialogHeader>

        <div className="thin-scrollbar flex max-h-64 flex-col gap-2 overflow-y-auto pr-0.5">
          {duplicates.map((dup, i) => (
            <label
              key={dup.parsed.filename + i}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 p-3 hover:bg-muted/50"
            >
              <Checkbox
                checked={checked[i]}
                onCheckedChange={() => toggle(i)}
                className="mt-0.5"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {dup.parsed.word}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({dup.parsed.partOfSpeech})
                  </span>
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Existing: {dup.existing.definition}
                </span>
                <span className="truncate text-xs text-foreground/80">
                  New: {dup.parsed.definition}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => onResolve([])}>
            Skip all
          </Button>
          <Button onClick={confirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
