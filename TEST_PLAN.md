# Playwright Test Plan — Sofia's Cosmic Cantina

> Paused after Phase A + Phase B Batch 1. Resume after game mechanics overhaul.
> Shop and skill tree tests intentionally excluded — systems being rewritten.

## What's Built (Phase A + B1)

### Infrastructure (Phase A)
- `src/dev/harness.ts` — full test harness API (setState, getZones, waitForEvent, tickUntil, etc.)
- `src/core/events.ts` — complete event type registry with GameEvents object
- `src/zones/names.ts` — zone name constants (ZoneNames + dynamic generators)
- `src/config/index.ts` — barrel export, all config objects frozen
- `src/core/IdGen.ts` — entity ID prefixes (EntityPrefix)
- `tests/fixtures/game.fixture.ts` — shared fixture with auto-capture on failure
- `tests/helpers/assertions.ts` — gameExpect() with 18 domain assertions
- `tests/helpers/zones.ts` — zone name re-exports for tests
- `tests/helpers/time.ts` — tickFrames, tickSeconds, tickUntil helpers
- `tests/helpers/diagnostics.ts` — captureDiagnostics, logState, logEvents
- `tests/fixtures/presets/factories.ts` — makeEnemy, makeBoss, makePowerup, etc.
- `tests/fixtures/presets/states.ts` — 19 preset game states
- `tests/fixtures/presets/sequences.ts` — composable action sequences
- `playwright.config.ts` — 5 devices, 12 workers, video/trace on failure

### Tests Written (Phase B Batch 1) — 238 tests
| File | Tests | Coverage |
|------|-------|----------|
| `tests/integration/smoke.spec.ts` | 9 | Harness API verification |
| `tests/scenes/menu.spec.ts` | 34 | Difficulty, mode, navigation, events |
| `tests/integration/transitions.spec.ts` | 36 | Valid/invalid transitions, state preservation, rapid spam |
| `tests/gameplay/player.spec.ts` | 52 | Movement, firing, damage, death, respawn, boundaries |
| `tests/systems/collision.spec.ts` | 60 | All collision pairs, barriers, hazards, edge cases |
| `tests/gameplay/waves.spec.ts` | 47 | Progression, bosses, modifiers, coins, barriers |

---

## Remaining Test Suites (Resume After Overhaul)

### Phase B — Core Tests (~685 remaining)

#### Enemies (~80 tests) — `tests/gameplay/enemies.spec.ts`
- 8+ enemy types: standard, elite, sniper, healer, splitter, teleporter, bomber, ghost, diver, vampire
- Spawn from grid formation
- Movement patterns: sine, zigzag, circle, lock_step, etc.
- Special abilities per type: shield, heal, summon, teleport, bomb, dive
- Death behavior (splitter spawns 2 minis, etc.)
- Elite vs standard stats
- Grid formation from config/formations.ts
- Enemy firing patterns and cooldowns

#### Boss (~50 tests) — `tests/gameplay/boss.spec.ts`
- 5 boss types: Red Mantis, Electric Empress, Cosmic Guardian, Shadow Wraith, Temporal Warden
- Boss phases (intro, fight, enrage)
- Attack patterns per type
- Health scaling by wave number
- Boss movement patterns
- Boss defeated events and rewards
- Boss damage from player bullets
- Edge cases: boss at 1 HP, boss + regular enemies

#### Powerups (~60 tests) — `tests/gameplay/powerups.spec.ts`
- 6 types: Spread, Rapid, Shield, Bomb, Ricochet, Companion
- Spawn mechanics (12% drop chance, 100% from elites/UFOs)
- Collection detection
- Effect activation and duration
- Stacking limits per type
- Effect expiration
- Multiple active powerups simultaneously
- Powerup + skill/item interaction

#### Abilities (~30 tests) — `tests/gameplay/abilities.spec.ts`
- Tequila Bomb: trigger, damage radius, UFO interaction
- Photo Flash: kill trigger, score bonus
- Near-miss detection: distance threshold, dodge bonus
- Cooldown timers
- Ability + powerup interactions

#### Bullets (~30 tests) — `tests/gameplay/bullets.spec.ts`
- Player bullet spawn, movement, out-of-bounds cleanup
- Enemy bullet spawn, movement patterns
- Pierce mechanic (bullet survives hit)
- Ricochet bouncing (with powerup)
- Bullet count caps (prevent memory leak)
- Spread shot (multiple bullets per fire)

#### Hazards (~30 tests) — `tests/gameplay/hazards.spec.ts`
- Asteroids: spawn, diagonal movement, player collision
- Lasers: warm-up phase, active phase, damage
- Black Holes: gravitational pull, damage radius
- Wave-dependent spawn rates
- Hazard + invincibility interaction

#### Companions (~15 tests) — `tests/gameplay/companions.spec.ts`
- Spawn from powerup
- Orbital movement around player
- Auto-fire at enemies
- Follow player movement
- Clear on game reset

#### Input (~40 tests) — `tests/input/touch.spec.ts` + `tests/input/keyboard.spec.ts`
- Touch zones exist for each scene
- Zone boundaries (tap inside vs outside)
- Keyboard WASD and Arrow key mapping
- Space to fire
- ESC to pause
- Two-finger tap for pause
- Rapid input handling
- Touch drag for player movement
- Scene-specific action bridging

#### Economy (~30 tests) — `tests/systems/economy.spec.ts`
- Coin earning from kills, wave clears
- Coin spending (shop purchases)
- Wallet can't go negative
- Multipliers from skills and items
- COINS_EARNED event data
- Persistence across scenes

#### Achievements (~40 tests) — `tests/systems/achievements.spec.ts`
- 15+ achievements: First Blood, Wave 5/10/20, Perfect Wave, Boss Slayer, etc.
- Trigger conditions (from config/achievements.ts)
- ACHIEVEMENT_UNLOCKED event
- Popup display and cooldown
- No duplicate unlocks
- Persistence

#### Effects (~25 tests) — `tests/systems/effects.spec.ts`
- Particle spawn on kill/explosion
- Particle cleanup over time
- Screenshake trigger and decay
- Slow-motion activation and time scale
- Starfield parallax layers
- Effect state reset between games

#### Combo (~20 tests) — `tests/systems/combo.spec.ts`
- Kill streaks increment combo
- Combo milestones (3, 5, 8) trigger announcements
- Combo timer resets on new kill
- Combo expires after timeout
- Combo reset on player hit
- Streak tracking

#### Tutorial (~25 tests) — `tests/scenes/tutorial.spec.ts`
- Page navigation (next/prev)
- All pages render content
- Page count matches TUTORIAL_PAGE_COUNT
- Exit returns to menu
- Re-entry starts at page 0
- Left-half/right-half tap navigation
- Bottom nav buttons

#### Pause/Resume (~15 tests) — `tests/scenes/pause.spec.ts`
- Pause freezes all entity positions
- Resume restores exact state
- Return to menu from pause
- Game timer stops during pause
- Pause zone detection

#### Game Over + High Score (~40 tests) — `tests/scenes/gameover.spec.ts` + `tests/scenes/highscore.spec.ts`
- Game over trigger on last life lost
- Score display accuracy
- Transition to high score entry
- 3-letter name entry (up/down/submit)
- Leaderboard display
- Return to menu

#### Responsive/Viewport (~30 tests) — `tests/responsive/viewport.spec.ts`
- Canvas scaling on 5 device profiles
- Zone positions adjust with viewport
- Touch coordinates map correctly
- Landscape rotation prompt
- No content hidden behind notch
- Galaxy Fold narrow (280px) usability

#### Storage/Persistence (~25 tests) — `tests/integration/persistence.spec.ts`
- Save to localStorage
- Load from localStorage
- Schema migration
- Corrupt data handling (graceful fallback)

### Phase C — Hardening (~335 tests)

#### Boundary Values (~80 tests) — `tests/boundaries/`
- Player: health=0, health=1, x=0, x=CANVAS_WIDTH, lives=0, lives=1
- Economy: coins=price exactly, coins=price-1, coins=0, coins=MAX_SAFE_INTEGER
- Waves: wave 1, boss thresholds, wave 99+
- Entities: 0 enemies, max enemies, boss at 1 HP, powerup at 1 frame duration
- Fire cooldown at exactly 0, invincibility timer at exactly 0

#### State Machine Exhaustive (~60 tests) — `tests/chaos/state-machine.spec.ts`
- Every valid transition path
- Every invalid transition pair
- Rapid transition spam (pause/unpause 50x)
- State preservation across all transition paths

#### Race Conditions (~40 tests) — `tests/chaos/race-conditions.spec.ts`
- Player dies AND collects powerup same frame
- Player kills enemy AND enemy bullet kills player same frame
- Two achievements trigger same frame
- Wave ends AND boss spawns same frame
- Powerup expires AND new powerup collected same frame
- Combo timer expires AND new kill same frame
- Two bullets hit same enemy same frame

#### Error Recovery (~35 tests) — `tests/chaos/error-recovery.spec.ts`
- Corrupt localStorage → reset to defaults
- localStorage full (QuotaExceeded) → graceful failure
- AudioContext blocked → game still playable
- Window resize mid-gameplay → canvas rescales
- Device rotation → prompt shown, recovers
- Tab switch (visibility change) → game pauses/resumes
- requestAnimationFrame after page hidden → no spiral

#### Memory Leak Detection (~25 tests) — `tests/chaos/memory-leaks.spec.ts`
- Play 100 waves → entity arrays don't grow unbounded
- Spawn/destroy 1000 particles → pool returns to 0
- Open/close scenes 100x → no listener accumulation
- EventBus listener count stable after scene transitions
- Event log caps at 1000, input log at 5000, snapshots at 50

#### Screenshot Baselines (~40 tests) — `tests/scenes/*.visual.spec.ts`
- Static scene screenshots (menu, tutorial, game over, high score)
- 5 device profiles x ~8 scenes = ~40 visual assertions
- 0.1-0.3% pixel diff threshold
- Fixed state + fixed frame count before capture

#### Full Player Flows (~30 tests) — `tests/integration/full-flows.spec.ts`
- Menu → start → play → die → game over → high score → menu
- Menu → shop → buy → equip → close → play (after shop rewrite)
- Menu → tutorial → all pages → close → menu
- Menu → skills → upgrade → close → play (after skill rewrite)

### Phase D — Chaos & Advanced (~150 tests + 5K fuzz)

#### Fuzz Testing (~50 tests x 100 iterations) — `tests/fuzz/`
- Random action sequences → assert invariants
- Invariants: player in bounds, coins >= 0, health >= 0, no NaN positions, score only increases, no duplicate entity IDs, bullets capped
- Random state mutations → assert invariants
- Shrink on failure to find minimal reproduction

#### Combinatorial (~50 tests) — `tests/combinatorial/`
- Skin + weapon stat stacking
- Max skills + max shop bonuses (caps respected)
- All powerups active simultaneously
- Shield powerup + shield skin
- Rapid fire + fire rate skill + spread shot
- Coin multiplier stacking (multiplicative vs additive)

#### Device Edge Cases (~25 tests) — `tests/device/edge-cases.spec.ts`
- Galaxy Fold folded (280px) — zones tappable
- iPad landscape — rotation prompt
- iPhone SE — all shop items visible
- Touch at screen edges — hit detection
- High DPR (3x Pixel) — coordinates correct

#### Replay Determinism (~15 tests) — `tests/replay/`
- Record input sequence → replay with same seed → exact same outcome
- Replay on different device → same game state
- Corrupted replay data → graceful rejection

#### Performance Budgets (~10 tests) — `tests/systems/performance.spec.ts`
- Frame tick duration under budget
- Entity array sizes capped
- Particle pool bounded

---

## Design Principles

### Config-Driven (no magic numbers)
Tests import from `src/config/` and derive expected values from the same source of truth as the game. Changing a price, cost, or balance value breaks zero tests.

### Three Abstraction Layers
1. **Config values** — imported from `src/config/`, not hardcoded
2. **Zone names** — from `ZoneNames` constants, not coordinate math
3. **Harness methods** — `getCoins()` not `state.economy.wallet.coins`

### Change Impact
| You change... | What breaks | Fix effort |
|---|---|---|
| Item price / skill cost | Nothing | 0 |
| Enemy stats / wave composition | Nothing | 0 |
| Shop UI layout | Nothing (zone names, not coords) | 0 |
| State shape refactor | Update harness.ts (1 file) | ~30 min |
| Zone name rename | Update zones/names.ts (1 file) | ~15 min |
| Add new feature | Add new tests (additive) | varies |
| Remove feature | Delete test file | ~5 min |

### Generated Tests
For items/skills/achievements — tests auto-generate from config arrays:
```ts
for (const item of SHOP_ITEMS) {
  test(`can buy ${item.id}`, async () => { ... });
}
```

## npm Scripts
```
npm run test:e2e              # Full Playwright suite
npm run test:e2e:smoke        # @smoke tagged only
npm run test:e2e:headed       # With browser visible
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:debug        # Step-through debugger
npm run test:e2e:report       # Open HTML report
npm run test:full             # vitest + playwright
npm run test:pre-push         # Gate before push
```

## Device Profiles
| Profile | Viewport | Notes |
|---------|----------|-------|
| iPhone 14 | 390x844 | Primary |
| iPhone SE | 375x667 | Smallest iOS |
| Pixel 7 | 412x915 | Android |
| iPad Portrait | 768x1024 | Tablet |
| Galaxy Fold | 280x653 | Narrowest |
