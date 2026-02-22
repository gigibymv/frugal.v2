import { BudgetCard } from "./BudgetCard";
import { QuickAddExpense } from "./QuickAddExpense";
import { RecentExpenses } from "./RecentExpenses";
import { OneOffExpenses } from "./OneOffExpenses";

export function DashboardView() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <BudgetCard />
      </section>
      <section>
        <QuickAddExpense />
      </section>
      <section>
        <RecentExpenses />
      </section>
      <section>
        <OneOffExpenses />
      </section>
    </div>
  );
}

export default DashboardView;
