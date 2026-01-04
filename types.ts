
export type GameStatus = 'menu' | 'playing' | 'results' | 'leaderboard';

export interface WordEntry {
  text: string;
  score: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  isPlayer?: boolean;
}

export interface GameConfig {
  gridSize: number; // Количество букв
  timeLimit: number; // Секунды
}
