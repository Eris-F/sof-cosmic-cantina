export type DifficultyKey = 'easy' | 'normal' | 'hard';

export interface DifficultySettings {
  readonly label: string;
  readonly color: string;
  readonly lives: number;
  readonly enemySpeedMul: number;
  readonly enemyFireMul: number;
  readonly playerSpeedMul: number;
  readonly scoreMul: number;
  readonly extraRows?: number;
}

export const DIFFICULTIES: Readonly<Record<DifficultyKey, DifficultySettings>> = {
  easy: {
    label: 'EASY',
    color: '#44ff44',
    lives: 5,
    enemySpeedMul: 0.7,
    enemyFireMul: 1.5, // higher = slower fire
    playerSpeedMul: 1.1,
    scoreMul: 0.5,
  },
  normal: {
    label: 'NORMAL',
    color: '#ffcc00',
    lives: 3,
    enemySpeedMul: 1.0,
    enemyFireMul: 1.0,
    playerSpeedMul: 1.0,
    scoreMul: 1.0,
  },
  hard: {
    label: 'HARD',
    color: '#ff4444',
    lives: 2,
    enemySpeedMul: 1.4,
    enemyFireMul: 0.6, // lower = faster fire
    playerSpeedMul: 1.0,
    scoreMul: 2.0,
  },
} as const;

export const DIFFICULTY_KEYS: readonly DifficultyKey[] = ['easy', 'normal', 'hard'] as const;
