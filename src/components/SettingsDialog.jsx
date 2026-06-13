import { useRef } from "react";
import {
  Monitor,
  Palette,
  Download,
  Upload,
  Sun,
  Moon,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SECTION_LABEL =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";
const ROW = "flex items-center justify-between gap-3 border-b border-border/70 py-3";
const ROW_LABEL = "flex items-center gap-1.5 text-sm text-foreground/80";
const DATA_BUTTON = "w-36";

export default function SettingsDialog({
  open,
  onOpenChange,
  mode,
  colorTheme,
  onModeChange,
  onColorThemeChange,
  onImportFiles,
  onExport,
  onSeed,
  onClear,
  onLog,
}) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    if (e.target.files.length > 0) onImportFiles(e.target.files);
    e.target.value = ""; // reset so the same file can be re-imported
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {/* ── Style ───────────────────────────────────────────── */}
        <p className={SECTION_LABEL}>Style</p>

        <div className={ROW}>
          <span className={ROW_LABEL}>
            <Monitor className="size-4" />
            Display
          </span>
          <div className="flex gap-0.5 rounded-full border border-border bg-muted p-0.5">
            <ModeButton
              active={mode === "light"}
              label="Light mode"
              onClick={() => onModeChange("light")}
            >
              <Sun className="size-3.5" />
            </ModeButton>
            <ModeButton
              active={mode === "dark"}
              label="Dark mode"
              onClick={() => onModeChange("dark")}
            >
              <Moon className="size-3.5" />
            </ModeButton>
          </div>
        </div>

        <div className={ROW}>
          <span className={ROW_LABEL}>
            <Palette className="size-4" />
            Theme
          </span>
          <Select value={colorTheme} onValueChange={onColorThemeChange}>
            <SelectTrigger size="sm" aria-label="Color theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="obsidian">Obsidian</SelectItem>
              <SelectItem value="slate">Slate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Data ────────────────────────────────────────────── */}
        <p className={cn(SECTION_LABEL, "mt-4")}>Data</p>

        <div className={ROW}>
          <span className={ROW_LABEL}>
            <Download className="size-4" />
            Import
          </span>
          <Button
            variant="outline"
            className={DATA_BUTTON}
            onClick={() => fileInputRef.current?.click()}
          >
            Import .md file(s)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".md"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className={cn(ROW, "border-b-0")}>
          <span className={ROW_LABEL}>
            <Upload className="size-4" />
            Export
          </span>
          <Button variant="outline" className={DATA_BUTTON} onClick={onExport}>
            Export to .zip
          </Button>
        </div>

        {/* ── Developer ───────────────────────────────────────── */}
        <p className={cn(SECTION_LABEL, "mt-4")}>Developer</p>
        <div className={cn(ROW, "border-b-0")}>
          <span className={ROW_LABEL}>
            <Wrench className="size-4" />
            Sample data
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onSeed}>
              Seed
            </Button>
            <Button variant="secondary" size="sm" onClick={onClear}>
              Clear
            </Button>
            <Button variant="secondary" size="sm" onClick={onLog}>
              Log
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({ active, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-7 w-8 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
