
import React, { useEffect, useState } from 'react';
import { listSuggestionsForAdmin, moderateSuggestion, promoteApprovedSuggestionToTask, type Suggestion } from '@/deprecated/suggestionsApi';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './AdminSuggestionsScreen.module.css';

export function AdminSuggestionsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listSuggestionsForAdmin('pending'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handle = async (s: Suggestion, action: 'approve' | 'reject') => {
    if (!s.id) return;
    
    setProcessing(s.id);
    try {
      await moderateSuggestion(s.id, action);
      if (action === 'approve') {
        await promoteApprovedSuggestionToTask({ ...s, status: 'approved' }, user?.uid);
      }
      await load();
    } catch (error) {
      console.error('Error moderating suggestion:', error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className={styles.container}>
      <h2>{t('admin.suggestions.title')}</h2>
      
      {loading ? (
        <div className={styles.loading}>{t('loading')}</div>
      ) : (
        <div className={styles.suggestionsList}>
          {items.length === 0 ? (
            <p className={styles.empty}>{t('admin.suggestions.empty')}</p>
          ) : (
            <ul className={styles.list}>
              {items.map(s => (
                <li key={s.id} className={styles.suggestionItem}>
                  <div className={styles.content}>
                    <span className={styles.category}>
                      [{t(`categories.${s.category}`)}]
                    </span>
                    <p className={styles.text}>{s.text}</p>
                    <small className={styles.meta}>
                      {t('admin.suggestions.by')}: {s.createdBy}
                    </small>
                  </div>
                  <div className={styles.actions}>
                    <button 
                      onClick={() => handle(s, 'approve')}
                      disabled={processing === s.id}
                      className={`${styles.btn} ${styles.approve}`}
                    >
                      {processing === s.id ? '...' : t('admin.approve')}
                    </button>
                    <button 
                      onClick={() => handle(s, 'reject')}
                      disabled={processing === s.id}
                      className={`${styles.btn} ${styles.reject}`}
                    >
                      {processing === s.id ? '...' : t('admin.reject')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
