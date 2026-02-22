import { useEffect, useState } from "react";
import type { OneOffCategoryId } from "@/types";
import { todayISO } from "@/lib/date-utils";
import { useOneOffExpenseStore } from "@/store/oneOffExpenseStore";
import { useUIStore } from "@/store/uiStore";
import { ONEOFF_CATEGORIES } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function OneOffExpenseFormModal() {
  const showModal = useUIStore((s) => s.showOneOffExpenseModal);
  const toggleModal = useUIStore((s) => s.toggleOneOffExpenseModal);
  const editingExpense = useUIStore((s) => s.editingOneOffExpense);
  const setEditingExpense = useUIStore((s) => s.setEditingOneOffExpense);
  const addExpense = useOneOffExpenseStore((s) => s.addOneOffExpense);
  const editExpense = useOneOffExpenseStore((s) => s.editOneOffExpense);

  const isEditing = editingExpense !== null;
  const isOpen = showModal || isEditing;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<OneOffCategoryId | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());

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
  }

  function handleClose() {
    resetForm();
    if (isEditing) {
      setEditingExpense(null);
    } else {
      toggleModal(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category) return;
    const data = { amount: parsedAmount, category, description, date };
    if (isEditing) {
      editExpense(editingExpense.id, data);
    } else {
      addExpense(data);
    }
    handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="retro-card sm:max-w-[420px] p-0 gap-0 border-2 border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">
            {isEditing ? "Edit One-off Expense" : "Add One-off Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="oneoff-amount" className="text-sm font-semibold text-foreground">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono-nums text-muted-foreground">$</span>
              <Input
                id="oneoff-amount"
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
            <div className="grid grid-cols-5 gap-2">
              {ONEOFF_CATEGORIES.map((cat) => {
                const Icon = Icons[cat.icon as keyof typeof Icons] as LucideIcon | undefined;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cat.bgColor }}
                    >
                      {Icon && <Icon size={16} style={{ color: cat.color }} />}
                    </div>
                    <span className="text-[10px] font-semibold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="oneoff-desc" className="text-sm font-semibold text-foreground">Description</Label>
            <Input
              id="oneoff-desc"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="oneoff-date" className="text-sm font-semibold text-foreground">Date</Label>
            <Input
              id="oneoff-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!amount || !category}
            className="retro-btn w-full py-3 bg-primary text-primary-foreground font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? "Save Changes" : "Add Expense"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
