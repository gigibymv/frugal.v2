import type { Expense } from "@/types";
import { formatDateFull } from "@/lib/date-utils";
import { ExpenseItem } from "./ExpenseItem";

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-[#6B6B80] text-sm">No expenses yet</p>
        <p className="text-[#6B6B80]/60 text-xs mt-1">
          Tap "Add Expense" to get started
        </p>
      </div>
    );
  }

  // Group expenses by date
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    const key = expense.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(expense);
    return acc;
  }, {});

  // Sort date keys descending (newest first)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-[#6B6B80] uppercase tracking-wider mb-1 px-1">
            {formatDateFull(date)}
          </h3>
          <div className="divide-y divide-[#1A1A2E]/10">
            {grouped[date].map((expense) => (
              <ExpenseItem key={expense.id} expense={expense} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
