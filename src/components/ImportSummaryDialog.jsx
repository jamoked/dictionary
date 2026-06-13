import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Visual config per result status. `color` styles both the count line and the
// per-file label; "failed" shows the failure reason instead of a label.
const STATUS_CONFIG = {
  added: { icon: "✓", label: "Added", color: "text-green-600 dark:text-green-400" },
  updated: { icon: "✓", label: "Updated", color: "text-blue-500 dark:text-blue-400" },
  failed: { icon: "✗", label: "Failed", color: "text-red-500 dark:text-red-400" },
  skipped: { icon: "—", label: "Skipped", color: "text-muted-foreground" },
};

// Order the summary counts are listed in.
const COUNT_ORDER = ["added", "updated", "failed", "skipped"];

// Shown after every import: a count summary plus a scrollable, alphabetically
// sorted per-file breakdown.
export default function ImportSummaryDialog({ open, results, onClose }) {
  const total = results.length;
  const counts = { added: 0, updated: 0, skipped: 0, failed: 0 };
  for (const r of results) counts[r.status]++;

  const sorted = [...results].sort((a, b) =>
    a.filename.localeCompare(b.filename)
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Summary</DialogTitle>
        </DialogHeader>

        <div className="text-sm">
          <span className="mb-1 block font-medium">
            {total} file{total === 1 ? "" : "s"} processed
          </span>
          {COUNT_ORDER.map((status) =>
            counts[status] > 0 ? (
              <span
                key={status}
                className={`block ${STATUS_CONFIG[status].color}`}
              >
                {counts[status]} {STATUS_CONFIG[status].label.toLowerCase()}
              </span>
            ) : null
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Details
          </p>
          <div className="thin-scrollbar flex max-h-52 flex-col overflow-y-auto rounded-lg border border-border bg-muted/40 p-3">
            {sorted.map(({ filename, status, reason }) => {
              const cfg = STATUS_CONFIG[status];
              const label = status === "failed" ? reason : cfg.label;
              return (
                <div key={filename} className="flex items-start gap-2 py-1">
                  <span className={`mt-0.5 flex-none text-xs font-bold ${cfg.color}`}>
                    {cfg.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs break-words text-foreground/80">
                      {filename}
                    </span>
                    <span className={`block text-xs ${cfg.color}`}>{label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
