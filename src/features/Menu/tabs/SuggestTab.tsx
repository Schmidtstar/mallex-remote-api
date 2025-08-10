
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { categories } from '../../Arena/categories';
import { useTaskSuggestions } from '../../../context/TaskSuggestionsContext';

export default function SuggestTab() {
  const { t } = useTranslation();
  const { addSuggestion } = useTaskSuggestions();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [taskText, setTaskText] = useState('');
  const [showThanks, setShowThanks] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !taskText.trim()) {
      return;
    }

    await addSuggestion(selectedCategory, taskText.trim());

    // Reset form and show thanks
    setSelectedCategory('');
    setTaskText('');
    setShowThanks(true);
    
    // Hide thanks after 3 seconds
    setTimeout(() => setShowThanks(false), 3000);
  };

  return (
    <div className="suggest-tab">
      <h2>{t('menu.suggest.title')}</h2>
      
      {showThanks && (
        <div className="thanks-message">
          {t('menu.suggest.thanks')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="suggest-form">
        <div className="form-group">
          <label htmlFor="category-select">
            {t('menu.suggest.choose')}
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            <option value="">{t('menu.suggest.choose')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {t(category.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="task-text">
            {t('menu.suggest.title')}
          </label>
          <textarea
            id="task-text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder={t('menu.suggest.placeholder')}
            rows={4}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          {t('menu.suggest.submit')}
        </button>
      </form>

      <style jsx>{`
        .suggest-tab {
          max-width: 500px;
        }

        .suggest-tab h2 {
          margin-bottom: 1.5rem;
          color: var(--text-primary, #333);
        }

        .thanks-message {
          background: var(--success-color, #28a745);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggest-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: var(--text-primary, #333);
        }

        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color, #007bff);
          box-shadow: 0 0 0 2px var(--primary-color-light, #007bff33);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .submit-button {
          padding: 0.875rem 1.5rem;
          background: var(--primary-color, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .submit-button:hover {
          background: var(--primary-color-dark, #0056b3);
        }

        .submit-button:disabled {
          background: var(--disabled-color, #6c757d);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
