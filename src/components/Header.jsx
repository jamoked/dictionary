import { Settings } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sticky top bar: title, the Learn/Review tab switch, and the settings gear.
// pt-[env(safe-area-inset-top)] keeps the bar clear of the iOS notch / status bar.
export default function Header({ onOpenSettings }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <span className="text-lg font-semibold tracking-tight">Dictionary</span>

        <TabsList>
          <TabsTrigger value="learn" className="px-4">
            Learn
          </TabsTrigger>
          <TabsTrigger value="review" className="px-4">
            Review
          </TabsTrigger>
        </TabsList>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
}
