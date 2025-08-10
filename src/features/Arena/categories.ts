
import { useTranslation } from 'react-i18next';

export interface Category {
  id: string;
  name: string;
  items: string[];
}

export const useCategories = (): Category[] => {
  const { t } = useTranslation();

  return [
    {
      id: 'fate',
      name: 'Schicksal',
      items: [
        t('arena.fate.item1'),
        t('arena.fate.item2'),
        t('arena.fate.item3'),
        t('arena.fate.item4'),
        t('arena.fate.item5')
      ]
    },
    {
      id: 'truth',
      name: 'Wahrheit',
      items: [
        t('arena.truth.item1'),
        t('arena.truth.item2'),
        t('arena.truth.item3'),
        t('arena.truth.item4'),
        t('arena.truth.item5')
      ]
    },
    {
      id: 'dare',
      name: 'Mutprobe',
      items: [
        t('arena.dare.item1'),
        t('arena.dare.item2'),
        t('arena.dare.item3'),
        t('arena.dare.item4'),
        t('arena.dare.item5')
      ]
    }
  ];
};
