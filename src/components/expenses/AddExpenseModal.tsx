import { useState } from "react";
import type { CategoryId } from "@/types";
import { todayISO } from "@/lib/date-utils";
import { useExpenseStore } from "@/store/expenseStore";
import { useUIStore } from "@/store/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "./CategoryPicker";

export function AddExpenseModal() {
  const showModal = useUIStore((s) => s.showAddExpenseModal);
  const toggleModal = useUIStore((s) => s.toggleAddExpenseModal);
  const addExpense = useExpenseStore((s) => s.addExpense);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());

  function resetForm() {
    setAmount("");
    setCategory(null);
    setDescription("");
    setDate(todayISO());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category) return;

    addExpense({
      amount: parsedAmount,
      category,
      description,
      date,
    });

    resetForm();
    toggleModal(false);
  }

  return (
    <Dialog
      open={showModal}
      onOpenChange={(open) => {
        if (!open) resetForm();
        toggleModal(open);
      }}
    >
      <DialogContent className="retro-card sm:max-w-[420px] p-0 gap-0 border-2 border-[#1A1A2E]">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-[#1A1A2E]">
            Add Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-[#1A1A2E]">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono-nums text-[#6B6B80]">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-3xl font-mono-nums h-16 border-2 border-[#1A1A2E] rounded-xl bg-white focus-visible:ring-[#2D9E8F]"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#1A1A2E]">Category</Label>
            <CategoryPicker selected={category} onSelect={setCategory} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-[#1A1A2E]">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2 border-[#1A1A2E] rounded-xl bg-white focus-visible:ring-[#2D9E8F]"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold text-[#1A1A2E]">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-2 border-[#1A1A2E] rounded-xl bg-white focus-visible:ring-[#2D9E8F]"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!amount || !category}
            className="retro-btn w-full py-3 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#2D9E8F" }}
          >
            Add Expense
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
