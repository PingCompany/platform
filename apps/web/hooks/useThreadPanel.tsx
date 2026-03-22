"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface OpenThread {
  parentMessageId: string;
  messageTable: "messages" | "directMessages";
  channelId?: string;
  conversationId?: string;
  contextName: string;
  workspaceId?: string;
}

interface ThreadPanelState {
  openThread: OpenThread | null;
  openThreadPanel: (config: OpenThread) => void;
  closeThreadPanel: () => void;
}

const ThreadPanelContext = createContext<ThreadPanelState | null>(null);

export function ThreadPanelProvider({ children }: { children: ReactNode }) {
  const [openThread, setOpenThread] = useState<OpenThread | null>(null);

  const openThreadPanel = useCallback((config: OpenThread) => {
    setOpenThread(config);
  }, []);

  const closeThreadPanel = useCallback(() => {
    setOpenThread(null);
  }, []);

  return (
    <ThreadPanelContext.Provider
      value={{ openThread, openThreadPanel, closeThreadPanel }}
    >
      {children}
    </ThreadPanelContext.Provider>
  );
}

export function useThreadPanel() {
  const ctx = useContext(ThreadPanelContext);
  if (!ctx) throw new Error("useThreadPanel must be used within ThreadPanelProvider");
  return ctx;
}
