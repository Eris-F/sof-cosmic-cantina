# Component Catalog — Interactive Elements

Every touchable, clickable, or keyboard-accessible element in the game. If it's not listed here, it doesn't exist. If it's listed without a test, that's a gap.

**Depth Levels:**
- L1: Exists (renders, no crash)
- L2: Responds (input → state change)
- L3: Correct (before/after state exact)
- L4: Boundaries (edges, overflow, rapid, zero/max)
- L5: Flow (works in real player journey)

---

## Menu Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Start game | `MenuZones.START_ZONE` | tap | Space, Enter | L5 |
| Start game (title area) | `MenuZones.TITLE_ZONE` | tap | — | L4 |
| Open Shop | `MenuZones.SHOP_BTN` | tap | P | L5 |
| Open Skills | `MenuZones.SKILLS_BTN` | tap | K | L5 |
| Open Tutorial | `MenuZones.TUTORIAL_BTN` | tap | T | L5 |
| Difficulty ◀ | `MenuZones.DIFF_LEFT` | tap | ArrowLeft, A | L4 |
| Difficulty ▶ | `MenuZones.DIFF_RIGHT` | tap | ArrowRight, D | L4 |
| Mode ◀ | `MenuZones.MODE_LEFT` | tap | ArrowUp, W | L4 |
| Mode ▶ | `MenuZones.MODE_RIGHT` | tap | ArrowDown, S | L4 |
| Button gap (no action) | between buttons | tap | — | L4 |

## Shop Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Category tab 0 (CATS) | `ShopZones.CAT_TAB_0` | tap | ArrowLeft | L3 |
| Category tab 1 (AMMO) | `ShopZones.CAT_TAB_1` | tap | ArrowRight | L3 |
| Category tab 2 (TRAILS) | `ShopZones.CAT_TAB_2` | tap | — | L3 |
| Category tab 3 (SHIELDS) | `ShopZones.CAT_TAB_3` | tap | — | L3 |
| Item card (select) | `ShopZones.itemCard(i)` | tap | ArrowDown/Up | L3 |
| Item card (buy/equip) | `ShopZones.buyButton(i)` | tap selected | Enter, Space | L5 |
| Back button | `ShopZones.BACK_BTN` | tap | Escape | L5 |
| Scroll up | — | — | ArrowUp, W | L4 |
| Scroll down | — | — | ArrowDown, S | L4 |
| Buy with insufficient funds | — | tap/Enter | — | L3 |
| Buy with sufficient funds | — | tap/Enter | — | L5 |
| Equip owned item | — | tap/Enter | — | L3 |
| Already equipped (no-op) | — | tap/Enter | — | L3 |
| Flash message decay | — | — | — | L2 |
| Category wrap (forward) | — | — | ArrowRight ×4 | L4 |
| Category wrap (backward) | — | — | ArrowLeft | L4 |
| Item index reset on category switch | — | — | — | L3 |
| Rapid scroll (30 taps) | — | — | — | L4 |
| Rapid category switch (20) | — | — | — | L4 |

## Skill Tree Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Branch 0 (select) | `SkillTreeZones.BRANCH_0` | tap | — | L3 |
| Branch 1 (select) | `SkillTreeZones.BRANCH_1` | tap | ArrowDown | L3 |
| Branch 2 (select) | `SkillTreeZones.BRANCH_2` | tap | — | L3 |
| Branch 3 (select) | `SkillTreeZones.BRANCH_3` | tap | — | L3 |
| Branch 4 (select) | `SkillTreeZones.BRANCH_4` | tap | — | L3 |
| Upgrade button | `SkillTreeZones.upgradeButton(i)` | tap | Enter, Space | L5 |
| Double-tap branch (upgrade) | same branch | tap ×2 | — | L3 |
| Back button | `SkillTreeZones.BACK_BTN` | tap | Escape | L5 |
| Branch wrap (forward) | — | — | ArrowDown ×5 | L4 |
| Branch wrap (backward) | — | — | ArrowUp | L4 |
| Upgrade insufficient funds | — | — | Enter | L3 |
| Upgrade max level (5) | — | — | Enter ×6 | L4 |
| Flash message decay | — | — | — | L2 |
| Skills persist across games | — | — | — | L5 |

## Tutorial Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Next page (right half) | `TutorialZones.NEXT_HALF` | tap | ArrowRight, D | L3 |
| Prev page (left half) | `TutorialZones.PREV_HALF` | tap | ArrowLeft, A | L3 |
| Close (Escape) | — | — | Escape | L2 |
| Close (advance past last) | — | tap right half | ArrowRight | L3 |
| Page 0 → no prev | — | tap left | ArrowLeft | L4 |
| Entry guard (no instant close) | — | — | — | L4 |

## Playing Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Player movement | — | touch drag | Arrow keys, WASD | L3 |
| Fire | — | touch (auto) | Space | L3 |
| Pause | `GameplayZones.PAUSE_BTN` | tap zone | Escape | L5 |
| Weapon swap | — | double-tap | Tab | L3 |
| Enemy grid exists | — | — | — | L1 |
| Bullets fire and move | — | — | Space | L2 |
| Time advances (not double) | — | — | — | L3 |
| Score increments on kill | — | — | — | L3 |
| Wave progression | — | — | — | L3 |
| Boss spawn on boss wave | — | — | — | L2 |
| Powerup collection | — | — | — | L3 |
| Combo tracking | — | — | — | L2 |
| Starfield renders | — | — | — | L1 |
| Particles on kill | — | — | — | L1 |
| Screen shake on hit | — | — | — | L1 |

## Pause Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Resume (tap) | full canvas | tap | — | L2 |
| Resume (Escape) | — | — | Escape | L2 |
| Time frozen while paused | — | — | — | L3 |
| Enemies frozen while paused | — | — | — | L3 |

## Game Over Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Display delay (1.5s) | — | — | — | L3 |
| Early tap blocked | `GameplayZones.GAMEOVER_TAP` | tap | — | L4 |
| Continue after delay | `GameplayZones.GAMEOVER_TAP` | tap | Enter | L5 |

## High Score Scene

| Element | Zone | Touch | Keyboard | Depth |
|---------|------|-------|----------|-------|
| Entry guard (no instant submit) | — | — | — | L4 |
| Submit score | — | — | Enter | L5 |
| Returns to menu after submit | — | — | — | L5 |

## Cross-Scene Flows

| Flow | Scenes | Depth |
|------|--------|-------|
| First-time player | menu → tutorial → menu → play → die → menu | L5 |
| Shop purchase | menu → shop → buy → equip → menu → play → skin active | L5 |
| Skill upgrade | menu → skills → upgrade → menu → play → stat applies | L5 |
| Full lifecycle | menu → play → die → gameOver → highScore → menu | L5 |
| Second game | (full lifecycle) → play again → state reset, economy persists | L5 |
| Config persistence | change difficulty → play → die → menu → difficulty preserved | L5 |

## Responsive Testing

| Viewport | Name | Resolution |
|----------|------|------------|
| iPhone 14 | `mobile-portrait` | 390×844 |
| iPhone landscape | `mobile-landscape` | 844×390 |
| iPad | `tablet` | 768×1024 |
| Desktop | `desktop` | 1280×720 |

Every test runs across all 4 viewports.
