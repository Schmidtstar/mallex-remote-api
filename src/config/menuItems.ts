export interface MenuItem {
  key: 'arena' | 'legends' | 'profile' | 'settings' | 'tasks' | 'suggest' | 'admin';
  labelKey: string;           // i18n key
  path: '/arena' | '/legends' | '/menu?tab=profile' | '/menu?tab=settings' | '/tasks' | '/tasks/suggest' | '/admin/tasks';
  icon?: string;              // optional, falls genutzt
  adminOnly?: boolean;
}

export interface MenuGroup {
  id: string
  items: MenuItem[]
}

export const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    items: [
      { key: 'arena',   labelKey: 'menu.arena',   path: '/arena',   icon: '🏟️' },
      { key: 'legends', labelKey: 'menu.legends', path: '/legends', icon: '🏛️' },
      { key: 'profile', labelKey: 'menu.profile', path: '/menu?tab=profile', icon: '👤' },
      { key: 'settings',labelKey: 'menu.settings',path: '/menu?tab=settings', icon: '⚙️' },
      { key: 'tasks', labelKey: 'menu.tasks.overview', path: '/tasks', icon: '📋' },
      { key: 'suggest', labelKey: 'menu.suggest', path: '/tasks/suggest', icon: '📝' },
      { key: 'admin', labelKey: 'menu.admin', path: '/admin/tasks', icon: '⚡', adminOnly: true },
    ] as MenuItem[],
  },
];