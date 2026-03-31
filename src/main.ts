/**
 * Bootstrap — wires together the entire refactored arcade game.
 *
 * Creates every service, registers scenes, hooks up systems to the event bus,
 * and starts the fixed-timestep game loop.
 *
 * @module main
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { applyViewport } from './core/Viewport';

// -- Core infrastructure --
import { createEventBus } from './core/EventBus';
import { createGameStore } from './core/Store';
import { createServiceLocator } from './core/ServiceLocator';
import { createSceneMachine, createSceneActor, SCENE, SCENE_EVENT } from './core/SceneMachine';
import { createGameLoop } from './core/GameLoop';
import { createPlayServices } from './core/PlayLoop';
import type { PlayServices } from './core/PlayLoop';
import * as Events from './core/events';

// -- Types --
import type {
  GameStore,
  IEventBus,
  GameState,
  DifficultySettings,
  EnemyGridState,
  BossState,
} from './types/index';

// -- State --
import { createInitialState } from './state/GameState';

// -- Scenes --
import { SceneManager } from './scenes/SceneManager';
import { createMenuScene } from './scenes/MenuScene';
import { createPlayScene } from './scenes/PlayScene';
import { createPauseScene } from './scenes/PauseScene';
import { createShopScene } from './scenes/ShopScene';
import { createSkillTreeScene } from './scenes/SkillTreeScene';
import { createTutorialScene } from './scenes/TutorialScene';
import { createGameOverScene } from './scenes/GameOverScene';
import { createHighScoreScene } from './scenes/HighScoreScene';

// -- Input --
import { InputManager } from './input/InputManager';
import { KeyboardAdapter } from './input/KeyboardAdapter';
import { TouchAdapter } from './input/TouchAdapter';
import { createSceneActionBridge } from './input/SceneActionBridge';

// -- Audio --
import { AudioManager } from './audio/AudioManager';
import { SFXPlayer } from './audio/SFXPlayer';
import { MusicPlayer } from './audio/MusicPlayer';
import { HapticManager } from './audio/HapticManager';

// -- Storage --
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';

// -- Systems --
import { createPlayerSystem } from './systems/PlayerSystem';
import { createBulletSystem } from './systems/BulletSystem';
import { createCollisionSystem } from './systems/CollisionSystem';
import { createWaveSystem } from './systems/WaveSystem';
import { createEnemySystem } from './systems/EnemySystem';
import { createBossSystem } from './systems/BossSystem';
import { createCompanionSystem } from './systems/CompanionSystem';
import { createHazardSystem } from './systems/HazardSystem';
import { subscribeEconomy } from './systems/EconomySystem';
import {
  updateParticles,
  updateShake,
  updateSlowMo,
  spawnPetals,
  triggerShake,
  triggerSlowMo,
  getTimeScale,
} from './systems/EffectsSystem';
import { updateCombo, registerKill, resetCombo, resetStreak } from './systems/ComboSystem';
import { updateAbilities, checkTequilaTrigger, checkNearMiss } from './systems/AbilitySystem';
import { updatePowerups, updateActiveEffects, applyPowerup, maybeSpawnPowerup } from './systems/PowerupSystem';
import { getSkillBonuses, createSkillActions } from './systems/SkillSystem';
import { recomputeMergedStats, createShopActions } from './systems/ShopSystem';
import { checkAchievements, updatePopups as updateAchPopups, subscribeAchievements } from './systems/AchievementSystem';
import { updateStarfield, updateUfo } from './systems/StarfieldSystem';

// -- Render --
import { createRenderDispatcher, setSkinCatalog } from './render/RenderDispatcher';

// -- Config --
import { SHOP_ITEMS as ITEM_CATALOG } from './config/items';

// -- Infra --
import { initSentry } from './infra/sentry';
import { createLogger } from './infra/logger';

import type { Draft } from 'immer';

const log = createLogger('main');

// ==========================================================================
//  1. Canvas setup
// ==========================================================================

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// Apply viewport — computes logical canvas size, sets DPR, applies CSS sizing
let viewport = applyViewport(canvas, ctx);

function resizeCanvas(): void {
  viewport = applyViewport(canvas, ctx);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

// ==========================================================================
//  2. Sentry
// ==========================================================================

initSentry();

// ==========================================================================
//  3. EventBus + Store + ServiceLocator
// ==========================================================================

const bus: IEventBus = createEventBus({ fresh: true });
const store = createGameStore(createInitialState) as unknown as GameStore;
const services = createServiceLocator({ fresh: true });
services.register('bus', bus);
services.register('store', store);

// ==========================================================================
//  4. Input
// ==========================================================================

const keyboard = new KeyboardAdapter(window);
const touch = new TouchAdapter(canvas, CANVAS_WIDTH, CANVAS_HEIGHT, () => ({
  x: viewport.originX,
  y: viewport.originY,
}));
const inputManager = new InputManager(keyboard, touch);
const actionBridge = createSceneActionBridge(inputManager, store);

services.register('input', inputManager);

// ==========================================================================
//  5. Audio
// ==========================================================================

const audioManager = new AudioManager();
audioManager.unlock();

const sfxPlayer = new SFXPlayer(audioManager, bus);
const musicPlayer = new MusicPlayer(audioManager);
const hapticManager = new HapticManager(bus);

services.register('audio', audioManager);
services.register('sfx', sfxPlayer);
services.register('music', musicPlayer);
services.register('haptic', hapticManager);

// ==========================================================================
//  6. Storage
// ==========================================================================

const localAdapter = new LocalStorageAdapter();
services.register('storage', localAdapter);

// ==========================================================================
//  7. Game systems
// ==========================================================================

const playerSystem = createPlayerSystem(store, bus);
const bulletSystem = createBulletSystem(store, bus);
const collisionSystem = createCollisionSystem(store, bus);
const enemySystem = createEnemySystem(store, bus);
const bossSystem = createBossSystem(store, bus);
const companionSystem = createCompanionSystem(store, bus);
const hazardSystem = createHazardSystem(store, bus);

const waveSystem = createWaveSystem(store, bus, {
  createEnemyGrid: (wave: number, diff?: DifficultySettings) => {
    enemySystem.createGrid(wave, diff);
    return store.getState().combat.grid as EnemyGridState;
  },
  createBoss: (wave: number) => {
    bossSystem.spawnBoss(wave);
    return store.getState().combat.boss as BossState;
  },
  createBarriers: () => {
    return store.getState().combat.barriers;
  },
});

// Event-driven system subscriptions
void subscribeEconomy(bus, store);
void subscribeAchievements(bus, store);

// Skill and shop action wrappers
const skillActions = createSkillActions(bus, store, () => {
  const state = store.getState();
  const bonuses = getSkillBonuses(state.economy.skillLevels);
  recomputeMergedStats(store, bonuses as unknown as Record<string, number | boolean>);
});

const shopActions = createShopActions(bus, store, () => {
  const state = store.getState();
  return getSkillBonuses(state.economy.skillLevels) as unknown as Record<string, number | boolean>;
});

// Register systems in the service locator
services.register('playerSystem', playerSystem);
services.register('enemySystem', enemySystem);
services.register('bossSystem', bossSystem);
services.register('bulletSystem', bulletSystem);
services.register('collisionSystem', collisionSystem);
services.register('waveSystem', waveSystem);
services.register('companionSystem', companionSystem);
services.register('hazardSystem', hazardSystem);
services.register('skillActions', skillActions);
services.register('shopActions', shopActions);

// ==========================================================================
//  9. Wire event-driven side effects
// ==========================================================================

bus.on(Events.ENEMY_KILLED, (data: unknown) => {
  const d = data as { x: number; y: number; type: string; guaranteedDrop?: boolean; elite?: boolean } | undefined;
  if (d) {
    spawnPetals(store, d.x, d.y, undefined, d.type);
    registerKill(store, bus, d.x, d.y);
    checkTequilaTrigger(store, bus, d.x, d.y);
    maybeSpawnPowerup(store, bus, d.x, d.y, d.guaranteedDrop ?? d.elite);
    triggerSlowMo(store, 0.15, 0.4);
  }
});

bus.on(Events.PLAYER_HIT, () => {
  triggerShake(store, 6, 0.3);
  resetCombo(store);
  resetStreak(store);
});

bus.on(Events.PLAYER_DEATH, () => {
  triggerShake(store, 10, 0.5);
  musicPlayer.stop();
  bus.emit(SCENE_EVENT.PLAYER_DIED);
});

bus.on(Events.POWERUP_COLLECTED, (data: unknown) => {
  const d = data as { type?: string } | undefined;
  if (d && d.type) {
    applyPowerup(store, bus, d.type);
  }
});

bus.on(Events.WAVE_START, (data: unknown) => {
  const d = data as { wave?: number } | undefined;
  if (d && d.wave) {
    musicPlayer.setIntensity(d.wave);
  }
});

// ==========================================================================
//  10. Scene machine (XState) + SceneManager
// ==========================================================================

const sceneMachine = createSceneMachine();
const sceneActor = createSceneActor(sceneMachine);
const sceneManager = new SceneManager(sceneActor, bus);

// Keep store.scene in sync with the XState machine + snapshot transitions
sceneActor.subscribe((snapshot: { value: string }) => {
  const prev: string = store.getState().scene;
  const next: string = snapshot.value;
  store.update((draft: Draft<GameState>) => {
    draft.scene = next;
  });

  // Dev: capture state snapshot on every scene transition
  if (import.meta.env.DEV && prev !== next) {
    const w = window as unknown as Record<string, unknown>;
    const snaps = (w.__sceneSnapshots ?? []) as Array<{ from: string; to: string; state: unknown; time: number }>;
    if (snaps.length >= 50) snaps.shift();
    snaps.push({ from: prev, to: next, state: structuredClone(store.getState()), time: performance.now() });
    w.__sceneSnapshots = snaps;
  }
});

// Bridge: scene events emitted on the bus trigger XState transitions
const SCENE_BUS_EVENTS: readonly string[] = [
  SCENE_EVENT.START_GAME,
  SCENE_EVENT.PAUSE,
  SCENE_EVENT.RESUME,
  SCENE_EVENT.OPEN_SHOP,
  SCENE_EVENT.CLOSE_SHOP,
  SCENE_EVENT.OPEN_SKILLS,
  SCENE_EVENT.CLOSE_SKILLS,
  SCENE_EVENT.OPEN_TUTORIAL,
  SCENE_EVENT.CLOSE_TUTORIAL,
  SCENE_EVENT.PLAYER_DIED,
  SCENE_EVENT.SUBMIT_SCORE,
  SCENE_EVENT.RETURN_TO_MENU,
] as const;

for (const evt of SCENE_BUS_EVENTS) {
  bus.on(evt, () => {
    if (sceneManager.canTransition(evt)) {
      sceneManager.send(evt);
    }
  });
}

// ==========================================================================
//  11. Play services + scene registration
// ==========================================================================

const playServices: PlayServices = createPlayServices({
  store, bus,
  playerSystem, bulletSystem, collisionSystem, waveSystem,
  enemySystem, bossSystem, companionSystem, hazardSystem,
  musicPlayer,
  getTimeScale,
  getSkillBonuses: (levels) => getSkillBonuses(levels) as unknown as Record<string, number | boolean>,
  recomputeMergedStats,
  resetCombo, resetStreak,
  updatePowerups, updateActiveEffects, updateCombo, updateAbilities,
  checkNearMiss, updateParticles, updateShake, updateSlowMo,
  checkAchievements, updateAchPopups, updateUfo,
  buildPlayerActions: actionBridge.buildPlayerActions,
});

// Register scene handlers
sceneManager.register(SCENE.MENU, createMenuScene());
sceneManager.register(SCENE.PAUSED, createPauseScene());
sceneManager.register(SCENE.SHOP, createShopScene(shopActions));
sceneManager.register(SCENE.SKILL_TREE, createSkillTreeScene(skillActions));
// Import tutorial page count so the scene knows when to close
import { TUTORIAL_PAGE_COUNT } from './render/TutorialRenderer';
sceneManager.register(SCENE.TUTORIAL, createTutorialScene({ getPageCount: () => TUTORIAL_PAGE_COUNT }));
sceneManager.register(SCENE.GAME_OVER, createGameOverScene());
sceneManager.register(SCENE.HIGH_SCORE, createHighScoreScene());

// PlayScene — always inject playServices on enter
const playScene = createPlayScene();
const originalPlayEnter = playScene.enter.bind(playScene);
playScene.enter = (_storeArg: unknown, busArg: IEventBus, _svc?: unknown) => {
  originalPlayEnter(store, busArg, playServices);
};
sceneManager.register(SCENE.PLAYING, playScene);

// ==========================================================================
//  12. Render dispatcher
// ==========================================================================

// Provide skin catalog to the render dispatcher
const skinCatalog = ((ITEM_CATALOG as unknown as Record<string, unknown>).skins || []) as Array<{
  id: string; name: string; body: string; stripe: string; ear: string; glow?: string;
}>;
setSkinCatalog(skinCatalog);

const render = createRenderDispatcher(ctx, store, () => viewport);

// ==========================================================================
//  13. Game loop
// ==========================================================================

const loop = createGameLoop({
  onUpdate(dt: number): void {
    // Time is incremented by scene handlers (updatePlay uses scaledDt).
    // Only increment here for non-playing scenes so menu animations work.
    const currentScene = sceneManager.getCurrentScene();
    if (currentScene !== SCENE.PLAYING && currentScene !== SCENE.PAUSED) {
      store.update((draft) => {
        draft.time += dt;
      });
    }

    updateStarfield(store, dt);
    inputManager.update();
    const actions = actionBridge.buildSceneActions();
    sceneManager.update(dt, actions, store);
    inputManager.clear();
  },

  onRender(alpha: number): void {
    render(alpha);
  },

  targetFPS: 144,
});

// ==========================================================================
//  14. Boot
// ==========================================================================

sceneManager.enterCurrent(store, playServices);
loop.start();

// Expose internals for integration testing (dev only)
if (import.meta.env.DEV) {
  import('./dev/harness').then(({ installHarness }) => {
    installHarness({
      store, bus, sceneManager, shopActions, skillActions,
      loop, getViewport: () => viewport, canvas,
    });
  });
}

log.info('Sofia\'s Cosmic Cantina booted (refactored)');
