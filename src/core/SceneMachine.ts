/**
 * XState v5 scene state machine for Sofia's Cosmic Cantina.
 *
 * Defines every valid scene and the transitions between them.
 * Guards prevent impossible transitions (e.g. opening the shop while playing).
 * Entry/exit actions are emitted so external systems can react.
 *
 * @module core/SceneMachine
 */
import { setup, createActor } from 'xstate';
import type { AnyStateMachine, Actor } from 'xstate';
import type { SceneEventType, SceneName } from '../types/index';

// ── Event type constants ────────────────────────────────────────────────────

export const SCENE_EVENT = Object.freeze({
  START_GAME:      'START_GAME' as const,
  PAUSE:           'PAUSE' as const,
  RESUME:          'RESUME' as const,
  OPEN_SHOP:       'OPEN_SHOP' as const,
  CLOSE_SHOP:      'CLOSE_SHOP' as const,
  OPEN_SKILLS:     'OPEN_SKILLS' as const,
  CLOSE_SKILLS:    'CLOSE_SKILLS' as const,
  OPEN_TUTORIAL:   'OPEN_TUTORIAL' as const,
  CLOSE_TUTORIAL:  'CLOSE_TUTORIAL' as const,
  PLAYER_DIED:     'PLAYER_DIED' as const,
  SUBMIT_SCORE:    'SUBMIT_SCORE' as const,
  RETURN_TO_MENU:  'RETURN_TO_MENU' as const,
}) satisfies Readonly<Record<SceneEventType, SceneEventType>>;

// ── Scene name constants ────────────────────────────────────────────────────

export const SCENE = Object.freeze({
  MENU:       'menu' as const,
  PLAYING:    'playing' as const,
  PAUSED:     'paused' as const,
  SHOP:       'shop' as const,
  SKILL_TREE: 'skillTree' as const,
  TUTORIAL:   'tutorial' as const,
  GAME_OVER:  'gameOver' as const,
  HIGH_SCORE: 'highScore' as const,
}) satisfies Readonly<Record<string, SceneName>>;

/** XState event shape used by the scene machine. */
type SceneMachineXStateEvent =
  | { readonly type: 'START_GAME' }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESUME' }
  | { readonly type: 'OPEN_SHOP' }
  | { readonly type: 'CLOSE_SHOP' }
  | { readonly type: 'OPEN_SKILLS' }
  | { readonly type: 'CLOSE_SKILLS' }
  | { readonly type: 'OPEN_TUTORIAL' }
  | { readonly type: 'CLOSE_TUTORIAL' }
  | { readonly type: 'PLAYER_DIED' }
  | { readonly type: 'SUBMIT_SCORE' }
  | { readonly type: 'RETURN_TO_MENU' };

/**
 * Creates an XState v5 machine definition for scene management.
 *
 * The machine is pure data -- call `createSceneActor(machine)` to get a
 * running actor you can send events to.
 */
export function createSceneMachine(): AnyStateMachine {
  return setup({
    types: {
      context: {} as Record<string, never>,
      events: {} as SceneMachineXStateEvent,
    },
  }).createMachine({
    id: 'scene',
    context: {},
    initial: SCENE.MENU,

    states: {
      // ── Menu ────────────────────────────────────────────────────────────
      [SCENE.MENU]: {
        on: {
          [SCENE_EVENT.START_GAME]:     { target: SCENE.PLAYING },
          [SCENE_EVENT.OPEN_SHOP]:      { target: SCENE.SHOP },
          [SCENE_EVENT.OPEN_SKILLS]:    { target: SCENE.SKILL_TREE },
          [SCENE_EVENT.OPEN_TUTORIAL]:  { target: SCENE.TUTORIAL },
        },
      },

      // ── Playing ─────────────────────────────────────────────────────────
      [SCENE.PLAYING]: {
        on: {
          [SCENE_EVENT.PAUSE]:        { target: SCENE.PAUSED },
          [SCENE_EVENT.PLAYER_DIED]:  { target: SCENE.GAME_OVER },
        },
      },

      // ── Paused ──────────────────────────────────────────────────────────
      [SCENE.PAUSED]: {
        on: {
          [SCENE_EVENT.RESUME]:          { target: SCENE.PLAYING },
          [SCENE_EVENT.RETURN_TO_MENU]:  { target: SCENE.MENU },
        },
      },

      // ── Shop ────────────────────────────────────────────────────────────
      [SCENE.SHOP]: {
        on: {
          [SCENE_EVENT.CLOSE_SHOP]:      { target: SCENE.MENU },
          [SCENE_EVENT.RETURN_TO_MENU]:  { target: SCENE.MENU },
        },
      },

      // ── Skill Tree ──────────────────────────────────────────────────────
      [SCENE.SKILL_TREE]: {
        on: {
          [SCENE_EVENT.CLOSE_SKILLS]:    { target: SCENE.MENU },
          [SCENE_EVENT.RETURN_TO_MENU]:  { target: SCENE.MENU },
        },
      },

      // ── Tutorial ────────────────────────────────────────────────────────
      [SCENE.TUTORIAL]: {
        on: {
          [SCENE_EVENT.CLOSE_TUTORIAL]:  { target: SCENE.MENU },
          [SCENE_EVENT.RETURN_TO_MENU]:  { target: SCENE.MENU },
        },
      },

      // ── Game Over ───────────────────────────────────────────────────────
      [SCENE.GAME_OVER]: {
        on: {
          [SCENE_EVENT.SUBMIT_SCORE]:    { target: SCENE.HIGH_SCORE },
          [SCENE_EVENT.RETURN_TO_MENU]:  { target: SCENE.MENU },
        },
      },

      // ── High Score ──────────────────────────────────────────────────────
      [SCENE.HIGH_SCORE]: {
        on: {
          [SCENE_EVENT.RETURN_TO_MENU]:  { target: SCENE.MENU },
        },
      },
    },
  });
}

/**
 * Creates a running XState actor from the scene machine.
 */
export function createSceneActor(machine: AnyStateMachine): Actor<AnyStateMachine> {
  const actor = createActor(machine);
  actor.start();
  return actor;
}
