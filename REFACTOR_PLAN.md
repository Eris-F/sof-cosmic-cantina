# Sofia's Cosmic Cantina — Full Refactor Plan

## Goal
Transform a monolithic vanilla JS arcade game into a fully decoupled, modular, testable architecture with proper state management, error monitoring, and schema validation.

## Stack Additions
- **State:** zustand/vanilla + immer + xstate
- **Monitoring:** @sentry/browser + pino (browser)
- **Validation:** zod
- **Testing:** vitest + playwright
- **Logging:** pino

---

## Phase 1: Install & Configure Frameworks (Sequential)

### 1.1 Install all dependencies
```
npm install zustand immer xstate @sentry/browser pino zod posthog-js
npm install -D vitest playwright @vitest/coverage-v8 happy-dom
```

### 1.2 Configure Sentry (src/infra/sentry.js)
- Initialize with DSN
- Set up error boundary wrapper
- Configure breadcrumbs for game events
- Release tracking via VITE_RELEASE env var

### 1.3 Configure Logger (src/infra/logger.js)
- Pino browser build with log levels
- Pipe error+ logs to Sentry breadcrumbs
- Dev: all levels. Prod: warn+

### 1.4 Configure Vitest (vitest.config.js)
- happy-dom environment
- Coverage thresholds
- Path aliases matching vite.config.js

---

## Phase 2: Core Infrastructure (Parallel — 5 agents)

### Agent A: EventBus + ServiceLocator
**Files:**
- `src/core/EventBus.js` — typed pub/sub, wildcard support, once(), off(), debug mode
- `src/core/ServiceLocator.js` — register/resolve/has, singleton enforcement
- `src/core/events.js` — all event type constants
- `tests/core/EventBus.test.js`
- `tests/core/ServiceLocator.test.js`

### Agent B: Zustand Store + Immer
**Files:**
- `src/core/Store.js` — zustand/vanilla store with immer middleware, subscriptions, selectors, snapshot/restore
- `src/state/GameState.js` — full game state shape, factory, reset
- `src/state/PlayerState.js` — player slice (position, lives, score, effects)
- `src/state/CombatState.js` — enemies, bullets, boss, barriers, powerups, companions
- `src/state/UIState.js` — menu, shop, skills, tutorial, HUD, high scores
- `src/state/EconomyState.js` — wallet, owned items, equipped, achievements
- `tests/core/Store.test.js`

### Agent C: XState Scene Machine
**Files:**
- `src/core/SceneMachine.js` — XState machine definition for all game scenes
- `src/scenes/SceneManager.js` — scene lifecycle (enter/update/render/exit), input routing
- `src/scenes/MenuScene.js`
- `src/scenes/PlayScene.js`
- `src/scenes/PauseScene.js`
- `src/scenes/ShopScene.js`
- `src/scenes/SkillTreeScene.js`
- `src/scenes/TutorialScene.js`
- `src/scenes/GameOverScene.js`
- `src/scenes/HighScoreScene.js`
- `tests/core/SceneMachine.test.js`

### Agent D: Zod Schemas
**Files:**
- `src/schemas/player.schema.js` — player state validation
- `src/schemas/combat.schema.js` — enemy, bullet, boss, barrier schemas
- `src/schemas/economy.schema.js` — wallet, owned, equipped, shop item schemas
- `src/schemas/api.schema.js` — all API request/response schemas (matches FastAPI pydantic models)
- `src/schemas/config.schema.js` — balance config validation
- `tests/schemas/schemas.test.js`

### Agent E: Storage Abstraction
**Files:**
- `src/storage/StorageProvider.js` — abstract interface (get/set/remove/clear/getAll)
- `src/storage/LocalStorageAdapter.js` — localStorage implementation with Zod validation
- `src/storage/APIStorageAdapter.js` — wraps api.js behind StorageProvider interface
- `src/storage/StorageManager.js` — coordinates local + remote, dirty tracking, sync queue
- `src/storage/migrations.js` — versioned schema migrations
- `src/config/storage-keys.js` — all key constants
- `tests/storage/StorageManager.test.js`

---

## Phase 3: Input Abstraction (Sequential — 1 agent)

### Agent F: Input System
**Files:**
- `src/input/Actions.js` — action type constants + factory functions
- `src/input/KeyboardAdapter.js` — keyboard events → normalized actions
- `src/input/TouchAdapter.js` — touch events → normalized actions (with pause zone, double-tap)
- `src/input/InputManager.js` — collects from adapters, queues actions per frame, consumeAction()
- `tests/input/InputManager.test.js`

**Depends on:** Phase 2 Agent A (EventBus for action dispatching)

---

## Phase 4: Game Systems (Parallel — 4 agents)

All systems are pure logic. They read state from Store, emit events via EventBus, return state patches applied via Immer. No rendering, no DOM, no side effects.

### Agent G: Core Game Systems
**Files:**
- `src/systems/PlayerSystem.js` — movement, firing, damage, bounds, invincibility
- `src/systems/BulletSystem.js` — lifecycle, movement, out-of-bounds, ricochet
- `src/systems/CollisionSystem.js` — ALL collision detection (player↔enemy, bullet↔enemy, bullet↔boss, bullet↔UFO, bullet↔barrier, powerup↔player, enemy↔player, hazard↔player)
- `src/systems/WaveSystem.js` — wave progression, modifier selection, boss spawning
- `tests/systems/CollisionSystem.test.js`
- `tests/systems/WaveSystem.test.js`

### Agent H: Entity Systems
**Files:**
- `src/systems/EnemySystem.js` — grid, formations, movement patterns, specials, splitter, healer, etc.
- `src/systems/BossSystem.js` — phases, attacks, HP, patterns
- `src/systems/CompanionSystem.js` — orbit, firing
- `src/systems/HazardSystem.js` — asteroids, lasers, black holes, spawning
- `tests/systems/EnemySystem.test.js`

### Agent I: Economy & Progression Systems
**Files:**
- `src/systems/EconomySystem.js` — coin earning, spending, multipliers, validation
- `src/systems/ShopSystem.js` — buy, equip, stat computation, price validation
- `src/systems/SkillSystem.js` — upgrade, bonus calculation, cost validation
- `src/systems/AchievementSystem.js` — condition checking, unlock, popup queue
- `tests/systems/EconomySystem.test.js`
- `tests/systems/ShopSystem.test.js`

### Agent J: Effects & Ability Systems
**Files:**
- `src/systems/ComboSystem.js` — kill combos, streaks, milestones, announcements
- `src/systems/AbilitySystem.js` — tequila bomb, photo flash, cooldowns
- `src/systems/EffectsSystem.js` — particles, screenshake, slowmo (state-based, not module globals)
- `src/systems/PowerupSystem.js` — spawning, pickup, stacking, duration, active effects
- `tests/systems/ComboSystem.test.js`

---

## Phase 5: Renderers (Parallel — 3 agents)

All renderers are PURE READ-ONLY. They receive state + ctx, draw pixels, return nothing. Zero mutations.

### Agent K: Gameplay Renderers
**Files:**
- `src/render/Renderer.js` — main coordinator, dispatches to scene-specific renderers
- `src/render/GameplayRenderer.js` — entities, effects, modifiers, abilities
- `src/render/HUDRenderer.js` — score, lives, coins, weapon, modifier banner
- `src/render/ParticleRenderer.js` — petals, shatter, barrier crumble
- `src/render/SpriteRenderer.js` — all pixel art functions (from sprites.js)

### Agent L: UI Renderers
**Files:**
- `src/render/MenuRenderer.js` — title screen, difficulty, mode, enemy showcase
- `src/render/ShopRenderer.js` — shop categories, items, preview, rarity
- `src/render/SkillTreeRenderer.js` — branches, levels, costs
- `src/render/TutorialRenderer.js` — tutorial pages
- `src/render/GameOverRenderer.js` — stats, score summary
- `src/render/HighScoreRenderer.js` — initial entry, leaderboard

### Agent M: Audio Layer
**Files:**
- `src/audio/AudioManager.js` — context lifecycle, node pooling, max nodes
- `src/audio/SFXPlayer.js` — all sound effects with proper cleanup
- `src/audio/MusicPlayer.js` — procedural music with proper cleanup
- `src/audio/HapticManager.js` — vibration patterns

---

## Phase 6: Config Extraction (Parallel — 1 agent)

### Agent N: Config & Balance
**Files:**
- `src/config/constants.js` — canvas, physics, dimensions (keep existing, expand)
- `src/config/balance.js` — ALL game tuning extracted from hardcoded values
- `src/config/items.js` — full shop catalog data
- `src/config/formations.js` — enemy formation templates
- `src/config/modifiers.js` — modifier definitions (data only, no logic)
- `src/config/achievements.js` — achievement definitions (data only)
- `src/config/weapons.js` — weapon definitions (data only)
- `src/config/skills.js` — skill tree definitions (data only)

---

## Phase 7: Integration & Bootstrap (Sequential — 1 agent)

### Agent O: Wire Everything Together
**Files:**
- `src/main.js` — rewrite bootstrap: init Sentry, create store, wire EventBus, register services, create scene machine, start game loop
- `src/core/GameLoop.js` — fixed timestep with accumulator, interpolation, decoupled from rAF
- Wire scenes to systems
- Wire systems to store
- Wire renderers to store
- Wire input to scenes
- Delete old files: game.js, renderer.js, shopui.js (replaced by new modules)

---

## Phase 8: Testing & Validation (Parallel — 2 agents)

### Agent P: Unit Tests
- All system tests
- Store/state tests
- Schema validation tests
- Input action tests
- Coverage target: 80%+

### Agent Q: Integration Tests
- Scene transition tests
- Full game flow: menu → play → die → high score → menu
- Shop buy/equip flow
- Skill upgrade flow
- Storage sync flow
- Offline fallback flow

---

## Execution Order

```
Phase 1 (sequential)     → install + configure
Phase 2 (5 parallel)     → core infra: EventBus, Store, Scenes, Schemas, Storage
Phase 3 (sequential)     → input system (needs EventBus)
Phase 4 (4 parallel)     → all game systems (needs Store + EventBus)
Phase 5 (3 parallel)     → all renderers (needs Store)
Phase 6 (1 parallel)     → config extraction (independent)
Phase 7 (sequential)     → integration + bootstrap (needs everything)
Phase 8 (2 parallel)     → testing
```

## File Count
- **New files:** ~65
- **Deleted files:** ~5 (game.js, renderer.js, shopui.js, challenges.js, old constants)
- **Modified files:** ~5 (main.js, index.html, vite.config.js, package.json, .gitignore)
- **Test files:** ~15

## Risk Mitigation
- Each phase is independently verifiable
- Old code stays until Phase 7 — no broken intermediate state
- All systems are testable in isolation before integration
- Store snapshots enable easy debugging
- Sentry captures any runtime errors immediately
