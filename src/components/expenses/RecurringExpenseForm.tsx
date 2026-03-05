import { useEffect, useState } from "react";
import type { CategoryId, RecurringExpense } from "@/types";
import { todayISO } from "@/lib/date-utils";
import { useRecurringExpenseStore } from "@/store/recurringExpenseStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryPicker } from "./CategoryPicker";

interface RecurringExpenseFormProps {
  open: boolean;
  onClose: () => void;
  editing: RecurringExpense | null;
}

const FREQUENCIES = [
  { value: "weekly" as const, label: "Weekly" },
  { value: "biweekly" as const, label: "Biweekly" },
  { value: "monthly" as const, label: "Monthly" },
];

export function RecurringExpenseForm({ open, onClose, editing }: RecurringExpenseFormProps) {
  const addRecurring = useRecurringExpenseStore((s) => s.addRecurring);
  const editRecurring = useRecurringExpenseStore((s) => s.editRecurring);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurringExpense["frequency"]>("monthly");
  const [startDate, setStartDate] = useState(todayISO());
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDescription(editing.description);
      setFrequency(editing.frequency);
      setStartDate(editing.startDate);
    }
  }, [editing]);

  function resetForm() {
    setAmount("");
    setCategory(null);
    setDescription("");
    setFrequency("monthly");
    setStartDate(todayISO());
    setError("");
  }

  function handleClose() {
    resetForm();
    onClose();
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

    const roundedAmount = Math.round(parsedAmount * 100) / 100;

    if (editing) {
      editRecurring(editing.id, {
        amount: roundedAmount,
        category,
        description: description.slice(0, 100),
        frequency,
        startDate,
      });
    } else {
      addRecurring({
        amount: roundedAmount,
        category,
        description: description.slice(0, 100),
        frequency,
        startDate,
        active: true,
      });
    }

    handleClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="retro-card sm:max-w-[420px] p-0 gap-0 border-2 border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-foreground">
            {editing ? "Edit Recurring Expense" : "Add Recurring Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="rec-amount" className="text-sm font-semibold text-foreground">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono-nums text-muted-foreground">
                $
              </span>
              <Input
                id="rec-amount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
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
            <Label htmlFor="rec-description" className="text-sm font-semibold text-foreground">
              Description
            </Label>
            <Input
              id="rec-description"
              type="text"
              placeholder="e.g. Netflix subscription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              className="border-2 border-border rounded-xl bg-card focus-visible:ring-primary"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Frequency</Label>
            <div className="flex gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                    frequency === f.value
                      ? "border-foreground bg-foreground text-background shadow-[2px_2px_0px_var(--foreground)]"
                      : "border-foreground/20 text-foreground hover:border-foreground/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="rec-start-date" className="text-sm font-semibold text-foreground">
              Start Date
            </Label>
            <Input
              id="rec-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
            {editing ? "Save Changes" : "Add Recurring Expense"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
