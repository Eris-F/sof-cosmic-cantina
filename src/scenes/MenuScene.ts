/**
 * Menu scene handler.
 *
 * Manages difficulty cycling, game mode toggling, and dispatches
 * scene transitions. Touch zones imported from zones/menu.
 *
 * @module scenes/MenuScene
 */
import { SCENE_EVENT } from '../core/SceneMachine';
import { DIFFICULTY_KEYS } from '../difficulty';
import { TAP } from '../input/Actions';
import { zoneHit } from '../zones/Zone';
import {
  SHOP_BTN, SKILLS_BTN, TUTORIAL_BTN,
  DIFF_LEFT, DIFF_RIGHT, MODE_LEFT, MODE_RIGHT,
  START_ZONE, TITLE_ZONE,
} from '../zones/menu';
import type { IEventBus } from '../types/index';
import type { SceneHandler, SceneActions } from './SceneManager';

interface MenuState {
  catTimer: number;
  difficultyIndex: number;
  difficulty: string;
  gameMode: string;
}

export function createMenuScene(): SceneHandler {
  let state: MenuState | null = null;

  return {
    enter(store: unknown, _bus: IEventBus): void {
      const gameStore = store as { getState?: () => { config: { difficulty: string; gameMode: string } } } | null;
      const config = gameStore?.getState?.()?.config;
      const diffIdx = DIFFICULTY_KEYS.indexOf((config?.difficulty ?? 'normal') as typeof DIFFICULTY_KEYS[number]);
      state = {
        catTimer: 0,
        difficultyIndex: diffIdx >= 0 ? diffIdx : 1,
        difficulty: config?.difficulty ?? 'normal',
        gameMode: config?.gameMode ?? 'classic',
      };
    },

    update(dt: number, actions: SceneActions, store: unknown, bus: IEventBus): void {
      if (!state) return;

      const { consumeKey } = actions;
      state = { ...state, catTimer: state.catTimer + dt };

      // ── Touch input ─────────────────────────────────────────────────
      const tap = actions._pressed.find(a => a.type === TAP);
      if (tap && tap.payload) {
        const { x, y } = tap.payload as { x: number; y: number };

        if (zoneHit(SHOP_BTN, x, y)) {
          bus.emit(SCENE_EVENT.OPEN_SHOP);
          return;
        }
        if (zoneHit(SKILLS_BTN, x, y)) {
          bus.emit(SCENE_EVENT.OPEN_SKILLS);
          return;
        }
        if (zoneHit(TUTORIAL_BTN, x, y)) {
          bus.emit(SCENE_EVENT.OPEN_TUTORIAL);
          return;
        }
        if (zoneHit(DIFF_LEFT, x, y)) {
          cycleDifficulty(state, -1);
          return;
        }
        if (zoneHit(DIFF_RIGHT, x, y)) {
          cycleDifficulty(state, 1);
          return;
        }
        if (zoneHit(MODE_LEFT, x, y) || zoneHit(MODE_RIGHT, x, y)) {
          state = { ...state, gameMode: state.gameMode === 'classic' ? 'endless' : 'classic' };
          return;
        }
        if (zoneHit(START_ZONE, x, y) || zoneHit(TITLE_ZONE, x, y)) {
          emitStart(store, state, bus);
          return;
        }
        // Tap in button area that missed all buttons → ignore
      }

      // ── Keyboard input ──────────────────────────────────────────────
      if (consumeKey('ArrowLeft') || consumeKey('KeyA')) {
        cycleDifficulty(state, -1);
      }
      if (consumeKey('ArrowRight') || consumeKey('KeyD')) {
        cycleDifficulty(state, 1);
      }
      if (consumeKey('ArrowUp') || consumeKey('ArrowDown') || consumeKey('KeyW') || consumeKey('KeyS')) {
        state = { ...state, gameMode: state.gameMode === 'classic' ? 'endless' : 'classic' };
      }
      if (consumeKey('Space') || consumeKey('Enter')) {
        emitStart(store, state, bus);
        return;
      }
      if (consumeKey('KeyP')) { bus.emit(SCENE_EVENT.OPEN_SHOP); return; }
      if (consumeKey('KeyK')) { bus.emit(SCENE_EVENT.OPEN_SKILLS); return; }
      if (consumeKey('KeyT')) { bus.emit(SCENE_EVENT.OPEN_TUTORIAL); return; }
    },

    exit(_store: unknown, _bus: IEventBus): void {
      state = null;
    },
  };

  function cycleDifficulty(s: MenuState, dir: number): void {
    const difficultyIndex = (s.difficultyIndex + dir + DIFFICULTY_KEYS.length) % DIFFICULTY_KEYS.length;
    state = { ...s, difficultyIndex, difficulty: DIFFICULTY_KEYS[difficultyIndex] ?? 'normal' };
  }
}

function emitStart(store: unknown, state: MenuState, bus: IEventBus): void {
  const gameStore = store as { update?: (fn: (draft: { config: { difficulty: string; gameMode: string } }) => void) => void };
  if (gameStore.update) {
    const diff = state.difficulty;
    const mode = state.gameMode;
    gameStore.update((draft) => {
      draft.config.difficulty = diff;
      draft.config.gameMode = mode;
    });
  }
  bus.emit(SCENE_EVENT.START_GAME);
}
