import { useMemo } from "react";
import { Download } from "lucide-react";
import { useWeekData } from "@/hooks/use-week-data";
import { useExpenseStore } from "@/store/expenseStore";
import { useOneOffExpenseStore } from "@/store/oneOffExpenseStore";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore";
import { exportToCSV } from "@/lib/export";
import { formatCurrency, getWeekRange } from "@/lib/date-utils";
import { SpendingSummary } from "./SpendingSummary";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { WeekOverWeekChart } from "./WeekOverWeekChart";

export function AnalyticsView() {
  const { expenses } = useWeekData();
  const selectedWeekOffset = useUIStore((s) => s.selectedWeekOffset);
  const weekStartDay = useSettingsStore((s) => s.weekStartDay);
  const allOneOff = useOneOffExpenseStore((s) => s.oneOffExpenses);

  const oneOffTotal = useMemo(() => {
    const { start, end } = getWeekRange(selectedWeekOffset, weekStartDay as 0|1|2|3|4|5|6);
    return allOneOff
      .filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [allOneOff, selectedWeekOffset, weekStartDay]);

  const today = new Date().toISOString().slice(0, 10);

  const handleExportWeek = () => {
    exportToCSV(expenses, `frugal-expenses-this-week-${today}`);
  };

  const handleExportAll = () => {
    const allExpenses = useExpenseStore.getState().expenses;
    exportToCSV(allExpenses, `frugal-expenses-all-${today}`);
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="retro-card p-8 text-center max-w-sm">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-muted-foreground text-sm">
            Add some expenses to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SpendingSummary />
      <CategoryBreakdown />
      <WeekOverWeekChart />
      {oneOffTotal > 0 && (
        <div className="retro-card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-2">
            One-off This Week
          </h3>
          <p className="font-mono-nums text-2xl font-bold text-foreground">
            {formatCurrency(oneOffTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Not counted toward weekly budget
          </p>
        </div>
      )}
      <div className="retro-card p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
          Export Data
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExportWeek} className="retro-btn flex-1 flex items-center justify-center gap-2 text-sm px-4 py-3">
            <Download size={16} />
            Export This Week
          </button>
          <button onClick={handleExportAll} className="retro-btn flex-1 flex items-center justify-center gap-2 text-sm px-4 py-3">
            <Download size={16} />
            Export All
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;
