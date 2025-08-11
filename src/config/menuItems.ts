export interface MenuItem {
  key: 'arena' | 'legends' | 'profile' | 'settings' | 'tasks' | 'suggestTask' | 'adminTasks' | 'adminSuggestions';
  labelKey: string;
  path?: string;
  icon?: string;
  adminOnly?: boolean;
  authRequired?: boolean;
  action?: () => void;
}

export interface MenuGroup {
  id: string
  items: MenuItem[]
}

export const menuItems: MenuItem[] = [
  { key: 'arena', labelKey: 'menu.arena', path: '/arena', icon: '🏟️', authRequired: true },
  { key: 'legends', labelKey: 'menu.legends', path: '/legends', icon: '🏛️', authRequired: true },
  { key: 'tasks', labelKey: 'menu.tasks.overview', path: '/tasks', icon: '📋', authRequired: true },
  { key: 'suggestTask', labelKey: 'menu.tasks.suggest', path: '/tasks/suggest', icon: '📝', authRequired: true },
  { key: 'adminTasks', labelKey: 'menu.admin.tasks', path: '/admin/tasks', icon: '⚡', adminOnly: true, authRequired: true },
  { key: 'adminSuggestions', labelKey: 'menu.admin.suggestions', path: '/admin/suggestions', icon: '📊', adminOnly: true, authRequired: true },
  { key: 'profile', labelKey: 'menu.profile', path: '/menu?tab=profile', icon: '👤', authRequired: true },
  { key: 'settings', labelKey: 'menu.settings', path: '/menu?tab=settings', icon: '⚙️', authRequired: true },
];

export const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    items: menuItems,
  },
];