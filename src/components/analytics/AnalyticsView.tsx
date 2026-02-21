import { Download } from "lucide-react";
import { useWeekData } from "@/hooks/use-week-data";
import { useExpenseStore } from "@/store/expenseStore";
import { exportToCSV } from "@/lib/export";
import { SpendingSummary } from "./SpendingSummary";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { WeekOverWeekChart } from "./WeekOverWeekChart";

export function AnalyticsView() {
  const { expenses } = useWeekData();

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
      <div className="retro-card p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">
          Export Data
        </h3>
        <div className="flex gap-3">
          <button onClick={handleExportWeek} className="retro-btn flex items-center gap-2 text-sm">
            <Download size={16} />
            Export This Week
          </button>
          <button onClick={handleExportAll} className="retro-btn flex items-center gap-2 text-sm">
            <Download size={16} />
            Export All
          </button>
        </div>
      </div>
    </div>
  );
}
