/**
 * EnemySystem -- Pure logic for enemy grid management.
 *
 * Reads/writes state via store (Immer drafts). Emits events via eventBus.
 * No rendering, no DOM.
 *
 * @module systems/EnemySystem
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ENEMY_COLS,
  ENEMY_ROWS,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_PADDING_X,
  ENEMY_PADDING_Y,
  ENEMY_BASE_SPEED,
  ENEMY_SPEED_INCREASE,
  ENEMY_DROP,
  ENEMY_FIRE_INTERVAL_MIN,
  ENEMY_FIRE_INTERVAL_MAX,
  ENEMY_BULLET_SPEED,
  POINTS_SMISKI,
  POINTS_JELLYCAT,
  POINTS_TIE,
} from '../constants';

import {
  ENEMY_REACHED_BOTTOM,
} from '../core/events';

import type { Draft } from 'immer';
import type {
  GameStore,
  IEventBus,
  IEnemySystem,
  Enemy,
  EnemyGridState,
  DifficultySettings,
  EnemyTypeDef,
  Bullet,
} from '../types/systems';
import type { SpecialType, MovementPattern } from '../types/game';
import { random } from '../core/Random';

// ── Enemy types ───────────────────────────────────────────────────────────────

const ENEMY_TYPES: readonly EnemyTypeDef[] = [
  { name: 'tie_fighter', points: POINTS_TIE },
  { name: 'jellycat', points: POINTS_JELLYCAT },
  { name: 'smiski', points: POINTS_SMISKI },
];

// ── Formation templates ───────────────────────────────────────────────────────

type FormationRow = readonly number[];
type Formation = readonly FormationRow[] | null;

const FORMATIONS: Readonly<Record<string, Formation>> = {
  rectangle: null,
  diamond: [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
  ],
  arrow: [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,0,0,1,1,0,0],
    [0,1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,0,0,1,1],
  ],
  x_shape: [
    [1,1,0,0,0,0,0,0,1,1],
    [0,1,1,0,0,0,0,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,0,0,1,1],
  ],
  zigzag: [
    [1,1,0,0,1,1,0,0,1,1],
    [0,1,1,0,0,1,1,0,0,1],
    [0,0,1,1,0,0,1,1,0,0],
    [0,1,1,0,0,1,1,0,0,1],
    [1,1,0,0,1,1,0,0,1,1],
  ],
  walls: [
    [1,0,1,0,1,1,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1],
    [1,0,1,0,1,1,0,1,0,1],
  ],
  heart: [
    [0,1,1,0,0,0,1,1,0,0],
    [1,1,1,1,0,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,0,0,0],
  ],
  spiral: [
    [1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,1,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
  ],
  cross: [
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
  ],
  scatter: [
    [1,0,0,1,0,0,1,0,0,1],
    [0,0,1,0,0,1,0,0,1,0],
    [0,1,0,0,1,0,0,1,0,0],
    [1,0,0,1,0,0,1,0,0,1],
    [0,1,0,0,1,0,0,1,0,0],
  ],
  pincer: [
    [1,1,1,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,1,1,1],
  ],
  wave_form: [
    [0,1,0,0,1,0,0,1,0,0],
    [1,0,1,0,0,1,0,0,1,0],
    [0,0,0,1,0,0,1,0,0,1],
    [1,0,1,0,0,1,0,0,1,0],
    [0,1,0,0,1,0,0,1,0,0],
  ],
  fortress: [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1],
  ],
  checkers: [
    [1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,0,1,0],
  ],
  tulip: [
    [0,0,1,1,0,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
  ],
  cat_face: [
    [1,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,1,1],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,1,1,0,0,0,0,1,1,0],
  ],
  tequila: [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
  ],
  star_wars: [
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,0,0,1,0,0,0],
    [1,1,1,1,1,1,1,1,1,1],
    [0,0,0,1,0,0,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
  ],
  ski_slope: [
    [1,0,0,0,0,0,0,0,0,0],
    [1,1,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,1,1,1,1],
  ],
  camera: [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,1,1,1,1,0,0,1],
    [1,0,0,1,0,0,1,0,0,1],
    [1,0,0,1,1,1,1,0,0,1],
    [1,1,1,1,1,1,1,1,1,1],
  ],
  dice: [
    [1,0,0,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,0,1],
  ],
};

const FORMATION_KEYS = Object.keys(FORMATIONS);

// ── Special enemy HP map ──────────────────────────────────────────────────────

const SPECIAL_HP: Readonly<Record<string, number>> = {
  shielded: 2,
  tank: 5,
  berserker: 2,
  vampire: 2,
  summoner: 3,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Pick a formation that hasn't been used in the last 10 waves.
 */
function pickFormation(wave: number, recentFormations: string[]): string {
  if (wave === 1) return 'rectangle';

  const available = FORMATION_KEYS.filter((k) => !recentFormations.includes(k));
  const pool = available.length > 0 ? available : FORMATION_KEYS;
  const pick = pool[Math.floor(random() * pool.length)] ?? 'rectangle';

  recentFormations.push(pick);
  if (recentFormations.length > 10) {
    recentFormations.shift();
  }

  return pick;
}

/**
 * Build list of available special types based on wave.
 */
function getAvailableSpecials(wave: number): SpecialType[] {
  const specials: SpecialType[] = ['shielded', 'bomber'];
  if (wave >= 2) specials.push('sniper', 'speed_demon');
  if (wave >= 3) specials.push('healer', 'splitter');
  if (wave >= 5) specials.push('teleporter', 'tank');
  if (wave >= 7) specials.push('mirror', 'vampire');
  if (wave >= 10) specials.push('summoner', 'ghost_enemy');
  if (wave >= 12) specials.push('berserker');
  return specials;
}

/**
 * For each column, find the lowest alive enemy.
 */
function getBottomRowEnemies(alive: readonly Enemy[]): Enemy[] {
  const bottomByCol: Record<number, Enemy> = {};
  for (const e of alive) {
    const existing = bottomByCol[e.col];
    if (!existing || e.y > existing.y) {
      bottomByCol[e.col] = e;
    }
  }
  return Object.values(bottomByCol);
}

/**
 * Compute movement pattern offset for a single enemy.
 */
function computePatternOffset(
  e: Enemy,
  t: number,
): { readonly offsetX: number; readonly offsetY: number } {
  let offsetX = 0;
  let offsetY = 0;

  switch (e.pattern) {
    case 'lock_step':
      offsetX = Math.sin(t) * e.patternRadius;
      break;
    case 'pulse': {
      const distFromCenter = (e.col - 4.5) / 4.5;
      offsetX = Math.sin(t) * e.patternRadius * distFromCenter;
      offsetY = Math.cos(t) * e.patternRadius * 0.3;
      break;
    }
    case 'zigzag_march': {
      const zigzag = (((t % (Math.PI * 2)) / Math.PI) - 1);
      offsetX = zigzag * e.patternRadius;
      offsetY = Math.abs(zigzag) * e.patternRadius * 0.3;
      break;
    }
    case 'breathe': {
      const breathe = 1 + Math.sin(t * 0.8) * 0.15;
      const cx = CANVAS_WIDTH / 2;
      offsetX = (e.baseX - cx) * (breathe - 1);
      offsetY = Math.sin(t) * e.patternRadius * 0.2;
      break;
    }
    case 'figure8':
      offsetX = Math.sin(t) * e.patternRadius;
      offsetY = Math.sin(t * 2) * e.patternRadius * 0.5;
      break;
    case 'orbit':
      offsetX = Math.cos(t) * e.patternRadius;
      offsetY = Math.sin(t) * e.patternRadius;
      break;
    default:
      break;
  }

  return { offsetX, offsetY };
}

// ── System factory ────────────────────────────────────────────────────────────

/**
 * Creates the enemy grid management system.
 */
export function createEnemySystem(store: GameStore, eventBus: IEventBus): IEnemySystem {
  const unsubscribers: Array<() => void> = [];

  // Listen for photo flash freeze
  const offFlash = eventBus.on('ability:photoFlash', () => {
    store.update((draft) => {
      draft.combat.grid.isEnemyFrozen = true;
      draft.combat.grid.freezeTimer = 3.0;
    });
  });
  unsubscribers.push(offFlash);

  // ── Public API ────────────────────────────────────────────────────────────

  function createGrid(
    wave: number,
    difficulty?: DifficultySettings,
    doubleEnemies?: boolean,
  ): void {
    store.update((draft) => {
      if (!draft.combat.grid.recentFormations) {
        draft.combat.grid.recentFormations = [];
      }

      const spacingTighten = Math.max(0.7, 1 - (wave - 1) * 0.03);
      const cellW = (ENEMY_WIDTH + ENEMY_PADDING_X) * spacingTighten;
      const cellH = (ENEMY_HEIGHT + ENEMY_PADDING_Y) * spacingTighten;

      const formationName = pickFormation(wave, draft.combat.grid.recentFormations);
      const formation = FORMATIONS[formationName] ?? null;
      const extraRows = (difficulty && difficulty.extraRows) ?? 0;
      const rows = (formation ? formation.length : ENEMY_ROWS) + extraRows;
      const cols = ENEMY_COLS;

      const gridW = cols * cellW;
      const startX = (CANVAS_WIDTH - gridW) / 2 + cellW / 2;
      const startY = 60;

      const enemies: Enemy[] = [];
      const specials = getAvailableSpecials(wave);

      for (let row = 0; row < rows; row++) {
        const typeIdx = row % ENEMY_TYPES.length;
        const type = ENEMY_TYPES[typeIdx]!;
        for (let col = 0; col < cols; col++) {
          if (formation && formation[row] && formation[row]![col] === 0) continue;

          const isElite = wave >= 3 && random() < 0.08;
          const targetY = startY + row * cellH;
          const entryDelay = row * 0.3 + col * 0.05;

          let special: SpecialType | null = null;
          if (!isElite) {
            const roll = random();
            const chance = Math.min(0.25, 0.10 + wave * 0.01);
            if (roll < chance) {
              special = specials[Math.floor(random() * specials.length)] ?? null;
            }
          }

          const baseHp = isElite ? 3 : (SPECIAL_HP[special ?? ''] ?? 1);

          const patterns: MovementPattern[] = ['lock_step', 'pulse', 'zigzag_march', 'breathe'];
          const pattern = patterns[row % patterns.length] ?? 'lock_step';
          const patternSpeed = 1.0 + wave * 0.05;
          const patternRadius = 4 + Math.min(wave, 10);
          const patternPhase = col * 0.3;

          enemies.push({
            x: startX + col * cellW,
            y: -30 - row * 20,
            baseX: startX + col * cellW,
            baseY: targetY,
            targetY,
            entering: true,
            entryDelay,
            row,
            col,
            type: type.name,
            points: isElite ? type.points * 5 : special ? type.points * 3 : type.points,
            alive: true,
            flashTimer: 0,
            elite: isElite,
            hp: baseHp,
            guaranteedDrop: isElite,
            special,
            teleportTimer: special === 'teleporter' ? 3 + random() * 4 : 0,
            healTimer: special === 'healer' ? 4 + random() * 3 : 0,
            pattern,
            patternSpeed,
            patternRadius,
            patternPhase,
            moveTime: 0,
          });
        }
      }

      // Double enemies modifier
      if (doubleEnemies) {
        const extra = enemies.map((e) => ({
          ...e,
          baseX: e.baseX + cellW * 0.5,
          x: e.x + cellW * 0.5,
          entryDelay: e.entryDelay + 0.1,
        }));
        enemies.push(...extra);
      }

      const speedMul = difficulty ? (difficulty.enemySpeedMul ?? 1) : 1;
      const fireMul = difficulty ? (difficulty.enemyFireMul ?? 1) : 1;
      const speed = ENEMY_BASE_SPEED * Math.pow(1 + ENEMY_SPEED_INCREASE, wave - 1) * speedMul;

      draft.combat.grid.enemies = enemies as Draft<Enemy[]>;
      draft.combat.grid.direction = 1;
      draft.combat.grid.speed = speed;
      draft.combat.grid.baseSpeed = speed;
      draft.combat.grid.fireMul = fireMul;
      draft.combat.grid.fireTimer =
        (ENEMY_FIRE_INTERVAL_MIN + random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN)) * fireMul;
      draft.combat.grid.animFrame = 0;
      draft.combat.grid.animTimer = 0;
      draft.combat.grid.entryTime = 0;
      draft.combat.grid.diveTimer = 5 + random() * 5;
      draft.combat.grid.divers = [];
      draft.combat.grid.isEnemyFrozen = false;
      draft.combat.grid.freezeTimer = 0;
      draft.combat.grid.formationName = formationName;
    });
  }

  function spawnSplitEnemies(parent: Readonly<Enemy>): void {
    store.update((draft) => {
      const weakest = ENEMY_TYPES[ENEMY_TYPES.length - 1]!;
      for (let i = 0; i < 2; i++) {
        const spawnX = parent.x + (i === 0 ? -12 : 12);
        draft.combat.grid.enemies.push({
          x: spawnX,
          y: parent.y,
          baseX: spawnX,
          baseY: parent.y,
          targetY: parent.y,
          entering: false,
          entryDelay: 0,
          row: parent.row,
          col: parent.col,
          type: weakest.name,
          points: weakest.points,
          alive: true,
          flashTimer: 0,
          elite: false,
          hp: 1,
          guaranteedDrop: false,
          special: null,
          teleportTimer: 0,
          healTimer: 0,
          pattern: parent.pattern || 'lock_step',
          patternSpeed: parent.patternSpeed || 1.0,
          patternRadius: parent.patternRadius || 4,
          patternPhase: parent.patternPhase || 0,
          moveTime: 0,
        } as Draft<Enemy>);
      }
    });
  }

  function getAliveEnemies(): readonly Enemy[] {
    const state = store.getState();
    return state.combat.grid.enemies.filter((e) => e.alive);
  }

  function getLowestEnemyY(): number {
    const state = store.getState();
    let maxY = 0;
    for (const e of state.combat.grid.enemies) {
      if (e.alive && e.y > maxY) maxY = e.y;
    }
    return maxY;
  }

  function update(dt: number): void {
    store.update((draft) => {
      const grid = draft.combat.grid;

      // Freeze support
      if (grid.isEnemyFrozen) {
        grid.freezeTimer -= dt;
        if (grid.freezeTimer <= 0) {
          grid.isEnemyFrozen = false;
          grid.freezeTimer = 0;
        }
        return;
      }

      const alive = grid.enemies.filter((e) => e.alive);
      if (alive.length === 0) return;

      // Animation frame toggle
      grid.animTimer = (grid.animTimer ?? 0) + dt;
      if (grid.animTimer >= 0.5) {
        grid.animTimer = 0;
        grid.animFrame = grid.animFrame === 0 ? 1 : 0;
      }

      // Flash timers + special behaviors
      for (const e of grid.enemies) {
        if (e.flashTimer > 0) e.flashTimer = Math.max(0, e.flashTimer - dt);
        if (!e.alive || e.entering) continue;

        updateSpecialBehaviors(e, alive, grid, draft, dt);
      }

      // Entry animation
      let stillEntering = false;
      for (const e of grid.enemies) {
        if (!e.entering || !e.alive) continue;
        e.entryDelay -= dt;
        if (e.entryDelay > 0) {
          stillEntering = true;
          continue;
        }
        const speed = 250;
        e.y += speed * dt;
        if (e.y >= e.targetY) {
          e.y = e.targetY;
          e.baseY = e.targetY;
          e.entering = false;
        } else {
          stillEntering = true;
        }
      }

      // Safety: force-complete entry after 4s
      grid.entryTime = (grid.entryTime ?? 0) + dt;
      if (stillEntering && grid.entryTime < 4) return;

      if (stillEntering) {
        for (const e of grid.enemies) {
          if (e.entering && e.alive) {
            e.y = e.targetY;
            e.baseY = e.targetY;
            e.entering = false;
          }
        }
      }

      // Speed up as fewer enemies remain
      const speedMultiplier = 1 + (30 - alive.length) * 0.04;
      const currentSpeed = (grid.baseSpeed ?? grid.speed) * speedMultiplier;

      // Move base positions horizontally
      const dx = grid.direction * currentSpeed * dt;
      for (const e of alive) {
        if (e.diving) {
          if (e.homeX != null) e.homeX += dx;
          continue;
        }
        e.baseX += dx;

        // Apply movement pattern
        e.moveTime += dt;
        const t = e.moveTime * e.patternSpeed + e.patternPhase;
        const { offsetX, offsetY } = computePatternOffset(e, t);

        e.x = e.baseX + offsetX;
        e.y = e.baseY + offsetY;
      }

      // Edge detection
      let hitEdge = false;
      for (const e of alive) {
        if (e.diving) continue;
        if (e.baseX - ENEMY_WIDTH / 2 <= 4 || e.baseX + ENEMY_WIDTH / 2 >= CANVAS_WIDTH - 4) {
          hitEdge = true;
          break;
        }
      }

      if (hitEdge) {
        grid.direction *= -1;
        for (const e of alive) {
          if (e.diving) continue;
          e.baseY += ENEMY_DROP;
        }
      }

      // Enemy firing -- column-based
      grid.fireTimer -= dt;
      if (grid.fireTimer <= 0) {
        grid.fireTimer =
          (ENEMY_FIRE_INTERVAL_MIN + random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN)) *
          (grid.fireMul ?? 1);

        const bottomEnemies = getBottomRowEnemies(alive);
        if (bottomEnemies.length > 0) {
          const shooter = bottomEnemies[Math.floor(random() * bottomEnemies.length)]!;
          draft.combat.bullets.push({
            x: shooter.x,
            y: shooter.y + ENEMY_HEIGHT / 2 + 2,
            vy: ENEMY_BULLET_SPEED,
            isPlayer: false,
          } as Draft<Bullet>);
        }
      }

      // Dive-bombing
      grid.diveTimer = (grid.diveTimer ?? 5) - dt;
      if (grid.diveTimer <= 0 && alive.length > 3) {
        grid.diveTimer = 4 + random() * 6;
        const candidates = alive.filter((e) => !e.diving);
        if (candidates.length > 0) {
          const diver = candidates[Math.floor(random() * candidates.length)]!;
          diver.diving = true;
          diver.divePhase = 0;
          diver.diveTime = 0;
          diver.homeX = diver.x;
          diver.homeY = diver.y;
          diver.diveSpeed = 120 + random() * 60;
          if (!grid.divers) grid.divers = [];
          grid.divers.push(diver);
        }
      }

      // Update divers
      if (grid.divers) {
        for (let i = grid.divers.length - 1; i >= 0; i--) {
          const d = grid.divers[i];
          if (!d) continue;
          if (!d.alive) {
            grid.divers.splice(i, 1);
            continue;
          }

          d.diveTime = (d.diveTime ?? 0) + dt;

          switch (d.divePhase) {
            case 0:
              d.x += Math.sin((d.diveTime ?? 0) * 3) * (d.diveSpeed ?? 120) * 0.6 * dt;
              d.y += (d.diveSpeed ?? 120) * dt;
              if (d.y > CANVAS_HEIGHT + 20) {
                d.divePhase = 1;
                d.x = (d.homeX ?? d.x) + (random() - 0.5) * 60;
                d.y = -20;
              }
              break;
            case 1: {
              d.y += (d.diveSpeed ?? 120) * 0.8 * dt;
              const ddx = (d.homeX ?? d.x) - d.x;
              d.x += ddx * 2 * dt;
              if (d.y >= (d.homeY ?? 0)) {
                d.y = d.homeY ?? 0;
                d.x = d.homeX ?? d.x;
                d.diving = false;
                grid.divers.splice(i, 1);
              }
              break;
            }
          }
        }
      }

      // Check if enemies reached bottom
      for (const e of alive) {
        if (e.y > CANVAS_HEIGHT - 40) {
          eventBus.emit(ENEMY_REACHED_BOTTOM, { enemy: { ...e } });
        }
      }
    });
  }

  function dispose(): void {
    for (const unsub of unsubscribers) {
      unsub();
    }
    unsubscribers.length = 0;
  }

  return {
    update,
    createGrid,
    getAliveEnemies,
    getLowestEnemyY,
    spawnSplitEnemies,
    dispose,
  };
}

// ── Special behavior updates (called inside Immer draft) ──────────────────────

function updateSpecialBehaviors(
  e: Draft<Enemy>,
  alive: Draft<Enemy>[],
  grid: Draft<EnemyGridState>,
  draft: Draft<{ combat: { bullets: Bullet[] }; [key: string]: unknown }>,
  dt: number,
): void {
  // Teleporter
  if (e.special === 'teleporter' && !e.diving) {
    e.teleportTimer = (e.teleportTimer ?? 3) - dt;
    if (e.teleportTimer <= 0) {
      e.teleportTimer = 3 + random() * 4;
      e.baseX = 30 + random() * (CANVAS_WIDTH - 60);
      e.baseY = 50 + random() * (CANVAS_HEIGHT * 0.4);
      e.flashTimer = 0.15;
    }
  }

  // Healer -- restores HP to nearby damaged enemies
  if (e.special === 'healer') {
    e.healTimer = (e.healTimer ?? 4) - dt;
    if (e.healTimer <= 0) {
      e.healTimer = 3 + random() * 2;
      for (const other of alive) {
        if (other === e || !other.alive) continue;
        const maxHp = other.elite ? 3 : (SPECIAL_HP[other.special ?? ''] ?? 1);
        if (other.hp < maxHp) {
          other.hp += 1;
          other.flashTimer = 0.1;
          break;
        }
      }
    }
  }

  // Speed demon
  if (e.special === 'speed_demon') {
    e.patternSpeed = 3.0;
    e.patternRadius = 20;
  }

  // Bomber -- fires 3 bullets spread
  if (e.special === 'bomber') {
    if (!e.bomberTimer) e.bomberTimer = 3 + random() * 3;
    e.bomberTimer -= dt;
    if (e.bomberTimer <= 0) {
      e.bomberTimer = 3 + random() * 3;
      for (let bi = -1; bi <= 1; bi++) {
        draft.combat.bullets.push({
          x: e.x + bi * 10,
          y: e.y + ENEMY_HEIGHT / 2,
          vx: bi * 30,
          vy: ENEMY_BULLET_SPEED * 1.2,
          isPlayer: false,
        } as Draft<Bullet>);
      }
    }
  }

  // Sniper -- fast accurate shots
  if (e.special === 'sniper') {
    if (!e.sniperTimer) e.sniperTimer = 4 + random() * 2;
    e.sniperTimer -= dt;
    if (e.sniperTimer <= 0) {
      e.sniperTimer = 4 + random() * 2;
      draft.combat.bullets.push({
        x: e.x,
        y: e.y + ENEMY_HEIGHT / 2,
        vy: ENEMY_BULLET_SPEED * 2,
        isPlayer: false,
      } as Draft<Bullet>);
    }
  }

  // Mirror -- erratic figure8
  if (e.special === 'mirror') {
    e.patternSpeed = 2.0;
    e.pattern = 'figure8';
  }

  // Vampire -- fires draining bullets
  if (e.special === 'vampire') {
    if (!e.vampTimer) e.vampTimer = 2 + random() * 2;
    e.vampTimer -= dt;
    if (e.vampTimer <= 0) {
      e.vampTimer = 2 + random() * 2;
      draft.combat.bullets.push({
        x: e.x,
        y: e.y + ENEMY_HEIGHT / 2,
        vy: ENEMY_BULLET_SPEED * 1.5,
        isPlayer: false,
        vampire: true,
      } as Draft<Bullet>);
    }
  }

  // Summoner -- spawns a basic enemy periodically
  if (e.special === 'summoner') {
    if (!e.summonTimer) e.summonTimer = 6 + random() * 4;
    e.summonTimer -= dt;
    if (e.summonTimer <= 0 && alive.length < 40) {
      e.summonTimer = 6 + random() * 4;
      const spawnType = ENEMY_TYPES[Math.floor(random() * ENEMY_TYPES.length)]!;
      grid.enemies.push({
        x: e.x + (random() - 0.5) * 30,
        y: e.y,
        baseX: e.baseX + (random() - 0.5) * 30,
        baseY: e.baseY,
        targetY: e.baseY + 20,
        entering: false,
        entryDelay: 0,
        row: e.row,
        col: e.col,
        type: spawnType.name,
        points: spawnType.points,
        alive: true,
        flashTimer: 0.2,
        elite: false,
        hp: 1,
        guaranteedDrop: false,
        special: null,
        teleportTimer: 0,
        healTimer: 0,
        pattern: 'orbit',
        patternSpeed: 1 + random(),
        patternRadius: 10 + random() * 10,
        patternPhase: random() * Math.PI * 2,
        moveTime: 0,
      } as Draft<Enemy>);
    }
  }

  // Ghost enemy -- flickers
  if (e.special === 'ghost_enemy') {
    if (!e.ghostPhase) e.ghostPhase = random() * Math.PI * 2;
    e.ghostPhase += dt * 2;
  }

  // Berserker -- enraged when low HP
  if (e.special === 'berserker' && e.hp <= 1) {
    e.patternSpeed = 4.0;
    e.patternRadius = 25;
  }
}
