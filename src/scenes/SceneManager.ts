/**
 * SceneManager wraps an XState actor and provides a high-level API for
 * scene lifecycle management (enter / exit hooks, EventBus bridging,
 * update / render delegation).
 *
 * @module scenes/SceneManager
 */
import { SCENE_ENTER, SCENE_EXIT } from '../core/events';
import { createLogger } from '../infra/logger';
import type { IEventBus, Unsubscribe } from '../types/index';

const log = createLogger('SceneManager');

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Actions facade passed to scene update methods.
 * Wraps raw input actions with convenience methods.
 */
export interface SceneActions {
  consumeKey(keyCode: string): boolean;
  isAction(): boolean;
  time: number;
  _pressed: ReadonlyArray<{ readonly type: string; readonly payload?: unknown; readonly timestamp: number }>;
  _held: ReadonlyArray<{ readonly type: string; readonly payload?: unknown; readonly timestamp: number }>;
  _all: ReadonlyArray<{ readonly type: string; readonly payload?: unknown; readonly timestamp: number }>;
  _heldPayloads: Map<string, unknown>;
  _pressedTypes: Set<string>;
}

export interface SceneHandler {
  enter(store: unknown, bus: IEventBus, services?: unknown): void;
  update(dt: number, actions: SceneActions, store: unknown, bus: IEventBus): void;
  exit(store: unknown, bus: IEventBus): void;
}

interface XStateSnapshot {
  readonly value: string;
  readonly machine: {
    readonly states: Record<string, { readonly on?: Record<string, unknown> }>;
  };
}

interface XStateActor {
  getSnapshot(): XStateSnapshot;
  subscribe(callback: (snapshot: XStateSnapshot) => void): void;
  send(event: Record<string, unknown>): void;
}

type SceneHookCallback = (scene: string) => void;

export class SceneManager {
  readonly #actor: XStateActor;
  readonly #bus: IEventBus;
  #currentScene: string;
  readonly #handlers: Map<string, SceneHandler> = new Map();
  readonly #enterHooks: Map<string, Set<SceneHookCallback>> = new Map();
  readonly #exitHooks: Map<string, Set<SceneHookCallback>> = new Map();

  constructor(actor: XStateActor, bus: IEventBus) {
    this.#actor = actor;
    this.#bus = bus;
    this.#currentScene = this.#readState();

    // Subscribe to state transitions
    this.#actor.subscribe((snapshot: XStateSnapshot) => {
      const next = snapshot.value;
      const prev = this.#currentScene;

      if (next === prev) return;

      this.#fireExit(prev);
      this.#currentScene = next;
      this.#fireEnter(next);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /** Returns the current scene name string. */
  getCurrentScene(): string {
    return this.#currentScene;
  }

  /**
   * Sends an event to the underlying XState actor.
   */
  send(event: string, data?: Record<string, unknown>): void {
    this.#actor.send({ type: event, ...data });
  }

  /**
   * Returns `true` when the given event would trigger a valid transition
   * from the current state.
   */
  canTransition(event: string): boolean {
    const snapshot = this.#actor.getSnapshot();
    const currentState = snapshot.value;
    const stateNode = snapshot.machine.states[currentState];
    if (!stateNode?.on) return false;
    return event in stateNode.on;
  }

  /**
   * Registers a scene handler (enter / update / exit).
   */
  register(name: string, handler: SceneHandler): void {
    this.#handlers.set(name, handler);
  }

  /**
   * Registers a callback that fires when the given scene is entered.
   */
  onEnter(sceneName: string, callback: SceneHookCallback): Unsubscribe {
    if (!this.#enterHooks.has(sceneName)) {
      this.#enterHooks.set(sceneName, new Set());
    }
    this.#enterHooks.get(sceneName)!.add(callback);
    return () => this.#enterHooks.get(sceneName)?.delete(callback);
  }

  /**
   * Registers a callback that fires when the given scene is exited.
   */
  onExit(sceneName: string, callback: SceneHookCallback): Unsubscribe {
    if (!this.#exitHooks.has(sceneName)) {
      this.#exitHooks.set(sceneName, new Set());
    }
    this.#exitHooks.get(sceneName)!.add(callback);
    return () => this.#exitHooks.get(sceneName)?.delete(callback);
  }

  /**
   * Delegates to the current scene handler's `update`.
   */
  update(dt: number, actions: SceneActions, store: unknown): void {
    const handler = this.#handlers.get(this.#currentScene);
    if (handler) {
      try {
        handler.update(dt, actions, store, this.#bus);
      } catch (err: unknown) {
        log.error({ scene: this.#currentScene, err }, `Scene "${this.#currentScene}" update() threw`);
      }
    }
  }

  /**
   * Calls the current scene handler's `enter`.
   * Useful for the initial scene when bootstrapping.
   */
  enterCurrent(store: unknown, services?: unknown): void {
    this.#fireEnter(this.#currentScene, store, services);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  #readState(): string {
    return this.#actor.getSnapshot().value;
  }

  #fireEnter(scene: string, store?: unknown, services?: unknown): void {
    log.info({ scene }, `Scene enter: ${scene}`);
    this.#bus.emit(SCENE_ENTER, { scene });

    const handler = this.#handlers.get(scene);
    if (handler) {
      try {
        handler.enter(store, this.#bus, services);
      } catch (err: unknown) {
        log.error({ scene, err }, `Scene "${scene}" enter() threw`);
      }
    } else {
      log.warn({ scene }, `No handler registered for scene "${scene}"`);
    }

    // Ad-hoc hooks
    const hooks = this.#enterHooks.get(scene);
    if (hooks) {
      for (const fn of hooks) fn(scene);
    }
  }

  #fireExit(scene: string): void {
    log.info({ scene }, `Scene exit: ${scene}`);
    this.#bus.emit(SCENE_EXIT, { scene });

    const handler = this.#handlers.get(scene);
    if (handler) {
      try {
        handler.exit(undefined, this.#bus);
      } catch (err: unknown) {
        log.error({ scene, err }, `Scene "${scene}" exit() threw`);
      }
    }

    // Ad-hoc hooks
    const hooks = this.#exitHooks.get(scene);
    if (hooks) {
      for (const fn of hooks) fn(scene);
    }
  }
}
