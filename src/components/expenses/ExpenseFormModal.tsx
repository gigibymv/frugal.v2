import { useEffect, useState } from "react";
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

export function ExpenseFormModal() {
  const showAddModal = useUIStore((s) => s.showAddExpenseModal);
  const toggleAddModal = useUIStore((s) => s.toggleAddExpenseModal);
  const editingExpense = useUIStore((s) => s.editingExpense);
  const setEditingExpense = useUIStore((s) => s.setEditingExpense);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const editExpense = useExpenseStore((s) => s.editExpense);

  const isEditing = editingExpense !== null;
  const isOpen = showAddModal || isEditing;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setDate(editingExpense.date);
    }
  }, [editingExpense]);

  function resetForm() {
    setAmount("");
    setCategory(null);
    setDescription("");
    setDate(todayISO());
    setError("");
  }

  function handleClose() {
    resetForm();
    if (isEditing) {
      setEditingExpense(null);
    } else {
      toggleAddModal(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than $0");
      return;
    }
    if (!category) {
      setError("Please select a category");
      return;
    }
    setError("");

    const data = {
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      description: description.slice(0, 100),
      date,
    };

    if (isEditing) {
      editExpense(editingExpense.id, data);
    } else {
      addExpense(data);
    }

    handleClose();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="retro-card sm:max-w-[420px] p-0 gap-0 border-2 border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-foreground">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono-nums text-muted-foreground">
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
                className="pl-10 text-3xl font-mono-nums h-16 border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Category</Label>
            <CategoryPicker selected={category} onSelect={setCategory} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-foreground">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold text-foreground">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="retro-btn w-full py-3 bg-primary text-primary-foreground font-semibold text-base"
          >
            {isEditing ? "Save Changes" : "Add Expense"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
