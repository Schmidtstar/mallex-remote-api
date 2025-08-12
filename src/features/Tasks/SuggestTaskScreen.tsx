
import React, { useState } from 'react';
import { createSuggestion } from '@/deprecated/suggestionsApi';
import { useAuth } from '@/context/AuthContext';
import type { CategoryKey } from '@/lib/tasksApi';
import { useTranslation } from 'react-i18next';
import { categories } from '../Arena/categories';
import styles from './SuggestTaskScreen.module.css';

export function SuggestTaskScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryKey>('fate');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !text.trim()) return;

    setBusy(true);
    setSuccess(false);
    try {
      await createSuggestion(user.uid, category, text.trim());
      setText('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating suggestion:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📝 Aufgaben vorschlagen</h2>
        <p className={styles.subtitle}>
          Teile deine Ideen für neue Aufgaben mit der Community
        </p>
      </div>

      {success && (
        <div className={styles.successMessage}>
          ✅ Vielen Dank! Dein Vorschlag wurde erfolgreich eingereicht.
        </div>
      )}

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="category" className={styles.label}>
            🎯 Kategorie auswählen
          </label>
          <select 
            id="category"
            value={category} 
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className={styles.select}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {t(cat.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="text" className={styles.label}>
            📋 Aufgabentext
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Beschreibe deine Aufgabenidee hier... (z.B. 'Erzähle von deinem schönsten Kindheitserlebnis')"
            className={styles.textarea}
            rows={4}
            maxLength={500}
          />
          <div className={styles.counter}>
            {text.length}/500 Zeichen
          </div>
        </div>

        <button 
          type="submit"
          disabled={busy || !text.trim()} 
          className={styles.submitButton}
        >
          {busy ? '📤 Wird gesendet...' : '🚀 Vorschlag einreichen'}
        </button>
      </form>

      <div className={styles.infoBox}>
        <h3>💡 Tipps für gute Aufgaben:</h3>
        <ul>
          <li>Sei kreativ und originell</li>
          <li>Stelle offene Fragen, die zum Nachdenken anregen</li>
          <li>Achte auf eine klare und verständliche Formulierung</li>
          <li>Vermeide zu persönliche oder sensible Themen</li>
        </ul>
      </div>
    </div>
  );
}
