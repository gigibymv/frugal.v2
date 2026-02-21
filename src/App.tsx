import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { syncFromRemote } from "@/lib/sync";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { WeekNavigator } from "@/components/dashboard/WeekNavigator";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ExpensesView } from "@/components/expenses/ExpensesView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { EditBudgetModal } from "@/components/budget/EditBudgetModal";
import { AuthModal } from "@/components/auth/AuthModal";

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
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync from remote when user logs in
  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      prevUserId.current = user.id;
      syncFromRemote(user.id);
    }
    if (!user) {
      prevUserId.current = null;
    }
  }, [user]);

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
      <AuthModal />
    </>
  );
}
