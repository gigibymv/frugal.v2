import { useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SettingsModal() {
  const show = useUIStore((s) => s.showSettingsModal);
  const toggle = useUIStore((s) => s.toggleSettingsModal);
  const displayName = useSettingsStore((s) => s.displayName);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const setWeekStartDay = useSettingsStore((s) => s.setWeekStartDay);

  const [name, setName] = useState(displayName);
  const [startDay, setStartDay] = useState(weekStartDay);

  useEffect(() => {
    if (show) {
      setName(displayName);
      setStartDay(weekStartDay);
    }
  }, [show, displayName, weekStartDay]);

  function handleSave() {
    setDisplayName(name.trim());
    setWeekStartDay(startDay);
    toggle(false);
  }

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) toggle(false); }}>
      <DialogContent className="retro-card sm:max-w-[380px] p-0 gap-0 border-2 border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-sm font-semibold text-foreground">
              Your Name
            </Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
            />
          </div>

          {/* Week Start Day */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Week Starts On</Label>
            <div className="flex gap-1">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setStartDay(i)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-colors ${
                    startDay === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            className="retro-btn w-full py-3 bg-primary text-primary-foreground font-semibold text-base"
          >
            Save Settings
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
