import type { Expense } from "@/types";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatCurrency, formatDateFull } from "@/lib/date-utils";
import { useExpenseStore } from "@/store/expenseStore";
import { useUIStore } from "@/store/uiStore";
import { Trash2 } from "lucide-react";
import {
  ShoppingCart,
  Car,
  Gamepad2,
  UtensilsCrossed,
  Receipt,
  Heart,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Car,
  Gamepad2,
  UtensilsCrossed,
  Receipt,
  Heart,
  ShoppingBag,
  MoreHorizontal,
};

interface ExpenseItemProps {
  expense: Expense;
}

export function ExpenseItem({ expense }: ExpenseItemProps) {
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const setEditingExpense = useUIStore((s) => s.setEditingExpense);
  const cat = CATEGORY_MAP[expense.category];
  const Icon = ICON_MAP[cat.icon];

  return (
    <div className="group flex items-center gap-3 py-3 px-1">
      <button
        type="button"
        onClick={() => setEditingExpense(expense)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
          style={{ backgroundColor: cat.bgColor }}
        >
          {Icon && <Icon size={18} style={{ color: cat.color }} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {expense.description || cat.label}
          </p>
          <p className="text-xs text-muted-foreground">{formatDateFull(expense.date)}</p>
        </div>

        <span className="font-mono-nums text-sm font-semibold text-foreground shrink-0">
          {formatCurrency(expense.amount)}
        </span>
      </button>

      <button
        type="button"
        onClick={() => deleteExpense(expense.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-[#E74C3C] shrink-0"
        aria-label="Delete expense"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
