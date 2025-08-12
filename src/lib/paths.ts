
// Firestore collection paths
export const col = {
  users: 'users',
  tasks: 'tasks',
  suggestions: 'suggestions',
  players: 'players',
  games: 'games',
  admin: 'admin'
} as const;

// Common document paths
export const paths = {
  user: (uid: string) => `${col.users}/${uid}`,
  task: (taskId: string) => `${col.tasks}/${taskId}`,
  suggestion: (suggestionId: string) => `${col.suggestions}/${suggestionId}`,
  player: (playerId: string) => `${col.players}/${playerId}`,
  game: (gameId: string) => `${col.games}/${gameId}`,
  adminConfig: () => `${col.admin}/config`
} as const;
