
export interface MenuItem {
  id: string;            // Eindeutiger Bezeichner
  labelKey: string;      // i18n-Key z. B. 'menu.settings'
  icon?: string;         // Optional: Icon-Name oder Emoji
  route?: string;        // Navigationspfad, z. B. '/settings'
  roles?: string[];      // Sichtbar für bestimmte Rollen ['user', 'admin']
  visible?: boolean;     // Optional: Sichtbarkeit steuern
}

export const menuItems: MenuItem[] = [
  // Main navigation items
  { id: 'arena', labelKey: 'navigation.arena', icon: '🏟️', route: '/arena', roles: ['user', 'admin'] },
  { id: 'legends', labelKey: 'navigation.legends', icon: '👑', route: '/legends', roles: ['user', 'admin'] },
  
  // Menu items
  { id: 'profile', labelKey: 'menu.profile', icon: '👤', route: '/menu', roles: ['user', 'admin'] },
  { id: 'settings', labelKey: 'menu.settings', icon: '⚙️', route: '/menu?tab=settings', roles: ['user', 'admin'] },
  { id: 'tasks', labelKey: 'menu.tasks', icon: '✅', route: '/menu?tab=tasks', roles: ['user', 'admin'] },
  { id: 'suggest', labelKey: 'menu.suggest', icon: '💡', route: '/menu?tab=suggest', roles: ['user', 'admin'] },
  { id: 'ranking', labelKey: 'menu.ranking', icon: '🏆', route: '/menu?tab=leaderboard', roles: ['user', 'admin'] },
  { id: 'rules', labelKey: 'menu.rules', icon: '📜', route: '/menu?tab=rules', roles: ['user', 'admin'] },
  { id: 'about', labelKey: 'menu.about', icon: 'ℹ️', route: '/menu?tab=about', roles: ['user', 'admin'] },
  
  // Admin items
  { id: 'taskManager', labelKey: 'menu.taskManager', icon: '🛠️', route: '/menu?tab=admin', roles: ['admin'] },
  { id: 'devManager', labelKey: 'menu.devManager', icon: '💻', route: '/menu?tab=dev', roles: ['admin'] }
];
