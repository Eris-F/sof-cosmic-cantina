/**
 * DeathSequence — orchestrates the player death animation.
 *
 * On death: freeze entities → particle burst → screen shake → flash → slowmo → game over.
 * The sequence runs over ~800ms before transitioning to the game over scene.
 *
 * @module systems/DeathSequence
 */
import type { GameStore } from '../types/systems';
import type { GameState } from '../types/state';
import type { Draft } from 'immer';

export interface DeathSequenceState {
  active: boolean;
  timer: number;
  phase: 'freeze' | 'explode' | 'fade' | 'done';
}

const FREEZE_DURATION = 0.2;   // brief freeze frame
const EXPLODE_DURATION = 0.4;  // particles + shake
const FADE_DURATION = 0.3;     // slow fade

export function createDeathSequenceState(): DeathSequenceState {
  return { active: false, timer: 0, phase: 'freeze' };
}

/**
 * Start the death sequence. Called when player.alive becomes false.
 */
export function startDeathSequence(store: GameStore): void {
  store.update((draft: Draft<GameState>) => {
    // We store death sequence in a temporary field on effects
    (draft as unknown as Record<string, unknown>).__deathSeq = {
      active: true,
      timer: 0,
      phase: 'freeze',
    };
  });
}

/**
 * Update the death sequence. Returns true if the sequence is still running.
 */
export function updateDeathSequence(store: GameStore, dt: number): boolean {
  const state = store.getState();
  const seq = (state as unknown as Record<string, unknown>).__deathSeq as DeathSequenceState | undefined;
  if (!seq || !seq.active) return false;

  const newTimer = seq.timer + dt;
  let newPhase = seq.phase;

  if (seq.phase === 'freeze' && newTimer >= FREEZE_DURATION) {
    newPhase = 'explode';
  } else if (seq.phase === 'explode' && newTimer >= FREEZE_DURATION + EXPLODE_DURATION) {
    newPhase = 'fade';
  } else if (seq.phase === 'fade' && newTimer >= FREEZE_DURATION + EXPLODE_DURATION + FADE_DURATION) {
    newPhase = 'done';
  }

  store.update((draft: Draft<GameState>) => {
    const s = (draft as unknown as Record<string, unknown>).__deathSeq as DeathSequenceState;
    s.timer = newTimer;
    s.phase = newPhase;
    if (newPhase === 'done') {
      s.active = false;
    }
  });

  return newPhase !== 'done';
}

/**
 * Check if the death sequence is in the freeze phase (all entities frozen).
 */
export function isDeathFreeze(store: GameStore): boolean {
  const state = store.getState();
  const seq = (state as unknown as Record<string, unknown>).__deathSeq as DeathSequenceState | undefined;
  return seq?.phase === 'freeze';
}

/**
 * Get the current death sequence state for rendering.
 */
export function getDeathSequence(store: GameStore): DeathSequenceState | null {
  const state = store.getState();
  const seq = (state as unknown as Record<string, unknown>).__deathSeq as DeathSequenceState | undefined;
  return seq?.active ? seq : null;
}
