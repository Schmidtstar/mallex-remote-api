const API_BASE = "https://my-app-api-2mtk5mdz2r.replit.app";
const API_KEY = import.meta.env.VITE_API_KEY; // aus .env.local

export async function suggestTurn(
  players: string[],
  mood = "normal",
  theme = "classic",
  level = 2,
  nonAlcoholic = false
) {
  const res = await fetch(`${API_BASE}/suggest-turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ players, mood, theme, level, nonAlcoholic }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<{ suggestions: string }>;
}