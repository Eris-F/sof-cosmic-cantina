export const DIFFICULTIES = {
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
};

export const DIFFICULTY_KEYS = ['easy', 'normal', 'hard'];
