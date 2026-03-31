/**
 * Test harness — exposes game internals on window for Playwright E2E tests.
 * Tree-shaken out of production builds via import.meta.env.DEV guard in main.ts.
 *
 * @module dev/harness
 */

// Use types/index GameState which matches GameStore (scene: string, not SceneId)
import type { GameState, IEventBus, IGameLoop, GameStore } from '../types/index';
import type { Zone } from '../zones/Zone';
import { createInitialState } from '../state/GameState';
import type { Draft } from 'immer';

// ── Type aliases ──────────────────────────────────────────────────────────────

type EventLogEntry = { event: string; data: unknown; time: number; frame: number };
type InputLogEntry = { type: string; code?: string; x?: number; y?: number; time: number; frame: number };
type SceneSnapshot = { from: string; to: string; state: unknown; time: number };
type HUDState = { score: number; health: number; lives: number; wave: number; coins: number };

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface HarnessAPI {
  // -- Existing (moved from main.ts) --
  __gameStore: GameStore;
  __bus: IEventBus;
  __sceneManager: unknown;
  __shopActions: unknown;
  __skillActions: unknown;
  __loop: IGameLoop;
  __getViewport: () => unknown;
  __errors: string[];
  __frame: number;

  // Time control
  __tick: (dt?: number) => void;
  __tickN: (n: number, dt?: number) => void;
  __pause: () => void;
  __resume: () => void;

  // RNG control
  __seed: (n: number) => void;
  __unseed: () => void;

  // Event log
  __eventLog: EventLogEntry[];
  __clearEventLog: () => void;
  __getEvents: (type?: string) => EventLogEntry[];

  // Input log
  __inputLog: InputLogEntry[];
  __clearInputLog: () => void;
  __inputRecording: boolean;

  // Scene snapshots
  __sceneSnapshots: SceneSnapshot[];

  // Debug overlay
  __toggleDebugOverlay: () => void;
  __setDebugOverlay: (on: boolean) => void;

  // -- NEW APIs --

  // State manipulation
  __setState: (partial: Record<string, unknown>) => void;
  __resetState: () => void;
  __setScene: (sceneId: string) => void;
  __getState: () => GameState;

  // Zone queries
  __getZones: () => Zone[];
  __getZone: (name: string) => Zone | null;

  // Event waiting
  __waitForEvent: (type: string, timeoutMs?: number) => Promise<unknown>;
  __waitForScene: (sceneId: string, timeoutMs?: number) => Promise<void>;

  // Time helpers
  __tickUntil: (predicate: () => boolean, maxFrames?: number) => number;
  __tickSeconds: (seconds: number) => void;

  // Entity queries
  __getEntityCount: (type?: string) => number;
  __getListenerCount: (event?: string) => number;

  // HUD / render state
  __getHUDState: () => HUDState;
  __getParticleCount: () => number;
}

export interface HarnessDeps {
  store: GameStore;
  bus: IEventBus;
  sceneManager: unknown;
  shopActions: unknown;
  skillActions: unknown;
  loop: IGameLoop;
  getViewport: () => unknown;
  canvas: HTMLCanvasElement;
}

// ── Zone collection helpers ───────────────────────────────────────────────────

function isZone(val: unknown): val is Zone {
  if (val === null || typeof val !== 'object') return false;
  const v = val as Record<string, unknown>;
  return (
    typeof v['name'] === 'string' &&
    typeof v['x'] === 'number' &&
    typeof v['y'] === 'number' &&
    typeof v['w'] === 'number' &&
    typeof v['h'] === 'number'
  );
}

function collectZonesFromModule(mod: Record<string, unknown>): Zone[] {
  const collected: Zone[] = [];
  for (const val of Object.values(mod)) {
    if (isZone(val)) {
      collected.push(val);
    }
  }
  return collected;
}

// ── Main installer ────────────────────────────────────────────────────────────

/**
 * Installs all test harness APIs onto `window.__*` for use by Playwright tests.
 * Only call this in DEV mode — the caller (main.ts) is responsible for guarding.
 */
export function installHarness(deps: HarnessDeps): void {
  const w = window as unknown as Record<string, unknown>;
  const { store, bus, sceneManager, shopActions, skillActions, loop, getViewport, canvas } = deps;

  // ── Core refs ─────────────────────────────────────────────────────────────

  w.__gameStore = store;
  w.__bus = bus;
  w.__sceneManager = sceneManager;
  w.__shopActions = shopActions;
  w.__skillActions = skillActions;
  w.__loop = loop;
  w.__getViewport = getViewport;
  w.__errors = [];
  w.__frame = 0;

  // ── Time control ─────────────────────────────────────────────────────────

  w.__tick = (dt?: number): void => {
    loop.tick(dt);
    w.__frame = ((w.__frame as number) ?? 0) + 1;
  };

  w.__tickN = (n: number, dt?: number): void => {
    for (let i = 0; i < n; i++) {
      loop.tick(dt);
      w.__frame = ((w.__frame as number) ?? 0) + 1;
    }
  };

  w.__pause = (): void => loop.stop();
  w.__resume = (): void => loop.start();

  // ── RNG control ──────────────────────────────────────────────────────────

  import('../core/Random').then(({ seed: seedFn, unseed }) => {
    w.__seed = seedFn;
    w.__unseed = unseed;
  });

  // ── Event log ────────────────────────────────────────────────────────────

  const MAX_EVENT_LOG = 1000;
  const eventLog: EventLogEntry[] = [];
  w.__eventLog = eventLog;
  w.__clearEventLog = (): void => { eventLog.length = 0; };
  w.__getEvents = (type?: string): EventLogEntry[] =>
    type ? eventLog.filter((e) => e.event === type) : [...eventLog];

  bus.on('*', ((eventName: string, data: unknown) => {
    if (eventLog.length >= MAX_EVENT_LOG) eventLog.shift();
    eventLog.push({
      event: eventName,
      data,
      time: store.getState().time,
      frame: (w.__frame as number) ?? 0,
    });
  }) as (data: unknown) => void);

  // ── Input recording ──────────────────────────────────────────────────────

  const MAX_INPUT_LOG = 5000;
  const inputLog: InputLogEntry[] = [];
  w.__inputLog = inputLog;
  w.__clearInputLog = (): void => { inputLog.length = 0; };
  w.__inputRecording = true;

  const pushInput = (entry: InputLogEntry): void => {
    if (!(w.__inputRecording as boolean)) return;
    if (inputLog.length >= MAX_INPUT_LOG) inputLog.shift();
    inputLog.push(entry);
  };

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    pushInput({ type: 'keydown', code: e.code, time: performance.now(), frame: (w.__frame as number) ?? 0 });
  });

  window.addEventListener('keyup', (e: KeyboardEvent) => {
    pushInput({ type: 'keyup', code: e.code, time: performance.now(), frame: (w.__frame as number) ?? 0 });
  });

  canvas.addEventListener('touchstart', (e: TouchEvent) => {
    for (const t of Array.from(e.touches)) {
      const rect = canvas.getBoundingClientRect();
      pushInput({
        type: 'touchstart',
        x: ((t.clientX - rect.left) / rect.width) * 480,
        y: ((t.clientY - rect.top) / rect.height) * 640,
        time: performance.now(),
        frame: (w.__frame as number) ?? 0,
      });
    }
  });

  canvas.addEventListener('touchend', () => {
    pushInput({ type: 'touchend', time: performance.now(), frame: (w.__frame as number) ?? 0 });
  });

  // ── Scene snapshots (initialised here; main.ts sceneActor.subscribe populates) ──

  if (!Array.isArray(w.__sceneSnapshots)) {
    w.__sceneSnapshots = [] as SceneSnapshot[];
  }

  // ── Debug overlay ─────────────────────────────────────────────────────────

  import('../render/DebugOverlay').then(({ toggleDebugOverlay, setDebugOverlay }) => {
    w.__toggleDebugOverlay = toggleDebugOverlay;
    w.__setDebugOverlay = setDebugOverlay;
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Backquote') toggleDebugOverlay();
    });
  });

  // ── Error collection ──────────────────────────────────────────────────────

  window.addEventListener('error', (e: ErrorEvent) => (w.__errors as string[]).push(e.message));

  // ── NEW: State manipulation ──────────────────────────────────────────────

  w.__getState = (): GameState => store.getState();

  w.__setState = (partial: Record<string, unknown>): void => {
    store.update((draft: Draft<GameState>) => {
      Object.assign(draft, partial);
    });
  };

  w.__resetState = (): void => {
    // createInitialState returns state/GameState.GameState which is compatible
    // at runtime; we cast to satisfy GameStore's Draft type.
    const fresh = createInitialState() as unknown as GameState;
    store.update((draft: Draft<GameState>) => {
      Object.assign(draft, fresh);
    });
  };

  w.__setScene = (sceneId: string): void => {
    store.update((draft: Draft<GameState>) => {
      draft.scene = sceneId;
    });
  };

  // ── NEW: Zone queries ────────────────────────────────────────────────────

  w.__getZones = (): Zone[] => {
    const allZones: Zone[] = [];
    const cached = w.__zoneCacheInternal as Array<Record<string, unknown>> | undefined;
    if (cached) {
      for (const mod of cached) {
        allZones.push(...collectZonesFromModule(mod));
      }
    }
    return allZones;
  };

  w.__getZone = (name: string): Zone | null => {
    const zones = (w.__getZones as () => Zone[])();
    return zones.find((z) => z.name === name) ?? null;
  };

  // Eagerly load zone modules and cache them so __getZones works synchronously.
  Promise.all([
    import('../zones/menu'),
    import('../zones/shop'),
    import('../zones/skilltree'),
    import('../zones/tutorial'),
    import('../zones/gameplay'),
  ]).then(([menuMod, shopMod, skillMod, tutMod, gameMod]) => {
    w.__zoneCacheInternal = [
      menuMod as unknown as Record<string, unknown>,
      shopMod as unknown as Record<string, unknown>,
      skillMod as unknown as Record<string, unknown>,
      tutMod as unknown as Record<string, unknown>,
      gameMod as unknown as Record<string, unknown>,
    ];
  });

  // ── NEW: Event waiting ───────────────────────────────────────────────────

  w.__waitForEvent = (type: string, timeoutMs = 5000): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`__waitForEvent: timed out waiting for "${type}" after ${timeoutMs}ms`));
      }, timeoutMs);

      bus.once(type, (data: unknown) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  w.__waitForScene = (sceneId: string, timeoutMs = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Resolve immediately if already in the target scene
      if (store.getState().scene === sceneId) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        unsub();
        reject(new Error(`__waitForScene: timed out waiting for scene "${sceneId}" after ${timeoutMs}ms`));
      }, timeoutMs);

      const unsub = store.subscribe(
        (state: GameState) => state.scene,
        (scene: string) => {
          if (scene === sceneId) {
            clearTimeout(timer);
            unsub();
            resolve();
          }
        },
      );
    });
  };

  // ── NEW: Time helpers ────────────────────────────────────────────────────

  w.__tickUntil = (predicate: () => boolean, maxFrames = 1000): number => {
    const tick = w.__tick as (dt?: number) => void;
    let count = 0;
    while (count < maxFrames && !predicate()) {
      tick();
      count += 1;
    }
    return count;
  };

  w.__tickSeconds = (seconds: number): void => {
    const tickN = w.__tickN as (n: number, dt?: number) => void;
    tickN(Math.round(seconds * 144));
  };

  // ── NEW: Entity queries ──────────────────────────────────────────────────

  w.__getEntityCount = (type?: string): number => {
    const state = store.getState();
    const { combat } = state;

    if (!type) {
      // Total entity count: enemies + bullets + powerups + companions + hazards
      const enemyCount = combat.grid.enemies.length + combat.grid.divers.length;
      const bossCount = combat.boss?.active ? 1 : 0;
      const hazardCount =
        combat.hazards.asteroids.length +
        combat.hazards.lasers.length +
        combat.hazards.blackHoles.length;

      return (
        enemyCount +
        bossCount +
        combat.bullets.length +
        combat.powerups.length +
        combat.companions.length +
        hazardCount
      );
    }

    switch (type) {
      case 'enemy':
        return combat.grid.enemies.length + combat.grid.divers.length;
      case 'boss':
        return combat.boss?.active ? 1 : 0;
      case 'bullet':
        return combat.bullets.length;
      case 'powerup':
        return combat.powerups.length;
      case 'companion':
        return combat.companions.length;
      case 'barrier':
        return combat.barriers.length;
      case 'asteroid':
        return combat.hazards.asteroids.length;
      case 'laser':
        return combat.hazards.lasers.length;
      case 'blackhole':
        return combat.hazards.blackHoles.length;
      default:
        return 0;
    }
  };

  w.__getListenerCount = (event?: string): number => {
    // IEventBus exposes getListenerCount
    return bus.getListenerCount(event);
  };

  // ── NEW: HUD state ───────────────────────────────────────────────────────

  w.__getHUDState = (): HUDState => {
    const state = store.getState();
    return {
      score: state.player.score,
      health: state.player.lives,
      lives: state.player.lives,
      wave: state.combat.wave,
      coins: state.economy.wallet.coins,
    };
  };

  // ── NEW: Particle count ──────────────────────────────────────────────────

  w.__getParticleCount = (): number => {
    return store.getState().effects.particles.length;
  };
}
