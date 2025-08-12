import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categories } from '../Arena/categories';
import { listApprovedTasks, type Task, type CategoryKey } from '@/lib/tasksApi';
import styles from './TasksOverviewScreen.module.css';



export function TasksOverviewScreen() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryKey | undefined>(undefined);
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading approved tasks, category:', category);
        
        // Use the working tasksApi instead of direct Firebase queries
        const tasks = await listApprovedTasks(category);
        
        console.log('✅ Tasks loaded successfully:', tasks.length);
        setItems(tasks);
      } catch (error) {
        console.error('❌ Tasks loading failed:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
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