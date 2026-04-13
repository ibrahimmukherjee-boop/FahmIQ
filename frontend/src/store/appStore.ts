import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentStages?: AgentStage[];
  confidence?: number;
  sources?: string[];
}

export interface AgentStage {
  id: string;
  agent: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  summary: string;
  startTime?: number;
  endTime?: number;
  confidence?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface DeepTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'paused' | 'complete' | 'error';
  steps: TaskStep[];
  result?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  output?: string;
  agent?: string;
}

export interface WorkspaceItem {
  id: string;
  title: string;
  content: string;
  type: 'answer' | 'research' | 'task_output' | 'note';
  pinned: boolean;
  tags: string[];
  createdAt: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastRun?: number;
  runs: number;
}

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  addConversation: (conv: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (convId: string, message: Message) => void;
  updateMessage: (convId: string, msgId: string, updates: Partial<Message>) => void;

  // Tasks
  tasks: DeepTask[];
  addTask: (task: DeepTask) => void;
  updateTask: (id: string, updates: Partial<DeepTask>) => void;
  updateTaskStep: (taskId: string, stepId: string, updates: Partial<TaskStep>) => void;

  // Workspace
  workspaceItems: WorkspaceItem[];
  addWorkspaceItem: (item: WorkspaceItem) => void;
  togglePin: (id: string) => void;
  removeWorkspaceItem: (id: string) => void;

  // Automation
  automations: AutomationRule[];
  addAutomation: (rule: AutomationRule) => void;
  toggleAutomation: (id: string) => void;
  removeAutomation: (id: string) => void;

  // Models
  modelsDownloaded: Record<string, boolean>;
  setModelDownloaded: (band: string, downloaded: boolean) => void;

  // Subscription
  subscriptionTier: 'free' | 'pro' | 'ultra';
  setSubscriptionTier: (tier: 'free' | 'pro' | 'ultra') => void;

  // Inference state
  isProcessing: boolean;
  setProcessing: (v: boolean) => void;
  currentAgentStages: AgentStage[];
  setCurrentAgentStages: (stages: AgentStage[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  onboardingComplete: false,
  setOnboardingComplete: (v) => set({ onboardingComplete: v }),

  conversations: [],
  activeConversationId: null,
  addConversation: (conv) => set((s) => ({ conversations: [conv, ...s.conversations] })),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (convId, message) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
          : c
      ),
    })),
  updateMessage: (convId, msgId, updates) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...updates } : m)),
            }
          : c
      ),
    })),

  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)),
    })),
  updateTaskStep: (taskId, stepId, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, steps: t.steps.map((st) => (st.id === stepId ? { ...st, ...updates } : st)) }
          : t
      ),
    })),

  workspaceItems: [],
  addWorkspaceItem: (item) => set((s) => ({ workspaceItems: [item, ...s.workspaceItems] })),
  togglePin: (id) =>
    set((s) => ({
      workspaceItems: s.workspaceItems.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w)),
    })),
  removeWorkspaceItem: (id) =>
    set((s) => ({ workspaceItems: s.workspaceItems.filter((w) => w.id !== id) })),

  automations: [],
  addAutomation: (rule) => set((s) => ({ automations: [...s.automations, rule] })),
  toggleAutomation: (id) =>
    set((s) => ({
      automations: s.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    })),
  removeAutomation: (id) =>
    set((s) => ({ automations: s.automations.filter((a) => a.id !== id) })),

  modelsDownloaded: { fast: false, balanced: false, precision: false },
  setModelDownloaded: (band, downloaded) =>
    set((s) => ({ modelsDownloaded: { ...s.modelsDownloaded, [band]: downloaded } })),

  subscriptionTier: 'free',
  setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),

  isProcessing: false,
  setProcessing: (v) => set({ isProcessing: v }),
  currentAgentStages: [],
  setCurrentAgentStages: (stages) => set({ currentAgentStages: stages }),
}));

export { generateId };
