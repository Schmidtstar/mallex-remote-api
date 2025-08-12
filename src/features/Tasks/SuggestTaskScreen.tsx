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
      <h2>{t('menu.suggest')}</h2>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="category">{t('tasks.category')}</label>
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
          <label htmlFor="text">{t('tasks.text')}</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('tasks.placeholder')}
            className={styles.textarea}
            rows={4}
            maxLength={500}
          />
          <small className={styles.counter}>
            {text.length}/500
          </small>
        </div>

        <button 
          type="submit"
          disabled={busy || !text.trim()} 
          className={styles.submitBtn}
        >
          {busy ? t('tasks.submitting') : t('tasks.submit')}
        </button>

        {success && (
          <div className={styles.success}>
            {t('tasks.thanks')}
          </div>
        )}
      </form>
    </div>
  );
}