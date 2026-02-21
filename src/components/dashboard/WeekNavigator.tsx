import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { formatWeekLabel, getWeekRange } from "@/lib/date-utils";
import { format } from "date-fns";

export function WeekNavigator() {
  const selectedWeekOffset = useUIStore((s) => s.selectedWeekOffset);
  const setWeekOffset = useUIStore((s) => s.setWeekOffset);

  const label = formatWeekLabel(selectedWeekOffset);
  const { start, end } = getWeekRange(selectedWeekOffset);
  const dateRange = `${format(start, "MMM d")} – ${format(end, "MMM d")}`;

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setWeekOffset(selectedWeekOffset - 1)}
          className="retro-btn p-2 bg-card hover:bg-muted"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-lg font-bold min-w-[140px] text-center">
          {label}
        </span>

        <button
          onClick={() => setWeekOffset(selectedWeekOffset + 1)}
          disabled={selectedWeekOffset >= 0}
          className="retro-btn p-2 bg-card hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <span className="text-sm text-muted-foreground font-medium">
        {dateRange}
      </span>
    </div>
  );
}
