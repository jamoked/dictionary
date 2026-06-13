import { STATUSES } from "@/lib/validate";
import { cn } from "@/lib/utils";

// The three multi-select filter dots, used by both the Learn and Review tabs.
// `active` is a Set of selected statuses; `onToggle(status)` flips one. The
// "always keep at least one active" rule lives in each tab's toggle handler.
export default function StatusFilterDots({ active, onToggle }) {
  return (
    <>
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onToggle(s.value)}
          className={cn(
            "dot-tap-target h-4 w-4 rounded transition-colors",
            active.has(s.value) ? s.fill : cn("border", s.border)
          )}
          title={s.label}
          aria-label={`Filter: ${s.label}`}
          aria-pressed={active.has(s.value)}
        />
      ))}
    </>
  );
}
