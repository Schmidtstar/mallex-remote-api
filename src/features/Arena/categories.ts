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
      name: t('arena.categories.fate'),
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
      name: t('arena.categories.truth'),
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
      name: t('arena.categories.dare'),
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