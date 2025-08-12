
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categories } from '../Arena/categories';
import { listApprovedTasks, type Task, type CategoryKey } from '@/lib/tasksApi';
import styles from './TasksOverviewScreen.module.css';

export function TasksOverviewScreen() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Task[]>([]);
  const [filteredItems, setFilteredItems] = useState<Task[]>([]);
  const [category, setCategory] = useState<CategoryKey | undefined>(undefined);
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
        setFilteredItems(tasks);
      } catch (error) {
        console.error('❌ Tasks loading failed:', error);
        setItems([]);
        setFilteredItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [category]);

  const handleCategoryFilter = (newCategory: CategoryKey | undefined) => {
    setCategory(newCategory);
  };

  const getCategoryLabel = (categoryKey: string): string => {
    return t(`arena.categories.${categoryKey}`) || categoryKey;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t('tasks.title')}</h1>
        <p className={styles.subtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'Aufgabe' : 'Aufgaben'} verfügbar
        </p>
      </header>

      <div className={styles.filters}>
        <h3>Nach Kategorie filtern:</h3>
        <div className={styles.categoryButtons}>
          <button
            className={`${styles.categoryButton} ${!category ? styles.active : ''}`}
            onClick={() => handleCategoryFilter(undefined)}
          >
            Alle Kategorien
          </button>
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryButton} ${category === cat ? styles.active : ''}`}
              onClick={() => handleCategoryFilter(cat as CategoryKey)}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📋</span>
            <h3>Keine Aufgaben gefunden</h3>
            <p>
              {category 
                ? `Keine Aufgaben in der Kategorie "${getCategoryLabel(category)}" verfügbar.`
                : 'Momentan sind keine Aufgaben verfügbar.'
              }
            </p>
          </div>
        ) : (
          <div className={styles.tasksList}>
            {filteredItems.map((task, index) => (
              <div key={task.id || index} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <span className={styles.categoryBadge}>
                    {getCategoryLabel(task.category)}
                  </span>
                  <span className={styles.taskNumber}>#{index + 1}</span>
                </div>
                <div className={styles.taskText}>
                  {task.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
