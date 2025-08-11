
// NO DEFAULT EXPORTS - Only named exports to prevent star export issues
export interface MenuItem {
  key: string;
  labelKey: string;
  fallbackLabel?: string;
  to?: string;
  onClick?: () => void;
  icon?: string;
  hidden?: boolean;
}

export interface MenuGroup {
  key: string;
  items: MenuItem[];
}

export const menuItems: MenuGroup[] = [
  {
    key: "main",
    items: [
      { 
        key: "arena", 
        labelKey: "navigation.arena", 
        fallbackLabel: "Arena",
        to: "/arena", 
        icon: "🏟️" 
      },
      { 
        key: "legends", 
        labelKey: "navigation.legends", 
        fallbackLabel: "Legends",
        to: "/legends", 
        icon: "👑" 
      },
      { 
        key: "profile", 
        labelKey: "menu.profile", 
        fallbackLabel: "Profile",
        to: "/menu", 
        icon: "👤" 
      },
      { 
        key: "settings", 
        labelKey: "menu.settings", 
        fallbackLabel: "Settings",
        to: "/menu?tab=settings", 
        icon: "⚙️" 
      },
      { 
        key: "tasks", 
        labelKey: "menu.tasks", 
        fallbackLabel: "Tasks",
        to: "/menu?tab=tasks", 
        icon: "✅" 
      },
      { 
        key: "suggest", 
        labelKey: "menu.suggest", 
        fallbackLabel: "Suggest",
        to: "/menu?tab=suggest", 
        icon: "💡" 
      },
      { 
        key: "ranking", 
        labelKey: "menu.ranking", 
        fallbackLabel: "Ranking",
        to: "/menu?tab=leaderboard", 
        icon: "🏆" 
      }
    ]
  },
  {
    key: "info",
    items: [
      { 
        key: "rules", 
        labelKey: "menu.rules", 
        fallbackLabel: "Rules",
        to: "/menu?tab=rules", 
        icon: "📜" 
      },
      { 
        key: "about", 
        labelKey: "menu.about", 
        fallbackLabel: "About",
        to: "/menu?tab=about", 
        icon: "ℹ️" 
      }
    ]
  },
  {
    key: "admin",
    items: [
      { 
        key: "taskManager", 
        labelKey: "menu.taskManager", 
        fallbackLabel: "Task Manager",
        to: "/menu?tab=admin", 
        icon: "🛠️" 
      },
      { 
        key: "devManager", 
        labelKey: "menu.devManager", 
        fallbackLabel: "Dev Manager",
        to: "/menu?tab=dev", 
        icon: "💻" 
      }
    ]
  }
];
