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
import { AuthPage } from "@/components/auth/AuthPage";

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
  const authLoading = useAuthStore((s) => s.loading);
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

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-[#1A1A2E]">
            Frugal
          </h1>
          <div className="w-6 h-6 border-2 border-[#2D9E8F] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

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
