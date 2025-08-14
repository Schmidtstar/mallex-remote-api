import { useEffect, useState } from 'react';
// Fixed suggestion interface
interface Suggestion {
  id: string;
  text: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: Date;
}

// Placeholder API functions until Firebase is fully implemented
const listSuggestionsForAdmin = async (status: string): Promise<Suggestion[]> => {
  console.log('Loading suggestions with status:', status);
  // TODO: Implement with Firebase
  return [];
};

const moderateSuggestion = async (id: string, action: 'approve' | 'reject'): Promise<void> => {
  console.log('Moderating suggestion:', id, action);
  // TODO: Implement with Firebase
};

const promoteApprovedSuggestionToTask = async (suggestion: Suggestion, userId?: string): Promise<void> => {
  console.log('Promoting suggestion to task:', suggestion.text, 'by', userId);
  // TODO: Implement with Firebase
};
import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/context/AdminContext';
import { useTranslation } from 'react-i18next';
import styles from './AdminSuggestionsScreen.module.css';

export function AdminSuggestionsScreen() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
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

  if (!user || !isAdmin) return null;

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