import type { Expense } from "@/types";
import { CATEGORY_MAP } from "@/lib/constants";

export function exportToCSV(expenses: Expense[], filename: string) {
  const headers = ["Date", "Category", "Description", "Amount"];
  const rows = expenses
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => [
      e.date,
      CATEGORY_MAP[e.category].label,
      `"${(e.description || CATEGORY_MAP[e.category].label).replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
    ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
