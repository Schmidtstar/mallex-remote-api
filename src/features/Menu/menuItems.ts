
export interface MenuItem {
  id: string;
  labelKey: string;
  icon?: string;
  route: string;
  roles: ('user' | 'admin')[];
}

export const menuItems: MenuItem[] = [
  // General menu items
  {
    id: 'arena',
    labelKey: 'navigation.arena',
    icon: '🏟️',
    route: '/arena',
    roles: ['user', 'admin']
  },
  {
    id: 'legends',
    labelKey: 'navigation.legends',
    icon: '👑',
    route: '/legends',
    roles: ['user', 'admin']
  },
  {
    id: 'profile',
    labelKey: 'navigation.profile',
    icon: '👤',
    route: '/menu',
    roles: ['user', 'admin']
  },
  {
    id: 'settings',
    labelKey: 'navigation.settings',
    icon: '⚙️',
    route: '/menu?tab=settings',
    roles: ['user', 'admin']
  },
  {
    id: 'suggest',
    labelKey: 'navigation.suggest',
    icon: '💡',
    route: '/menu?tab=suggest',
    roles: ['user', 'admin']
  },
  // Admin menu items
  {
    id: 'admin-tasks',
    labelKey: 'navigation.admin.tasks',
    icon: '📋',
    route: '/menu?tab=tasks',
    roles: ['admin']
  },
  {
    id: 'admin-panel',
    labelKey: 'navigation.admin.panel',
    icon: '🔧',
    route: '/menu?tab=admin',
    roles: ['admin']
  }
];
