// src/api/remoteApi.ts
const API_BASE = "https://my-app-api.2mtk5mdz2r.replit.app"; // dein Replit-Backend
const API_KEY = import.meta.env.VITE_API_KEY; // aus .env.local

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ==== Status ====
export async function getStatus() {
  return request("/status");
}

// ==== Build ====
export async function triggerBuild(branch = "main") {
  return request("/build", {
    method: "POST",
    body: JSON.stringify({ branch }),
  });
}
export async function getBuildStatus(jobId: string) {
  return request(`/build-status/${jobId}`);
}

// ==== Chat ====
export async function chat(messages: { role: string; content: string }[], model = "gpt-5-mini") {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ model, messages }),
  });
}

// ==== Suggest Turn ====
export async function suggestTurn(players: string[], mood = "normal", theme = "classic", level = 2, nonAlcoholic = false) {
  return request("/suggest-turn", {
    method: "POST",
    body: JSON.stringify({ players, mood, theme, level, nonAlcoholic }),
  });
}

// ==== Files ====
export async function listFiles() {
  return request("/files/list");
}
export async function readFile(path: string) {
  return request(`/files/read?path=${encodeURIComponent(path)}`);
}
export async function updateFile(path: string, content: string) {
  return request("/files/update", {
    method: "POST",
    body: JSON.stringify({ path, content }),
  });
}
export async function deleteFile(path: string, confirm = false) {
  return request("/files/delete", {
    method: "POST",
    body: JSON.stringify({ path, confirm }),
  });
}
export async function undoLastChange() {
  return request("/files/undo");
}

// ==== Git ====
export async function gitCommit(message: string) {
  return request("/git/commit", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
export async function gitRevert() {
  return request("/git/revert", { method: "POST" });
}
export async function gitBranch(name: string) {
  return request("/git/branch", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
export async function gitMerge(name: string) {
  return request("/git/merge", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// ==== Preview ====
export async function previewRun() {
  return request("/preview/run", { method: "POST" });
}
export async function previewStatus() {
  return request("/preview/status");
}
export async function previewStop() {
  return request("/preview/stop", { method: "POST" });
}