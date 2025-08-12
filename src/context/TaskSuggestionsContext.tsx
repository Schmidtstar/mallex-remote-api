import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SuggestionStatus = "pending" | "approved" | "rejected";

export type TaskSuggestion = {
  id: string;
  categoryId: string;   // z.B. "fate" | "seduce" | "confess" | "escalate" | "shame"
  text: string;
  status: SuggestionStatus;
  note?: string;
  createdAt: number;
  createdBy?: string;   // optional: uid oder "guest"
};

type Ctx = {
  suggestions: TaskSuggestion[];
  pending: TaskSuggestion[];
  approved: TaskSuggestion[];
  rejected: TaskSuggestion[];
  addSuggestion: (categoryId: string, text: string, createdBy?: string) => Promise<void>;
  approve: (id: string, note?: string) => void;
  reject: (id: string, note?: string) => void;
  remove: (id: string) => void;
  updateText: (id: string, text: string) => void;
  clearAllLocal: () => void;
};

const TaskSuggestionsContext = createContext<Ctx | undefined>(undefined);

const LS_KEY = "mallex:taskSuggestions";

function loadLocal(): TaskSuggestion[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as TaskSuggestion[]) : [];
  } catch {
    return [];
  }
}
function saveLocal(list: TaskSuggestion[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

export function TaskSuggestionsProvider({ children }: { children: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>(() => loadLocal());

  useEffect(() => saveLocal(suggestions), [suggestions]);

  const addSuggestion: Ctx["addSuggestion"] = async (categoryId, text, createdBy = "guest") => {
    const s: TaskSuggestion = {
      id: crypto.randomUUID(),
      categoryId,
      text: text.trim(),
      status: "pending",
      createdAt: Date.now(),
      createdBy,
    };
    setSuggestions(prev => [s, ...prev]);
  };

  const patch = (id: string, fn: (s: TaskSuggestion) => TaskSuggestion) =>
    setSuggestions(prev => prev.map(s => (s.id === id ? fn(s) : s)));

  const approve: Ctx["approve"] = (id, note) => patch(id, s => ({ ...s, status: "approved", note }));
  const reject: Ctx["reject"] = (id, note) => patch(id, s => ({ ...s, status: "rejected", note }));
  const remove: Ctx["remove"]  = id => setSuggestions(prev => prev.filter(s => s.id !== id));
  const updateText: Ctx["updateText"] = (id, text) => patch(id, s => ({ ...s, text }));

  const clearAllLocal = () => setSuggestions([]);

  const value = useMemo<Ctx>(() => {
    const pending  = suggestions.filter(s => s.status === "pending");
    const approved = suggestions.filter(s => s.status === "approved");
    const rejected = suggestions.filter(s => s.status === "rejected");
    return { suggestions, pending, approved, rejected, addSuggestion, approve, reject, remove, updateText, clearAllLocal };
  }, [suggestions]);

  return <TaskSuggestionsContext.Provider value={value}>{children}</TaskSuggestionsContext.Provider>;
}

export function useTaskSuggestions() {
  const ctx = useContext(TaskSuggestionsContext);
  if (!ctx) throw new Error("useTaskSuggestions must be used within TaskSuggestionsProvider");
  return ctx;
}