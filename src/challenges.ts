import { CANVAS_WIDTH } from './constants';

export type ChallengeTrackStat = 'kills' | 'survive' | 'streak' | 'powerups';

export interface ChallengeType {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly timeLimit: number;
  readonly target: number;
  readonly trackStat: ChallengeTrackStat;
  readonly reward: number;
}

export interface ChallengeState {
  readonly challenge: ChallengeType;
  timeLeft: number;
  progress: number;
  hitStreak: number;
  completed: boolean;
  failed: boolean;
  wasHit: boolean;
  showResult: number;
}

const CHALLENGE_TYPES: readonly ChallengeType[] = [
  {
    id: 'speed_kill',
    name: 'SPEED KILL',
    desc: 'Kill 8 enemies in 6 seconds!',
    timeLimit: 6,
    target: 8,
    trackStat: 'kills',
    reward: 200,
  },
  {
    id: 'dodge_master',
    name: 'DODGE MASTER',
    desc: 'Survive 8 seconds without getting hit!',
    timeLimit: 8,
    target: 0,
    trackStat: 'survive',
    reward: 250,
  },
  {
    id: 'sharpshooter',
    name: 'SHARPSHOOTER',
    desc: 'Hit 6 enemies without missing!',
    timeLimit: 15,
    target: 6,
    trackStat: 'streak',
    reward: 300,
  },
  {
    id: 'coin_grab',
    name: 'COIN GRAB',
    desc: 'Collect 5 power-ups in 10 seconds!',
    timeLimit: 10,
    target: 5,
    trackStat: 'powerups',
    reward: 350,
  },
] as const;

// 20% chance a challenge portal appears after a wave clear
export function shouldSpawnChallenge(wave: number): boolean {
  if (wave < 3) return false;
  return Math.random() < 0.2;
}

export function pickChallenge(): ChallengeType {
  return CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)]!;
}

export function createChallengeState(challenge: ChallengeType): ChallengeState {
  return {
    challenge,
    timeLeft: challenge.timeLimit,
    progress: 0,
    hitStreak: 0,
    completed: false,
    failed: false,
    wasHit: false,
    showResult: 0,
  };
}

export function updateChallenge(state: ChallengeState, dt: number): void {
  if (state.completed || state.failed) {
    state.showResult += dt;
    return;
  }

  state.timeLeft = Math.max(0, state.timeLeft - dt);

  // Survive challenge — progress is just time survived
  if (state.challenge.trackStat === 'survive') {
    if (!state.wasHit && state.timeLeft <= 0) {
      state.completed = true;
    }
    if (state.wasHit) {
      state.failed = true;
    }
    return;
  }

  // Other challenges — check completion
  if (state.progress >= state.challenge.target) {
    state.completed = true;
    return;
  }

  // Time ran out
  if (state.timeLeft <= 0) {
    state.failed = true;
  }
}

export function challengeOnKill(state: ChallengeState): void {
  if (state.challenge.trackStat === 'kills') {
    state.progress += 1;
  }
  if (state.challenge.trackStat === 'streak') {
    state.hitStreak += 1;
    state.progress = state.hitStreak;
  }
}

export function challengeOnMiss(state: ChallengeState): void {
  if (state.challenge.trackStat === 'streak') {
    state.hitStreak = 0;
    state.progress = 0;
  }
}

export function challengeOnHit(state: ChallengeState): void {
  state.wasHit = true;
}

export function challengeOnPowerup(state: ChallengeState): void {
  if (state.challenge.trackStat === 'powerups') {
    state.progress += 1;
  }
}

export function renderChallenge(ctx: CanvasRenderingContext2D, state: ChallengeState, _time: number): void {
  const cx = CANVAS_WIDTH / 2;

  // Challenge HUD bar at top
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

  ctx.textAlign = 'center';

  if (state.completed) {
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CHALLENGE COMPLETE!', cx, 18);
    ctx.fillStyle = '#ffcc00';
    ctx.font = '12px monospace';
    ctx.fillText(`+${state.challenge.reward} COINS`, cx, 34);
  } else if (state.failed) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CHALLENGE FAILED', cx, 26);
  } else {
    // Challenge name
    ctx.fillStyle = '#ff88ff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(state.challenge.name, cx, 14);

    // Progress
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    if (state.challenge.trackStat === 'survive') {
      ctx.fillText(`SURVIVE: ${Math.ceil(state.timeLeft)}s`, cx, 28);
    } else {
      ctx.fillText(`${state.progress}/${state.challenge.target}`, cx - 40, 28);
      // Timer
      const urgentColor = state.timeLeft < 3 ? '#ff4444' : '#ffcc00';
      ctx.fillStyle = urgentColor;
      ctx.fillText(`${Math.ceil(state.timeLeft)}s`, cx + 40, 28);
    }

    // Progress bar
    const barW = 120;
    const pct = state.challenge.trackStat === 'survive'
      ? (state.challenge.timeLimit - state.timeLeft) / state.challenge.timeLimit
      : state.progress / state.challenge.target;
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - barW / 2, 32, barW, 4);
    ctx.fillStyle = '#ff88ff';
    ctx.fillRect(cx - barW / 2, 32, barW * Math.min(1, pct), 4);
  }

  ctx.textAlign = 'left';
}

export function isChallengeOver(state: ChallengeState): boolean {
  return (state.completed || state.failed) && state.showResult > 2.0;
}
