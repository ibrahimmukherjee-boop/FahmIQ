import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ChatMessage, ModelBand, WorkspaceItem } from "../agents/types";

interface AppState {
  modelBand: ModelBand;
  setModelBand: (band: ModelBand) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  workspaceItems: WorkspaceItem[];
  addWorkspaceItem: (item: WorkspaceItem) => void;
  removeWorkspaceItem: (id: string) => void;
  togglePinItem: (id: string) => void;
  deepTaskCount: number;
  incrementDeepTaskCount: () => void;
  isPro: boolean;
  isPlus: boolean;
  setSubscription: (tier: "free" | "plus" | "pro") => void;
  credits: number;
  useCredit: () => boolean;
  addCredits: (amount: number) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  selectedTab: "ask" | "task" | "workspace";
  setSelectedTab: (tab: "ask" | "task" | "workspace") => void;
}

const AppContext = createContext<AppState | null>(null);

const FREE_DEEP_TASK_LIMIT = 3;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [modelBand, setModelBandState] = useState<ModelBand>("balanced");
  const [darkMode, setDarkMode] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([]);
  const [deepTaskCount, setDeepTaskCount] = useState(0);
  const [subscription, setSubscriptionState] = useState<"free" | "plus" | "pro">("free");
  const [credits, setCredits] = useState(10);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"ask" | "task" | "workspace">("ask");

  useEffect(() => {
    loadPersistedState();
  }, []);

  async function loadPersistedState() {
    try {
      const [band, dark, msgs, workspace, dtCount, sub, creds, onboarding] = await Promise.all([
        AsyncStorage.getItem("modelBand"),
        AsyncStorage.getItem("darkMode"),
        AsyncStorage.getItem("messages"),
        AsyncStorage.getItem("workspaceItems"),
        AsyncStorage.getItem("deepTaskCount"),
        AsyncStorage.getItem("subscription"),
        AsyncStorage.getItem("credits"),
        AsyncStorage.getItem("hasCompletedOnboarding"),
      ]);
      if (band) setModelBandState(band as ModelBand);
      if (dark !== null) setDarkMode(dark === "true");
      if (msgs) setMessages(JSON.parse(msgs));
      if (workspace) setWorkspaceItems(JSON.parse(workspace));
      if (dtCount) setDeepTaskCount(parseInt(dtCount, 10));
      if (sub) setSubscriptionState(sub as "free" | "plus" | "pro");
      if (creds) setCredits(parseInt(creds, 10));
      if (onboarding) setHasCompletedOnboarding(onboarding === "true");
    } catch {}
  }

  const setModelBand = useCallback(async (band: ModelBand) => {
    setModelBandState(band);
    await AsyncStorage.setItem("modelBand", band);
  }, []);

  const toggleDarkMode = useCallback(async () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem("darkMode", String(next));
      return next;
    });
  }, []);

  const addMessage = useCallback(async (msg: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      AsyncStorage.setItem("messages", JSON.stringify(next.slice(-100)));
      return next;
    });
  }, []);

  const updateMessage = useCallback(async (id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      AsyncStorage.setItem("messages", JSON.stringify(next.slice(-100)));
      return next;
    });
  }, []);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    await AsyncStorage.removeItem("messages");
  }, []);

  const addWorkspaceItem = useCallback(async (item: WorkspaceItem) => {
    setWorkspaceItems((prev) => {
      const next = [item, ...prev];
      AsyncStorage.setItem("workspaceItems", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeWorkspaceItem = useCallback(async (id: string) => {
    setWorkspaceItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      AsyncStorage.setItem("workspaceItems", JSON.stringify(next));
      return next;
    });
  }, []);

  const togglePinItem = useCallback(async (id: string) => {
    setWorkspaceItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i));
      AsyncStorage.setItem("workspaceItems", JSON.stringify(next));
      return next;
    });
  }, []);

  const incrementDeepTaskCount = useCallback(async () => {
    setDeepTaskCount((prev) => {
      const next = prev + 1;
      AsyncStorage.setItem("deepTaskCount", String(next));
      return next;
    });
  }, []);

  const setSubscription = useCallback(async (tier: "free" | "plus" | "pro") => {
    setSubscriptionState(tier);
    await AsyncStorage.setItem("subscription", tier);
  }, []);

  const useCredit = useCallback((): boolean => {
    if (credits <= 0) return false;
    setCredits((prev) => {
      const next = prev - 1;
      AsyncStorage.setItem("credits", String(next));
      return next;
    });
    return true;
  }, [credits]);

  const addCredits = useCallback((amount: number) => {
    setCredits((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem("credits", String(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem("hasCompletedOnboarding", "true");
  }, []);

  const value: AppState = {
    modelBand,
    setModelBand,
    darkMode,
    toggleDarkMode,
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    workspaceItems,
    addWorkspaceItem,
    removeWorkspaceItem,
    togglePinItem,
    deepTaskCount,
    incrementDeepTaskCount,
    isPro: subscription === "pro",
    isPlus: subscription === "plus" || subscription === "pro",
    setSubscription,
    credits,
    useCredit,
    addCredits,
    hasCompletedOnboarding,
    completeOnboarding,
    selectedTab,
    setSelectedTab,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
