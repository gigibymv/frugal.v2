import { lazy, Suspense, useEffect, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { syncFromRemote } from "@/lib/sync";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { TabBar } from "@/components/layout/TabBar";
import { WeekNavigator } from "@/components/dashboard/WeekNavigator";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { EditBudgetModal } from "@/components/budget/EditBudgetModal";
import { AuthPage } from "@/components/auth/AuthPage";

const DashboardView = lazy(() => import("@/components/dashboard/DashboardView"));
const ExpensesView = lazy(() => import("@/components/expenses/ExpensesView"));
const AnalyticsView = lazy(() => import("@/components/analytics/AnalyticsView"));

const ViewSpinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ActiveView() {
  const activeTab = useUIStore((s) => s.activeTab);

  return (
    <Suspense fallback={<ViewSpinner />}>
      {activeTab === "expenses" ? (
        <ExpensesView />
      ) : activeTab === "analytics" ? (
        <AnalyticsView />
      ) : (
        <DashboardView />
      )}
    </Suspense>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Apply dark mode class to document
  useEffect(() => {
    const applyDark = (dark: boolean) => {
      document.documentElement.classList.toggle("dark", dark);
    };
    applyDark(useUIStore.getState().darkMode);
    const unsub = useUIStore.subscribe(
      (state) => state.darkMode,
      (dark) => applyDark(dark),
    );
    return unsub;
  }, []);

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
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Frugal
          </h1>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
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
      <ExpenseFormModal />
      <EditBudgetModal />
    </>
  );
}
