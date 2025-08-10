
export interface MenuItem {
  id: string;
  icon: string;
  labelKey: string;
  to: string;
  fallbackLabel: string;
  visible?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'settings', icon: '⚙️', labelKey: 'menu.tabs.settings', to: '/menu?tab=settings', fallbackLabel: 'Einstellungen' },
  { id: 'profile', icon: '👤', labelKey: 'menu.tabs.profile', to: '/menu?tab=profile', fallbackLabel: 'Profil' },
  { id: 'tasks', icon: '📝', labelKey: 'menu.tabs.tasks', to: '/menu?tab=tasks', fallbackLabel: 'Aufgaben' },
  { id: 'suggest', icon: '💡', labelKey: 'menu.tabs.suggest', to: '/menu?tab=suggest', fallbackLabel: 'Vorschlagen' },
  { id: 'rank', icon: '🏆', labelKey: 'menu.tabs.rank', to: '/menu?tab=rank', fallbackLabel: 'Rangliste' },
  { id: 'rules', icon: '📜', labelKey: 'menu.tabs.rules', to: '/menu?tab=rules', fallbackLabel: 'Spielregeln' },
  { id: 'about', icon: 'ℹ️', labelKey: 'menu.tabs.about', to: '/menu?tab=about', fallbackLabel: 'Über MALLEX' },
];
