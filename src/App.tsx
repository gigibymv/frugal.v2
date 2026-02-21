import { useUIStore } from "@/store/uiStore";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { WeekNavigator } from "@/components/dashboard/WeekNavigator";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ExpensesView } from "@/components/expenses/ExpensesView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { EditBudgetModal } from "@/components/budget/EditBudgetModal";

function ActiveView() {
  const activeTab = useUIStore((s) => s.activeTab);

  switch (activeTab) {
    case "dashboard":
      return <DashboardView />;
    case "expenses":
      return <ExpensesView />;
    case "analytics":
      return <AnalyticsView />;
    default:
      return <DashboardView />;
  }
}

export default function App() {
  return (
    <>
      <Header />
      <AppShell>
        <WeekNavigator />
        <ActiveView />
      </AppShell>
      <TabBar />
      <AddExpenseModal />
      <EditBudgetModal />
    </>
  );
}
