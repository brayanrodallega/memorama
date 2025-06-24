export interface Card {
  id: number;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
  value: string;
}

export interface GameSession {
  id: string;
  mode: 'single' | 'multiplayer';
  level: 'facil' | 'medio' | 'dificil';
  config: GameConfig;
  players: Player[];
  currentPlayerIndex: number;
  cards: Card[];
  startTime: Date;
  endTime?: Date;
  status: 'waiting' | 'playing' | 'finished';
  flippedCards: Card[];
  moves: number;
}

export interface Player {
  id?: number;
  name: string;
  email: string;
  score: number;
  matches: number;
  isCurrentPlayer: boolean;
  gameResult?: 'win' | 'lose' | 'tie';
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  averageTime: number;
  bestTime: number;
  totalMatches: number;
}

export interface GameConfig {
  level: 'facil' | 'medio' | 'dificil';
  cardCount: number;
  timeLimit?: number;
}

export const GAME_LEVELS: Record<string, GameConfig> = {
  facil: { level: 'facil', cardCount: 8, timeLimit: 30 }, // 4x2 = 8 cartas, 30 segundos
  medio: { level: 'medio', cardCount: 12, timeLimit: 40 }, // 4x3 = 12 cartas, 40 segundos
  dificil: { level: 'dificil', cardCount: 16, timeLimit: 50 } // 4x4 = 16 cartas, 50 segundos
}; 