import { useState } from "react";
import { Plus } from "lucide-react";
import { useExpenseStore } from "@/store/expenseStore";
import { CATEGORIES } from "@/lib/constants";
import { todayISO } from "@/lib/date-utils";
import type { CategoryId } from "@/types";

export function QuickAddExpense() {
  const addExpense = useExpenseStore((s) => s.addExpense);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("dining");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0) return;

    addExpense({
      amount: parsed,
      category: selectedCategory,
      description: description.trim() || CATEGORIES.find((c) => c.id === selectedCategory)!.label,
      date: todayISO(),
    });

    setAmount("");
    setDescription("");
  };

  return (
    <div className="retro-card p-4">
      <h3 className="font-bold text-sm mb-3">Quick Add</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Category badges */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                selectedCategory === cat.id
                  ? "border-foreground scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              style={{
                backgroundColor: cat.bgColor,
                color: cat.color,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Inputs row */}
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            placeholder="$0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 shrink-0 px-3 py-2 rounded-lg border-2 border-foreground bg-card font-mono-nums text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border-2 border-foreground bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className="retro-btn px-4 py-2 bg-primary text-primary-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
