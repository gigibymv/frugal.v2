import { create } from "zustand";
import { snapshotSchema, type BudgetSnapshot } from "../../shared/snapshot";
import { applyBudgetData, emptyBudgetData, readBudgetData, subscribeBudgetData } from "@/lib/budget-data";
import { useRecurringExpenseStore } from "@/store/recurringExpenseStore";
import { useUIStore } from "@/store/uiStore";

type SyncStatus = "idle" | "loading" | "pending" | "ready" | "saving" | "offline" | "conflict" | "session-changed" | "invalid" | "error";
interface SyncState { status: SyncStatus; ready: boolean; message: string | null }
export const useSyncStore = create<SyncState>()(() => ({ status: "idle", ready: false, message: null }));
interface Mutation { mutationId: string; revision: number; data: BudgetSnapshot }
interface Draft { updatedAt?: string; revision: number; data: BudgetSnapshot; mutation: Mutation | null }
let owner: string | null = null;
let epoch = 0;
let revision = 0;
let pending: Mutation | null = null;
let dirty = false;
let inFlight = false;
let draftStored = false;
let unsubscribe: (() => void) | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const requests = new Set<AbortController>();
// Every document has a unique draft key, including duplicated tabs. A per-tab
// pointer permits reload recovery without letting another tab delete that draft.
const tabId = crypto.randomUUID();
export const draftKey = (userId: string) => `frugal:account-draft:${userId}:${tabId}`;
const memoryDrafts = new Map<string, Draft>();
let invalidDraft = false;
const pointerKey = (userId: string) => `frugal:draft-pointer:${userId}`;
function storedDraft(userId: string) {
  const own = localStorage.getItem(draftKey(userId));
  if (own) return own;
  let previous: string | null = null;
  try { previous = sessionStorage.getItem(pointerKey(userId)); } catch { /* No reload pointer. */ }
  return previous?.startsWith(`frugal:account-draft:${userId}:`) ? localStorage.getItem(previous) : null;
}
class InvalidDraftError extends Error {}
export function rejectedDraftArchive(): string | null {
  if (!invalidDraft || !owner) return null;
  try { return JSON.stringify(memoryDrafts.get(owner) ?? JSON.parse(storedDraft(owner) || "null")); }
  catch { return storedDraft(owner); }
}
const current = (userId: string, generation: number) => owner === userId && epoch === generation;
function writeDraft() {
  if (!owner) return;
  const draft: Draft = { updatedAt: new Date().toISOString(), revision, data: readBudgetData(), mutation: pending };
  memoryDrafts.set(owner, draft);
  try {
    localStorage.setItem(draftKey(owner), JSON.stringify(draft));
    draftStored = true;
    try { sessionStorage.setItem(pointerKey(owner), draftKey(owner)); } catch { /* Copy remains downloadable in this tab. */ }
  } catch {
    draftStored = false;
    useSyncStore.setState({ message: "This browser could not keep an offline copy. Keep this tab open until your changes are saved." });
  }
}
function readDraft(userId: string): Draft | null {
  try {
    const draft = memoryDrafts.get(userId) ?? JSON.parse(storedDraft(userId) || "null");
    if (!draft || !Number.isSafeInteger(draft.revision) || draft.revision < 0) return null;
    const checked = snapshotSchema.safeParse(draft.data);
    if (!checked.success) throw new InvalidDraftError("Invalid retained draft");
    const data = checked.data;
    let mutation: Mutation | null = null;
    if (draft.mutation) {
      if (typeof draft.mutation.mutationId !== "string" || draft.mutation.mutationId.length > 128 || draft.mutation.revision !== draft.revision) return null;
      mutation = { mutationId: draft.mutation.mutationId, revision: draft.mutation.revision, data: snapshotSchema.parse(draft.mutation.data) };
    }
    return { revision: draft.revision, data, mutation };
  } catch (error) {
    if (error instanceof InvalidDraftError) throw error;
    return null;
  }
}
class StateRequestError extends Error {
  readonly status: number;
  constructor(status: number) { super(`Account request failed (${status})`); this.status = status; }
}
async function stateRequest(userId: string, mutation?: Mutation) {
  const controller = new AbortController();
  requests.add(controller);
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`/api/state?ownerId=${encodeURIComponent(userId)}`, {
      method: mutation ? "PUT" : "GET", credentials: "same-origin", cache: "no-store",
      headers: mutation ? { "Content-Type": "application/json" } : undefined,
      body: mutation ? JSON.stringify({ ownerId: userId, ...mutation }) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new StateRequestError(response.status);
    const result = await response.json();
    if (!Number.isSafeInteger(result.revision) || result.revision < 0) throw new Error("Invalid account response");
    return { revision: result.revision as number, data: result.data === null || result.data === undefined ? null : snapshotSchema.parse(result.data) };
  } finally { clearTimeout(timeout); requests.delete(controller); }
}
export function stopBudgetSync() {
  if (owner && dirty) writeDraft();
  epoch++;
  owner = null;
  unsubscribe?.(); unsubscribe = undefined;
  clearTimeout(saveTimer);
  for (const request of requests) request.abort();
  requests.clear();
  pending = null; dirty = false; inFlight = false; draftStored = false; invalidDraft = false; revision = 0;
  applyBudgetData(emptyBudgetData());
  useUIStore.setState({ activeTab: "dashboard", selectedWeekOffset: 0, showSettingsModal: false, showAddExpenseModal: false, showEditBudgetModal: false, showOneOffExpenseModal: false, editingExpense: null, editingOneOffExpense: null });
  useSyncStore.setState({ status: "idle", ready: false, message: null });
}
function scheduleSave() {
  clearTimeout(saveTimer);
  if (["conflict", "session-changed"].includes(useSyncStore.getState().status)) return;
  saveTimer = setTimeout(() => { void saveBudgetData(); }, 500);
}
export async function saveBudgetData() {
  if (!owner || !dirty || inFlight || !useSyncStore.getState().ready) return;
  if (["conflict", "session-changed"].includes(useSyncStore.getState().status)) return;
  const userId = owner, generation = epoch;
  const parsed = snapshotSchema.safeParse(readBudgetData());
  if (!parsed.success) {
    pending = null; writeDraft();
    useSyncStore.setState({ status: "invalid", message: "Some budget data is invalid. Correct the amount or date, then retry. Your draft can be downloaded below." });
    return;
  }
  inFlight = true;
  pending ??= { mutationId: crypto.randomUUID(), revision, data: readBudgetData() };
  const sent = pending;
  writeDraft();
  useSyncStore.setState({ status: "saving", message: null });
  try {
    const result = await stateRequest(userId, sent);
    if (!current(userId, generation)) return;
    revision = result.revision;
    pending = null;
    dirty = JSON.stringify(readBudgetData()) !== JSON.stringify(sent.data);
    if (dirty) writeDraft();
    else {
      memoryDrafts.delete(userId);
      try {
        localStorage.removeItem(draftKey(userId));
        sessionStorage.removeItem(pointerKey(userId));
      } catch { /* Saved remotely. */ }
    }
    useSyncStore.setState({ status: dirty ? "pending" : "ready", message: null });
  } catch (error) {
    if (!current(userId, generation)) return;
    if (error instanceof StateRequestError && (error.status === 401 || error.status === 403)) {
      useSyncStore.setState({ status: "session-changed", message: draftStored ? "Your session changed. Your unsaved draft is kept for this account. Sign in again to continue." : "Your session changed. Download your unsaved draft before checking your session." });
    } else if (error instanceof StateRequestError && error.status === 400) {
      // A rejected request did not commit; do not pin retries to this bad payload.
      pending = null; writeDraft();
      useSyncStore.setState({ status: "invalid", message: "The budget was rejected. Check amounts, dates and data size, then retry. Your unsaved draft is preserved." });
    } else if (error instanceof StateRequestError && error.status === 409) {
      useSyncStore.setState({ status: "conflict", message: "Your account changed on another device. Download your draft before loading the saved version." });
    } else {
      useSyncStore.setState({ status: "offline", message: draftStored ? "Changes are not saved to your account yet. Your draft stays in this browser; retry when connected." : "Changes are not saved. Keep this tab open, download your draft and retry when connected." });
    }
  } finally {
    if (current(userId, generation)) {
      inFlight = false;
      if (dirty && ["ready", "pending"].includes(useSyncStore.getState().status)) scheduleSave();
    }
  }
}
export async function startBudgetSync(userId: string, discardDraft = false) {
  stopBudgetSync();
  owner = userId;
  const generation = epoch;
  useSyncStore.setState({ status: "loading", ready: false, message: null });
  try {
    const remote = await stateRequest(userId);
    if (!current(userId, generation)) return;
    const draft = discardDraft ? null : readDraft(userId);
    revision = draft?.revision ?? remote.revision;
    pending = draft?.mutation ?? null;
    dirty = Boolean(draft);
    draftStored = Boolean(draft);
    applyBudgetData(draft?.data ?? remote.data ?? emptyBudgetData());
    if (discardDraft) {
      memoryDrafts.delete(userId);
      try { localStorage.removeItem(draftKey(userId)); sessionStorage.removeItem(pointerKey(userId)); }
      catch { /* Remote state loaded. */ }
    }
    const conflict = draft && !pending && draft.revision !== remote.revision;
    useSyncStore.setState({ status: conflict ? "conflict" : dirty ? "pending" : "ready", ready: true, message: conflict ? "Your account changed on another device. Download your draft before loading the saved version." : null });
    subscribeToChanges();
    if (!conflict) {
      useRecurringExpenseStore.getState().generateDueExpenses();
      if (dirty) scheduleSave();
    }
  } catch (error) {
    if (!current(userId, generation)) return;
    let cached: Draft | null;
    try { cached = readDraft(userId); }
    catch (draftError) {
      if (draftError instanceof InvalidDraftError) {
        invalidDraft = true;
        useSyncStore.setState({ status: "invalid", ready: false, message: "A retained draft contains invalid data. Download it before loading the saved account version." });
        return;
      }
      throw draftError;
    }
    if (cached) {
      applyBudgetData(cached.data);
      dirty = true; draftStored = true; revision = cached.revision; pending = cached.mutation;
    }
    const changed = error instanceof StateRequestError && (error.status === 401 || error.status === 403);
    useSyncStore.setState({ status: changed ? "session-changed" : "error", ready: false, message: changed ? "Your session changed. Sign in again to load your account." : "Could not load your saved budget. Check your connection and retry." });
  }
}
export function reloadSavedBudget() { if (owner) void startBudgetSync(owner, true); }
export function retryBudgetSync() {
  if (!owner) return;
  if (useSyncStore.getState().ready) void saveBudgetData();
  else void startBudgetSync(owner);
}
export async function refreshBudgetSync() {
  if (!owner || !useSyncStore.getState().ready) return;
  if (["conflict", "session-changed", "invalid"].includes(useSyncStore.getState().status)) return;
  if (dirty || inFlight) { await saveBudgetData(); return; }
  const ui = useUIStore.getState();
  if (ui.showAddExpenseModal || ui.showOneOffExpenseModal || ui.showEditBudgetModal || ui.showSettingsModal || ui.editingExpense || ui.editingOneOffExpense) return;
  const userId = owner, generation = epoch;
  try {
    const remote = await stateRequest(userId);
    if (!current(userId, generation) || dirty || inFlight) return;
    if (remote.revision !== revision) {
      unsubscribe?.(); unsubscribe = undefined;
      revision = remote.revision;
      applyBudgetData(remote.data ?? emptyBudgetData());
      subscribeToChanges();
    }
    useRecurringExpenseStore.getState().generateDueExpenses();
  } catch {
    // Background refresh is optional. Keep the current account and open forms.
  }
}

export function canLeaveBudgetDraft() { return !dirty || draftStored; }

function subscribeToChanges() {
  unsubscribe = subscribeBudgetData(() => {
      dirty = true;
      if (!["conflict", "session-changed"].includes(useSyncStore.getState().status)) useSyncStore.setState({ status: "pending", message: null });
      writeDraft(); scheduleSave();
    });
}

export function restoreBudgetData(data: BudgetSnapshot) {
  if (!owner || !useSyncStore.getState().ready || inFlight || pending ||
      ["conflict", "session-changed"].includes(useSyncStore.getState().status)) {
    throw new Error("Finish saving or load the saved version before restoring a backup.");
  }
  const checked = snapshotSchema.parse(data);
  invalidDraft = false;
  applyBudgetData(checked);
  dirty = true;
  writeDraft(); scheduleSave();
}


export function archivedBrowserDrafts(userId: string): { key: string; updatedAt: string | null }[] {
  // Explicit recovery across closed tabs: list other copies, never auto-adopt a
  // snapshot that could still belong to another live tab or already be saved.
  const drafts: { key: string; updatedAt: string | null }[] = [];
  try {
    const pointer = sessionStorage.getItem(pointerKey(userId));
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(`frugal:account-draft:${userId}:`) || key === draftKey(userId) || key === pointer) continue;
      let updatedAt: string | null = null;
      try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        if (typeof value?.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt))) updatedAt = value.updatedAt;
      } catch { /* Corrupt copies remain downloadable instead of disappearing. */ }
      drafts.push({ key, updatedAt });
    }
  } catch { /* Storage may be unavailable. The current in-memory draft is kept. */ }
  return drafts;
}
