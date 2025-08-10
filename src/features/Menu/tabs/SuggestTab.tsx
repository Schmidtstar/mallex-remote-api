// src/features/Menu/tabs/SuggestTab.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { categories } from "@/features/Arena/categories";
import { useTaskSuggestions } from "@/features/Menu/context/TaskSuggestionsContext";

export default function SuggestTab() {
  const { t } = useTranslation();
  const { addSuggestion } = useTaskSuggestions(); // <- existierende API
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id ?? "fate");
  const [taskText, setTaskText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    const text = taskText.trim();
    if (!text) {
      setError(t("menu.suggest.placeholder")); // simple client validation
      return;
    }
    try {
      setSubmitting(true);
      await addSuggestion(selectedCategory, text); // <- await nur hier
      setSent(true);
      setTaskText("");
      // optional: nach kurzer Zeit das "Danke" wieder ausblenden
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>{t("menu.suggest.title")}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {/* Kategorie-Auswahl */}
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ opacity: 0.9 }}>{t("menu.suggest.choose")}</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.labelKey)}
              </option>
            ))}
          </select>
        </label>

        {/* Textfeld */}
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ opacity: 0.9 }}>{t("menu.suggest.placeholder")}</span>
          <textarea
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            rows={3}
            placeholder={t("menu.suggest.placeholder")}
            style={{
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              resize: "vertical",
            }}
          />
        </label>

        {/* Status / Fehler */}
        {error && (
          <div style={{ fontSize: 14, color: "#ffb4b4" }}>
            {error}
          </div>
        )}
        {sent && (
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            {t("menu.suggest.thanks")}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "linear-gradient(135deg, rgba(255,96,96,0.85), rgba(255,128,64,0.85))",
            color: "white",
            fontWeight: 700,
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {t("menu.suggest.submit")}
        </button>
      </form>
    </div>
  );
}
