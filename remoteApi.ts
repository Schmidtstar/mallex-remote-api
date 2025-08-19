// src/api/remoteApi.ts

// Basis-URL & API-Key kommen aus deinem Build-Env (.env.local)
// Fallback-URL ist dein Replit-Backend, falls VITE_API_URL nicht gesetzt ist.
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string) ||
  "https://my-app-api-2mtk5mdz2r.replit.app";

const API_KEY: string = (import.meta.env.VITE_API_KEY as string) ?? "";

// --------------------------------------
// Gemeinsamer Request-Wrapper
// --------------------------------------
async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text).error ?? text;
    } catch {
      // ignore JSON parse error; keep raw text
    }
    throw new Error(`API ${res.status} ${res.statusText}: ${msg}`);
  }

  // leere Responses zulassen
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// --------------------------------------
// Typen (optional hilfreich für TS)
// --------------------------------------
export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// --------------------------------------
// Status / Build
// --------------------------------------
export const getStatus = () => request("/status");

export const triggerBuild = (branch = "main") =>
  request("/build", {
    method: "POST",
    body: JSON.stringify({ branch }),
  });

export const getBuildStatus = (jobId: string) =>
  request(`/build-status/${encodeURIComponent(jobId)}`);

// --------------------------------------
// Chat / Suggest Turn
// --------------------------------------
export const chat = (messages: ChatMessage[], model = "gpt-5-mini") =>
  request("/chat", {
    method: "POST",
    body: JSON.stringify({ model, messages }),
  });

export const suggestTurn = (
  players: string[],
  mood = "normal",
  theme = "classic",
  level = 2,
  nonAlcoholic = false
) =>
  request("/suggest-turn", {
    method: "POST",
    body: JSON.stringify({ players, mood, theme, level, nonAlcoholic }),
  });

// --------------------------------------
// Files
// --------------------------------------
export const listFiles = () =>
  request<{ files: string[] }>("/files/list");

export const readFile = (path: string) =>
  request(`/files/read?path=${encodeURIComponent(path)}`);

export const updateFile = (path: string, content: string) =>
  request("/files/update", {
    method: "POST",
    body: JSON.stringify({ path, content }),
  });

export const deleteFile = (path: string, confirm = true) =>
  request("/files/delete", {
    method: "POST",
    body: JSON.stringify({ path, confirm }),
  });

export const undoLastChange = () =>
  request("/files/undo", { method: "POST" });

// --------------------------------------
// Git
// --------------------------------------
export const gitCommit = (msg: string) =>
  request("/git/commit", {
    method: "POST",
    body: JSON.stringify({ msg }),
  });

export const gitRevert = () =>
  request("/git/revert", { method: "POST" });

export const gitBranch = (name: string) =>
  request("/git/branch", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const gitMerge = (branch: string) =>
  request("/git/merge", {
    method: "POST",
    body: JSON.stringify({ branch }),
  });

// --------------------------------------
// GPT Code-Tools
// --------------------------------------
export const optimizeCode = (path: string) =>
  request("/code/optimize", {
    method: "POST",
    body: JSON.stringify({ path }),
  });

export const fixErrors = (log: string) =>
  request("/code/fix-errors", {
    method: "POST",
    body: JSON.stringify({ log }),
  });

export const explainCode = (path: string) =>
  request("/code/explain", {
    method: "POST",
    body: JSON.stringify({ path }),
  });

// --------------------------------------
// Preview / Deploy
// --------------------------------------
export const previewRun = () =>
  request("/preview/run", { method: "POST" });

export const previewStatus = () =>
  request("/preview/status", { method: "POST" }); // server.js erwartet POST

export const previewStop = () =>
  request("/preview/stop", { method: "POST" });

export const deployStart = () =>
  request("/deploy/start", { method: "POST" });

export const deployStatus = () =>
  request("/deploy/status");

export const deployLogs = () =>
  request("/deploy/logs");