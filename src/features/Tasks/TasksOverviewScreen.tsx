import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { categories } from '../Arena/categories';
import styles from './TasksOverviewScreen.module.css';

interface Task {
  id: string;
  text: string;
  category: string;
  status: string;
  hidden?: boolean;
}

type CategoryKey = 'fate' | 'shame' | 'seduce' | 'escalate' | 'confess';

export function TasksOverviewScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryKey | undefined>(undefined);
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTasksFromFirebase = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading tasks from Firebase, category:', category);
        
        // Query Firebase directly for approved tasks (filter hidden client-side)
        let q = query(
          collection(db, 'tasks'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );

        // Add category filter if specified
        if (category) {
          q = query(
            collection(db, 'tasks'),
            where('status', '==', 'approved'),
            where('category', '==', category),
            orderBy('createdAt', 'desc')
          );
        }

        const snapshot = await getDocs(q);
        const allTasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];

        // Filter hidden tasks client-side to avoid index requirement
        const visibleTasks = allTasks.filter(task => !task.hidden);

        console.log('✅ Firebase tasks loaded:', visibleTasks.length);
        setItems(visibleTasks);
      } catch (error) {
        console.error('❌ Firebase tasks loading failed:', error);
        // Fallback to empty array if Firebase fails
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasksFromFirebase();
  }, [category]);

  return (
    <div className={styles.container}>
      <h2>{t('menu.tasks')}</h2>

      <div className={styles.filterBar}>
        <select 
          value={category || ''} 
          onChange={(e) => setCategory(e.target.value as CategoryKey || undefined)}
          className={styles.categorySelect}
        >
          <option value="">{t('tasks.all')}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {t(cat.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>{t('loading')}</div>
      ) : (
        <div className={styles.tasksList}>
          {items.length === 0 ? (
            <p className={styles.empty}>{t('tasks.empty')}</p>
          ) : (
            <ul className={styles.list}>
              {items.map(task => (
                <li key={task.id} className={styles.taskItem}>
                  <span className={styles.category}>
                    [{t(`arena.categories.${task.category}`)}]
                  </span>
                  <span className={styles.text}>{task.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}