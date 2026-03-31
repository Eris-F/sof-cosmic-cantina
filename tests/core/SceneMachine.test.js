/**
 * Tests for SceneMachine — XState v5 scene state machine.
 *
 * Covers:
 *  - All valid transitions
 *  - Invalid transitions are rejected (state unchanged)
 *  - Enter / exit hooks fire on SceneManager
 *  - Guards prevent illegal transitions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import {
  createSceneMachine,
  createSceneActor,
  SCENE_EVENT,
  SCENE,
} from '../../src/core/SceneMachine.js';
import { SceneManager } from '../../src/scenes/SceneManager.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeActor() {
  return createSceneActor(createSceneMachine());
}

function stateOf(actor) {
  return /** @type {string} */ (actor.getSnapshot().value);
}

function makeBus() {
  return { emit: vi.fn() };
}

// ── Machine: valid transitions ──────────────────────────────────────────────

describe('SceneMachine — valid transitions', () => {
  /** @type {ReturnType<typeof createSceneActor>} */
  let actor;

  beforeEach(() => {
    actor = makeActor();
  });

  // menu → *
  it('menu → playing via START_GAME', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);
  });

  it('menu → shop via OPEN_SHOP', () => {
    actor.send({ type: SCENE_EVENT.OPEN_SHOP });
    expect(stateOf(actor)).toBe(SCENE.SHOP);
  });

  it('menu → skillTree via OPEN_SKILLS', () => {
    actor.send({ type: SCENE_EVENT.OPEN_SKILLS });
    expect(stateOf(actor)).toBe(SCENE.SKILL_TREE);
  });

  it('menu → tutorial via OPEN_TUTORIAL', () => {
    actor.send({ type: SCENE_EVENT.OPEN_TUTORIAL });
    expect(stateOf(actor)).toBe(SCENE.TUTORIAL);
  });

  // playing → *
  it('playing → paused via PAUSE', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PAUSE });
    expect(stateOf(actor)).toBe(SCENE.PAUSED);
  });

  it('playing → gameOver via PLAYER_DIED', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PLAYER_DIED });
    expect(stateOf(actor)).toBe(SCENE.GAME_OVER);
  });

  // paused → *
  it('paused → playing via RESUME', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PAUSE });
    actor.send({ type: SCENE_EVENT.RESUME });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);
  });

  it('paused → menu via RETURN_TO_MENU', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PAUSE });
    actor.send({ type: SCENE_EVENT.RETURN_TO_MENU });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  // shop → menu
  it('shop → menu via CLOSE_SHOP', () => {
    actor.send({ type: SCENE_EVENT.OPEN_SHOP });
    actor.send({ type: SCENE_EVENT.CLOSE_SHOP });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  it('shop → menu via RETURN_TO_MENU', () => {
    actor.send({ type: SCENE_EVENT.OPEN_SHOP });
    actor.send({ type: SCENE_EVENT.RETURN_TO_MENU });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  // skillTree → menu
  it('skillTree → menu via CLOSE_SKILLS', () => {
    actor.send({ type: SCENE_EVENT.OPEN_SKILLS });
    actor.send({ type: SCENE_EVENT.CLOSE_SKILLS });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  // tutorial → menu
  it('tutorial → menu via CLOSE_TUTORIAL', () => {
    actor.send({ type: SCENE_EVENT.OPEN_TUTORIAL });
    actor.send({ type: SCENE_EVENT.CLOSE_TUTORIAL });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  // gameOver → *
  it('gameOver → highScore via SUBMIT_SCORE', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PLAYER_DIED });
    actor.send({ type: SCENE_EVENT.SUBMIT_SCORE });
    expect(stateOf(actor)).toBe(SCENE.HIGH_SCORE);
  });

  it('gameOver → menu via RETURN_TO_MENU', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PLAYER_DIED });
    actor.send({ type: SCENE_EVENT.RETURN_TO_MENU });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  // highScore → menu
  it('highScore → menu via RETURN_TO_MENU', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.PLAYER_DIED });
    actor.send({ type: SCENE_EVENT.SUBMIT_SCORE });
    actor.send({ type: SCENE_EVENT.RETURN_TO_MENU });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });
});

// ── Machine: invalid transitions ────────────────────────────────────────────

describe('SceneMachine — invalid transitions (no-ops)', () => {
  let actor;

  beforeEach(() => {
    actor = makeActor();
  });

  it('PAUSE from menu is ignored', () => {
    actor.send({ type: SCENE_EVENT.PAUSE });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  it('RESUME from menu is ignored', () => {
    actor.send({ type: SCENE_EVENT.RESUME });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  it('OPEN_SHOP from playing is ignored', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.OPEN_SHOP });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);
  });

  it('OPEN_SKILLS from playing is ignored', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.OPEN_SKILLS });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);
  });

  it('START_GAME from playing is ignored', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);
  });

  it('PLAYER_DIED from menu is ignored', () => {
    actor.send({ type: SCENE_EVENT.PLAYER_DIED });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  it('SUBMIT_SCORE from playing is ignored', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    actor.send({ type: SCENE_EVENT.SUBMIT_SCORE });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);
  });

  it('CLOSE_SHOP from menu is ignored', () => {
    actor.send({ type: SCENE_EVENT.CLOSE_SHOP });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  it('START_GAME from shop is ignored', () => {
    actor.send({ type: SCENE_EVENT.OPEN_SHOP });
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(stateOf(actor)).toBe(SCENE.SHOP);
  });
});

// ── Machine: initial state ──────────────────────────────────────────────────

describe('SceneMachine — initial state', () => {
  it('starts in menu', () => {
    const actor = makeActor();
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });
});

// ── SceneManager: enter / exit hooks ────────────────────────────────────────

describe('SceneManager — enter / exit hooks', () => {
  let actor;
  let bus;
  let mgr;

  beforeEach(() => {
    actor = makeActor();
    bus = makeBus();
    mgr = new SceneManager(actor, bus);
  });

  it('fires onEnter callback when scene is entered', () => {
    const enterSpy = vi.fn();
    mgr.onEnter(SCENE.PLAYING, enterSpy);

    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(enterSpy).toHaveBeenCalledWith(SCENE.PLAYING);
  });

  it('fires onExit callback when scene is exited', () => {
    const exitSpy = vi.fn();
    mgr.onExit(SCENE.MENU, exitSpy);

    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(exitSpy).toHaveBeenCalledWith(SCENE.MENU);
  });

  it('emits SCENE_ENTER on the event bus', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(bus.emit).toHaveBeenCalledWith('scene:enter', { scene: SCENE.PLAYING });
  });

  it('emits SCENE_EXIT on the event bus', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(bus.emit).toHaveBeenCalledWith('scene:exit', { scene: SCENE.MENU });
  });

  it('unsubscribe removes the hook', () => {
    const spy = vi.fn();
    const unsub = mgr.onEnter(SCENE.PLAYING, spy);
    unsub();

    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── SceneManager: getCurrentScene / canTransition ───────────────────────────

describe('SceneManager — getCurrentScene / canTransition', () => {
  let actor;
  let bus;
  let mgr;

  beforeEach(() => {
    actor = makeActor();
    bus = makeBus();
    mgr = new SceneManager(actor, bus);
  });

  it('getCurrentScene returns "menu" initially', () => {
    expect(mgr.getCurrentScene()).toBe(SCENE.MENU);
  });

  it('getCurrentScene updates after transition', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(mgr.getCurrentScene()).toBe(SCENE.PLAYING);
  });

  it('canTransition returns true for valid event', () => {
    expect(mgr.canTransition(SCENE_EVENT.START_GAME)).toBe(true);
  });

  it('canTransition returns false for invalid event', () => {
    expect(mgr.canTransition(SCENE_EVENT.PAUSE)).toBe(false);
  });

  it('canTransition updates after state change', () => {
    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(mgr.canTransition(SCENE_EVENT.PAUSE)).toBe(true);
    expect(mgr.canTransition(SCENE_EVENT.START_GAME)).toBe(false);
  });
});

// ── SceneManager: registered handler lifecycle ──────────────────────────────

describe('SceneManager — registered handlers', () => {
  let actor;
  let bus;
  let mgr;

  beforeEach(() => {
    actor = makeActor();
    bus = makeBus();
    mgr = new SceneManager(actor, bus);
  });

  it('calls handler.enter on transition into scene', () => {
    const handler = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    mgr.register(SCENE.PLAYING, handler);

    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(handler.enter).toHaveBeenCalled();
  });

  it('calls handler.exit on transition out of scene', () => {
    const handler = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    mgr.register(SCENE.MENU, handler);

    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(handler.exit).toHaveBeenCalled();
  });

  it('delegates update to the current scene handler', () => {
    const handler = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    mgr.register(SCENE.MENU, handler);

    mgr.update(0.016, {}, {});
    expect(handler.update).toHaveBeenCalledWith(0.016, {}, {}, bus);
  });
});

// ── Full round trip ─────────────────────────────────────────────────────────

describe('SceneMachine — full round trip', () => {
  it('menu → playing → paused → playing → died → gameOver → highScore → menu', () => {
    const actor = makeActor();

    actor.send({ type: SCENE_EVENT.START_GAME });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);

    actor.send({ type: SCENE_EVENT.PAUSE });
    expect(stateOf(actor)).toBe(SCENE.PAUSED);

    actor.send({ type: SCENE_EVENT.RESUME });
    expect(stateOf(actor)).toBe(SCENE.PLAYING);

    actor.send({ type: SCENE_EVENT.PLAYER_DIED });
    expect(stateOf(actor)).toBe(SCENE.GAME_OVER);

    actor.send({ type: SCENE_EVENT.SUBMIT_SCORE });
    expect(stateOf(actor)).toBe(SCENE.HIGH_SCORE);

    actor.send({ type: SCENE_EVENT.RETURN_TO_MENU });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });

  it('menu → shop → menu → skillTree → menu → tutorial → menu', () => {
    const actor = makeActor();

    actor.send({ type: SCENE_EVENT.OPEN_SHOP });
    expect(stateOf(actor)).toBe(SCENE.SHOP);

    actor.send({ type: SCENE_EVENT.CLOSE_SHOP });
    expect(stateOf(actor)).toBe(SCENE.MENU);

    actor.send({ type: SCENE_EVENT.OPEN_SKILLS });
    expect(stateOf(actor)).toBe(SCENE.SKILL_TREE);

    actor.send({ type: SCENE_EVENT.CLOSE_SKILLS });
    expect(stateOf(actor)).toBe(SCENE.MENU);

    actor.send({ type: SCENE_EVENT.OPEN_TUTORIAL });
    expect(stateOf(actor)).toBe(SCENE.TUTORIAL);

    actor.send({ type: SCENE_EVENT.CLOSE_TUTORIAL });
    expect(stateOf(actor)).toBe(SCENE.MENU);
  });
});

// ── SCENE_EVENT / SCENE constants ───────────────────────────────────────────

describe('Constants — frozen and complete', () => {
  it('SCENE_EVENT is frozen', () => {
    expect(Object.isFrozen(SCENE_EVENT)).toBe(true);
  });

  it('SCENE is frozen', () => {
    expect(Object.isFrozen(SCENE)).toBe(true);
  });

  it('SCENE has all 8 scenes', () => {
    expect(Object.keys(SCENE)).toHaveLength(8);
  });

  it('SCENE_EVENT has all 12 events', () => {
    expect(Object.keys(SCENE_EVENT)).toHaveLength(12);
  });
});
