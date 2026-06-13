import { STATUSES } from "@/lib/validate";
import { cn } from "@/lib/utils";

// The three traffic-light status buttons shown on a card (list + view dialog).
// Active status = solid fill; the others = a thin colored outline.
export default function StatusDots({ status, onSetStatus }) {
  return (
    <div className="flex justify-end gap-1.5">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          // stopPropagation so clicking a dot on a list card doesn't also open
          // the card's view dialog.
          onClick={(e) => {
            e.stopPropagation();
            onSetStatus(s.value);
          }}
          className={cn(
            "dot-tap-target h-3.5 w-3.5 rounded transition-colors",
            status === s.value ? s.fill : cn("border", s.border)
          )}
          title={s.label}
          aria-label={`Mark as ${s.label}`}
          aria-pressed={status === s.value}
        />
      ))}
    </div>
  );
}
