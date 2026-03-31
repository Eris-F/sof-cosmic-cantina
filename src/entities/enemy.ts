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
  BARRIER_Y,
  POINTS_SMISKI,
  POINTS_JELLYCAT,
  POINTS_TIE,
} from '../constants';
import { drawSmiski, drawJellycat, drawTieFighter } from '../sprites';
import type { Bullet } from './bullet';

export type EnemyTypeName = 'smiski' | 'jellycat' | 'tie';

export type EnemySpecial =
  | 'shielded'
  | 'bomber'
  | 'sniper'
  | 'speed_demon'
  | 'healer'
  | 'splitter'
  | 'teleporter'
  | 'tank'
  | 'mirror'
  | 'vampire'
  | 'summoner'
  | 'ghost_enemy'
  | 'berserker';

export type MovementPattern =
  | 'lock_step'
  | 'pulse'
  | 'zigzag_march'
  | 'breathe'
  | 'figure8'
  | 'orbit';

type DrawFn = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => void;

interface EnemyTypeInfo {
  readonly name: EnemyTypeName;
  readonly points: number;
  readonly draw: DrawFn;
}

export type FormationName =
  | 'rectangle' | 'diamond' | 'arrow' | 'x_shape' | 'zigzag'
  | 'walls' | 'heart' | 'spiral' | 'cross' | 'scatter'
  | 'pincer' | 'wave_form' | 'fortress' | 'checkers'
  | 'tulip' | 'cat_face' | 'tequila' | 'star_wars'
  | 'ski_slope' | 'camera' | 'dice';

type FormationTemplate = readonly (readonly number[])[] | null;

export interface EnemyEntity {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetY: number;
  entering: boolean;
  entryDelay: number;
  readonly row: number;
  readonly col: number;
  readonly type: EnemyTypeName;
  readonly points: number;
  readonly drawFn: DrawFn;
  alive: boolean;
  flashTimer: number;
  readonly elite: boolean;
  hp: number;
  readonly guaranteedDrop: boolean;
  readonly special: EnemySpecial | null;
  teleportTimer: number;
  healTimer: number;
  pattern: MovementPattern;
  patternSpeed: number;
  patternRadius: number;
  readonly patternPhase: number;
  moveTime: number;
  // Dive state
  diving?: boolean;
  divePhase?: number;
  diveTime?: number;
  homeX?: number;
  homeY?: number;
  diveSpeed?: number;
  // Special timers
  bomberTimer?: number;
  sniperTimer?: number;
  vampTimer?: number;
  summonTimer?: number;
  ghostPhase?: number;
}

export interface DifficultyConfig {
  readonly extraRows?: number;
  readonly enemySpeedMul?: number;
  readonly enemyFireMul?: number;
}

export interface EnemyGrid {
  enemies: EnemyEntity[];
  direction: 1 | -1;
  speed: number;
  readonly baseSpeed: number;
  readonly fireMul: number;
  fireTimer: number;
  animFrame: number;
  animTimer: number;
  entryTime: number;
  diveTimer: number;
  divers: EnemyEntity[];
  renderScale?: number;
  ghostFlicker?: boolean;
}

const ENEMY_TYPES: readonly EnemyTypeInfo[] = [
  { name: 'tie', points: POINTS_TIE, draw: drawTieFighter },
  { name: 'jellycat', points: POINTS_JELLYCAT, draw: drawJellycat },
  { name: 'smiski', points: POINTS_SMISKI, draw: drawSmiski },
];

// Formation templates -- 1 = enemy present, 0 = empty
// Each formation is [row][col] for a 5-row x 10-col grid (rows map to enemy types)
const FORMATIONS: Readonly<Record<string, FormationTemplate>> = {
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
let recentFormations: string[] = [];

function pickFormation(wave: number): string {
  if (wave === 1) return 'rectangle';

  // Filter out recently used formations
  const available = FORMATION_KEYS.filter((k) => !recentFormations.includes(k));
  const pool = available.length > 0 ? available : FORMATION_KEYS;
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? 'rectangle';

  recentFormations.push(pick);
  if (recentFormations.length > 10) recentFormations.shift();

  return pick;
}

export function createEnemyGrid(wave: number, diff?: DifficultyConfig): EnemyGrid {
  const enemies: EnemyEntity[] = [];
  const spacingTighten = Math.max(0.7, 1 - (wave - 1) * 0.03);
  const cellW = (ENEMY_WIDTH + ENEMY_PADDING_X) * spacingTighten;
  const cellH = (ENEMY_HEIGHT + ENEMY_PADDING_Y) * spacingTighten;

  const formationName = pickFormation(wave);
  const formation = FORMATIONS[formationName];
  const extraRows = (diff && diff.extraRows) || 0;
  const rows = (formation ? formation.length : ENEMY_ROWS) + extraRows;
  const cols = ENEMY_COLS;

  const gridW = cols * cellW;
  const startX = (CANVAS_WIDTH - gridW) / 2 + cellW / 2;
  const startY = 60;

  for (let row = 0; row < rows; row++) {
    const typeIdx = row % ENEMY_TYPES.length;
    const type = ENEMY_TYPES[typeIdx]!;
    for (let col = 0; col < cols; col++) {
      // Skip empty slots in formation (extra rows beyond formation are always filled)
      if (formation && formation[row] !== undefined && formation[row]![col] === 0) continue;

      const isElite = wave >= 3 && Math.random() < 0.08;
      const targetY = startY + row * cellH;
      const entryDelay = row * 0.3 + col * 0.05;

      // Special enemy types -- available from wave 1, more variety as waves progress
      let special: EnemySpecial | null = null;
      if (!isElite) {
        const roll = Math.random();
        const specials: EnemySpecial[] = ['shielded', 'bomber'];
        if (wave >= 2) specials.push('sniper', 'speed_demon');
        if (wave >= 3) specials.push('healer', 'splitter');
        if (wave >= 5) specials.push('teleporter', 'tank');
        if (wave >= 7) specials.push('mirror', 'vampire');
        if (wave >= 10) specials.push('summoner', 'ghost_enemy');
        if (wave >= 12) specials.push('berserker');

        const chance = Math.min(0.25, 0.10 + wave * 0.01);
        if (roll < chance) {
          special = specials[Math.floor(Math.random() * specials.length)] ?? null;
        }
      }

      const specialHp: Partial<Record<EnemySpecial, number>> = {
        shielded: 2, tank: 5, berserker: 2, vampire: 2, summoner: 3,
      };
      const baseHp = isElite ? 3 : (specialHp[special as EnemySpecial] || 1);

      // Movement patterns -- geometric, synchronized per row
      const patterns: MovementPattern[] = ['lock_step', 'pulse', 'zigzag_march', 'breathe'];
      const pattern = patterns[row % patterns.length]!;
      const patternSpeed = 1.0 + wave * 0.05;
      const patternRadius = 4 + Math.min(wave, 10);
      const patternPhase = col * 0.3; // offset per column for wave effect

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
        drawFn: type.draw,
        alive: true,
        flashTimer: 0,
        elite: isElite,
        hp: baseHp,
        guaranteedDrop: isElite,
        special,
        teleportTimer: special === 'teleporter' ? 3 + Math.random() * 4 : 0,
        healTimer: special === 'healer' ? 4 + Math.random() * 3 : 0,
        pattern,
        patternSpeed,
        patternRadius,
        patternPhase,
        moveTime: 0,
      });
    }
  }

  const speedMul = diff ? (diff.enemySpeedMul ?? 1) : 1;
  const fireMul = diff ? (diff.enemyFireMul ?? 1) : 1;
  const speed = ENEMY_BASE_SPEED * Math.pow(1 + ENEMY_SPEED_INCREASE, wave - 1) * speedMul;

  return {
    enemies,
    direction: 1,
    speed,
    baseSpeed: speed,
    fireMul,
    fireTimer: (ENEMY_FIRE_INTERVAL_MIN + Math.random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN)) * fireMul,
    animFrame: 0,
    animTimer: 0,
    entryTime: 0,
    diveTimer: 5 + Math.random() * 5,
    divers: [],
  };
}

export function updateEnemyGrid(grid: EnemyGrid, bullets: Bullet[], dt: number): void {
  const alive = grid.enemies.filter((e) => e.alive);
  if (alive.length === 0) return;

  // Animation frame toggle
  grid.animTimer += dt;
  if (grid.animTimer >= 0.5) {
    grid.animTimer = 0;
    grid.animFrame = grid.animFrame === 0 ? 1 : 0;
  }

  // Flash timers + special behaviors
  for (const e of grid.enemies) {
    if (e.flashTimer > 0) e.flashTimer = Math.max(0, e.flashTimer - dt);
    if (!e.alive || e.entering) continue;

    // Teleporter -- blinks to new position (clamped to visible area)
    if (e.special === 'teleporter' && !e.diving) {
      e.teleportTimer -= dt;
      if (e.teleportTimer <= 0) {
        e.teleportTimer = 3 + Math.random() * 4;
        e.baseX = 30 + Math.random() * (CANVAS_WIDTH - 60);
        e.baseY = 50 + Math.random() * (CANVAS_HEIGHT * 0.4);
        e.flashTimer = 0.15;
      }
    }

    // Healer -- restores HP to nearby enemies
    if (e.special === 'healer') {
      e.healTimer -= dt;
      if (e.healTimer <= 0) {
        e.healTimer = 3 + Math.random() * 2;
        const maxHpMap: Partial<Record<EnemySpecial, number>> = { shielded: 2, tank: 5, berserker: 2, vampire: 2, summoner: 3 };
        for (const other of alive) {
          if (other === e || !other.alive) continue;
          const maxHp = other.elite ? 3 : (maxHpMap[other.special as EnemySpecial] || 1);
          if (other.hp < maxHp) {
            other.hp += 1;
            other.flashTimer = 0.1;
            break;
          }
        }
      }
    }

    // Speed demon -- moves 3x faster pattern
    if (e.special === 'speed_demon') {
      e.patternSpeed = 3.0;
      e.patternRadius = 20;
    }

    // Bomber -- fires 3 bullets at once periodically
    if (e.special === 'bomber') {
      if (!e.bomberTimer) e.bomberTimer = 3 + Math.random() * 3;
      e.bomberTimer -= dt;
      if (e.bomberTimer <= 0) {
        e.bomberTimer = 3 + Math.random() * 3;
        for (let bi = -1; bi <= 1; bi++) {
          bullets.push({
            x: e.x + bi * 10,
            y: e.y + ENEMY_HEIGHT / 2,
            vx: bi * 30,
            vy: ENEMY_BULLET_SPEED * 1.2,
            isPlayer: false,
          });
        }
      }
    }

    // Sniper -- fires fast accurate shots at longer intervals
    if (e.special === 'sniper') {
      if (!e.sniperTimer) e.sniperTimer = 4 + Math.random() * 2;
      e.sniperTimer -= dt;
      if (e.sniperTimer <= 0) {
        e.sniperTimer = 4 + Math.random() * 2;
        bullets.push({
          x: e.x,
          y: e.y + ENEMY_HEIGHT / 2,
          vy: ENEMY_BULLET_SPEED * 2,
          isPlayer: false,
        });
      }
    }

    // Mirror -- copies movement of player (horizontally mirrored)
    if (e.special === 'mirror') {
      // Mirror movement is handled in pattern -- just give it erratic motion
      e.patternSpeed = 2.0;
      e.pattern = 'figure8';
    }

    // Vampire -- steals score when it hits the player (handled in game.js)
    // Just make it aggressive with faster firing
    if (e.special === 'vampire') {
      if (!e.vampTimer) e.vampTimer = 2 + Math.random() * 2;
      e.vampTimer -= dt;
      if (e.vampTimer <= 0) {
        e.vampTimer = 2 + Math.random() * 2;
        bullets.push({
          x: e.x,
          y: e.y + ENEMY_HEIGHT / 2,
          vy: ENEMY_BULLET_SPEED * 1.5,
          isPlayer: false,
          vampire: true,
        });
      }
    }

    // Summoner -- spawns a basic enemy periodically
    if (e.special === 'summoner') {
      if (!e.summonTimer) e.summonTimer = 6 + Math.random() * 4;
      e.summonTimer -= dt;
      if (e.summonTimer <= 0 && alive.length < 40) {
        e.summonTimer = 6 + Math.random() * 4;
        const spawnType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]!;
        grid.enemies.push({
          x: e.x + (Math.random() - 0.5) * 30,
          y: e.y,
          baseX: e.baseX + (Math.random() - 0.5) * 30,
          baseY: e.baseY,
          targetY: e.baseY + 20,
          entering: false, entryDelay: 0,
          row: e.row, col: e.col,
          type: spawnType.name, points: spawnType.points, drawFn: spawnType.draw,
          alive: true, flashTimer: 0.2,
          elite: false, hp: 1, guaranteedDrop: false,
          special: null, teleportTimer: 0, healTimer: 0,
          pattern: 'orbit', patternSpeed: 1 + Math.random(),
          patternRadius: 10 + Math.random() * 10,
          patternPhase: Math.random() * Math.PI * 2, moveTime: 0,
        });
      }
    }

    // Ghost enemy -- flickers invisible periodically
    if (e.special === 'ghost_enemy') {
      if (!e.ghostPhase) e.ghostPhase = Math.random() * Math.PI * 2;
      e.ghostPhase += dt * 2;
    }

    // Berserker -- speeds up dramatically when below half health
    if (e.special === 'berserker' && e.hp <= 1) {
      e.patternSpeed = 4.0;
      e.patternRadius = 25;
    }
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

  // Don't move grid or fire until all have entered (max 4s safety)
  if (!grid.entryTime) grid.entryTime = 0;
  grid.entryTime += dt;
  if (stillEntering && grid.entryTime < 4) return;

  // Force all remaining entering enemies in
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
  const currentSpeed = grid.baseSpeed * speedMultiplier;

  // Move base positions horizontally (skip diving enemies)
  const dx = grid.direction * currentSpeed * dt;
  for (const e of alive) {
    if (e.diving) {
      e.homeX = (e.homeX ?? e.x) + dx;
      continue;
    }
    e.baseX += dx;

    // Apply geometric movement pattern
    e.moveTime += dt;
    const t = e.moveTime * e.patternSpeed + e.patternPhase;
    let offsetX = 0;
    let offsetY = 0;

    switch (e.pattern) {
      case 'lock_step':
        // Whole row shifts in sync -- tight left/right march
        offsetX = Math.sin(t) * e.patternRadius;
        offsetY = 0;
        break;
      case 'pulse': {
        // Row expands and contracts from center
        const distFromCenter = (e.col - 4.5) / 4.5;
        offsetX = Math.sin(t) * e.patternRadius * distFromCenter;
        offsetY = Math.cos(t) * e.patternRadius * 0.3;
        break;
      }
      case 'zigzag_march': {
        // Sharp zigzag -- triangle wave
        const zigzag = (((t % (Math.PI * 2)) / Math.PI) - 1);
        offsetX = zigzag * e.patternRadius;
        offsetY = Math.abs(zigzag) * e.patternRadius * 0.3;
        break;
      }
      case 'breathe': {
        // Entire formation scales in/out
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
    }

    e.x = e.baseX + offsetX;
    e.y = e.baseY + offsetY;
  }

  // Check edges -- any alive non-diving enemy base position hitting boundary
  let hitEdge = false;
  for (const e of alive) {
    if (e.diving) continue;
    if (e.baseX - ENEMY_WIDTH / 2 <= 4 || e.baseX + ENEMY_WIDTH / 2 >= CANVAS_WIDTH - 4) {
      hitEdge = true;
      break;
    }
  }

  if (hitEdge) {
    grid.direction = (grid.direction * -1) as 1 | -1;
    for (const e of alive) {
      if (e.diving) continue;
      e.baseY += ENEMY_DROP;
    }
  }

  // Enemy firing -- pick random enemy from bottom-most alive in each column
  grid.fireTimer -= dt;
  if (grid.fireTimer <= 0) {
    grid.fireTimer = (ENEMY_FIRE_INTERVAL_MIN + Math.random() * (ENEMY_FIRE_INTERVAL_MAX - ENEMY_FIRE_INTERVAL_MIN)) * (grid.fireMul || 1);

    const bottomEnemies = getBottomRowEnemies(alive);
    if (bottomEnemies.length > 0) {
      const shooter = bottomEnemies[Math.floor(Math.random() * bottomEnemies.length)]!;
      bullets.push({
        x: shooter.x,
        y: shooter.y + ENEMY_HEIGHT / 2 + 2,
        vy: ENEMY_BULLET_SPEED,
        isPlayer: false,
      });
    }
  }

  // Dive-bombing -- periodically an enemy swoops down
  grid.diveTimer -= dt;
  if (grid.diveTimer <= 0 && alive.length > 3) {
    grid.diveTimer = 4 + Math.random() * 6;

    // Pick a random alive enemy that isn't already diving
    const candidates = alive.filter((e) => !e.diving);
    if (candidates.length > 0) {
      const diver = candidates[Math.floor(Math.random() * candidates.length)]!;
      diver.diving = true;
      diver.divePhase = 0;
      diver.diveTime = 0;
      diver.homeX = diver.x;
      diver.homeY = diver.y;
      diver.diveSpeed = 120 + Math.random() * 60;
      grid.divers.push(diver);
    }
  }

  // Update divers
  for (let i = grid.divers.length - 1; i >= 0; i--) {
    const d = grid.divers[i]!;
    if (!d.alive) {
      grid.divers.splice(i, 1);
      continue;
    }

    d.diveTime = (d.diveTime ?? 0) + dt;

    switch (d.divePhase) {
      case 0:
        // Swoop down in an arc
        d.x += Math.sin((d.diveTime ?? 0) * 3) * (d.diveSpeed ?? 120) * 0.6 * dt;
        d.y += (d.diveSpeed ?? 120) * dt;
        if (d.y > CANVAS_HEIGHT + 20) {
          d.divePhase = 1;
          d.x = (d.homeX ?? d.x) + (Math.random() - 0.5) * 60;
          d.y = -20;
        }
        break;
      case 1: {
        // Return from top back to formation
        d.y += (d.diveSpeed ?? 120) * 0.8 * dt;
        const ddx = (d.homeX ?? d.x) - d.x;
        d.x += ddx * 2 * dt;
        if (d.y >= (d.homeY ?? d.y)) {
          d.y = d.homeY ?? d.y;
          d.x = d.homeX ?? d.x;
          d.diving = false;
          grid.divers.splice(i, 1);
        }
        break;
      }
    }
  }
}

function getBottomRowEnemies(alive: EnemyEntity[]): EnemyEntity[] {
  // For each column, find the lowest alive enemy
  const bottomByCol: Record<number, EnemyEntity> = {};
  for (const e of alive) {
    if (!bottomByCol[e.col] || e.y > bottomByCol[e.col]!.y) {
      bottomByCol[e.col] = e;
    }
  }
  return Object.values(bottomByCol);
}

export function spawnSplitEnemies(grid: EnemyGrid, parent: EnemyEntity): void {
  const type = ENEMY_TYPES[ENEMY_TYPES.length - 1]!; // spawn as smiski (weakest)
  for (let i = 0; i < 2; i++) {
    const spawnX = parent.x + (i === 0 ? -12 : 12);
    grid.enemies.push({
      x: spawnX,
      y: parent.y,
      baseX: spawnX,
      baseY: parent.y,
      targetY: parent.y,
      entering: false,
      entryDelay: 0,
      row: parent.row,
      col: parent.col,
      type: type.name,
      points: type.points,
      drawFn: type.draw,
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
    });
  }
}

export function hitEnemy(enemy: EnemyEntity): boolean {
  enemy.hp -= 1;
  if (enemy.hp <= 0) {
    enemy.alive = false;
    return true; // killed
  }
  return false; // damaged but alive
}

export function killEnemy(enemy: EnemyEntity): void {
  enemy.alive = false;
  enemy.flashTimer = 0;
}

export function flashEnemy(enemy: EnemyEntity): void {
  enemy.flashTimer = 0.08;
}

export function getAliveEnemies(grid: EnemyGrid): EnemyEntity[] {
  return grid.enemies.filter((e) => e.alive);
}

export function getLowestEnemyY(grid: EnemyGrid): number {
  let maxY = 0;
  for (const e of grid.enemies) {
    if (e.alive && e.y > maxY) maxY = e.y;
  }
  return maxY;
}

export function renderEnemyGrid(ctx: CanvasRenderingContext2D, grid: EnemyGrid, time: number): void {
  const lowestY = getLowestEnemyY(grid);
  const dangerZone = lowestY > BARRIER_Y - 60;
  const scale = grid.renderScale || 1;
  const ghostFlicker = grid.ghostFlicker || false;

  for (const e of grid.enemies) {
    if (!e.alive) continue;

    // ghostFlicker: enemies flicker in and out
    if (ghostFlicker || e.special === 'ghost_enemy') {
      const phase = e.ghostPhase || (e.x * 0.1 + time * 3);
      const alpha = 0.2 + 0.6 * Math.abs(Math.sin(phase));
      ctx.globalAlpha = alpha;
    }

    // enemyScale modifier
    if (scale !== 1) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.scale(scale, scale);
      ctx.translate(-e.x, -e.y);
    }

    // Danger warning: red pulse on bottom-most enemies when close to barriers
    const isBottomEnemy = dangerZone && e.y === lowestY;

    if (e.flashTimer > 0) {
      // White flash on hit
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      e.drawFn(ctx, e.x, e.y, grid.animFrame);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(e.x - ENEMY_WIDTH / 2, e.y - ENEMY_HEIGHT / 2, ENEMY_WIDTH, ENEMY_HEIGHT);
      ctx.restore();
    } else if (isBottomEnemy) {
      // Red warning pulse
      const pulse = 0.4 + 0.3 * Math.sin(time * 8);
      e.drawFn(ctx, e.x, e.y, grid.animFrame);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(e.x - ENEMY_WIDTH / 2, e.y - ENEMY_HEIGHT / 2, ENEMY_WIDTH, ENEMY_HEIGHT);
      ctx.restore();
    } else {
      e.drawFn(ctx, e.x, e.y, grid.animFrame);
    }

    // Elite glow ring
    if (e.elite && e.alive) {
      const pulse = 0.3 + 0.2 * Math.sin(time * 6);
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(e.x - ENEMY_WIDTH / 2 - 2, e.y - ENEMY_HEIGHT / 2 - 2, ENEMY_WIDTH + 4, ENEMY_HEIGHT + 4);
      ctx.restore();
    }

    // Special enemy indicators
    if (e.special && e.alive) {
      const sp = 0.5 + 0.3 * Math.sin(time * 5);
      ctx.save();
      ctx.globalAlpha = sp;
      switch (e.special) {
        case 'shielded':
          ctx.strokeStyle = '#4488ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y, ENEMY_WIDTH / 2 + 3, -Math.PI * 0.8, Math.PI * 0.8);
          ctx.stroke();
          break;
        case 'healer':
          ctx.fillStyle = '#44ff44';
          ctx.fillRect(e.x - 1, e.y - ENEMY_HEIGHT / 2 - 5, 2, 5);
          ctx.fillRect(e.x - 2, e.y - ENEMY_HEIGHT / 2 - 4, 4, 2);
          break;
        case 'splitter':
          ctx.fillStyle = '#ff8844';
          ctx.fillRect(e.x - 6, e.y + ENEMY_HEIGHT / 2 + 1, 3, 3);
          ctx.fillRect(e.x + 3, e.y + ENEMY_HEIGHT / 2 + 1, 3, 3);
          break;
        case 'teleporter':
          ctx.fillStyle = '#cc44ff';
          ctx.fillRect(e.x - ENEMY_WIDTH / 2 - 3, e.y - 1, 2, 2);
          ctx.fillRect(e.x + ENEMY_WIDTH / 2 + 1, e.y - 1, 2, 2);
          break;
        case 'bomber':
          ctx.fillStyle = '#ff4400';
          ctx.fillRect(e.x - 3, e.y + ENEMY_HEIGHT / 2, 6, 3);
          ctx.fillRect(e.x - 5, e.y + ENEMY_HEIGHT / 2 + 1, 2, 2);
          ctx.fillRect(e.x + 3, e.y + ENEMY_HEIGHT / 2 + 1, 2, 2);
          break;
        case 'sniper':
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y + ENEMY_HEIGHT / 2);
          ctx.lineTo(e.x, e.y + ENEMY_HEIGHT / 2 + 10);
          ctx.stroke();
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(e.x, e.y + ENEMY_HEIGHT / 2 + 12, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'tank':
          ctx.strokeStyle = '#888888';
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x - ENEMY_WIDTH / 2 - 2, e.y - ENEMY_HEIGHT / 2 - 2, ENEMY_WIDTH + 4, ENEMY_HEIGHT + 4);
          break;
        case 'speed_demon':
          ctx.fillStyle = '#ff44ff';
          for (let si = 1; si <= 3; si++) {
            ctx.globalAlpha = 0.2 / si;
            ctx.fillRect(e.x - ENEMY_WIDTH / 2 - si * 4, e.y - 2, 3, 4);
          }
          break;
        case 'mirror':
          ctx.strokeStyle = '#aaccff';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(e.x - ENEMY_WIDTH / 2 - 1, e.y - ENEMY_HEIGHT / 2 - 1, ENEMY_WIDTH + 2, ENEMY_HEIGHT + 2);
          ctx.setLineDash([]);
          break;
        case 'vampire':
          ctx.fillStyle = '#cc0000';
          ctx.fillRect(e.x - 3, e.y + ENEMY_HEIGHT / 2 - 2, 2, 4);
          ctx.fillRect(e.x + 1, e.y + ENEMY_HEIGHT / 2 - 2, 2, 4);
          break;
        case 'summoner':
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(e.x, e.y, ENEMY_WIDTH / 2 + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffaa00';
          ctx.font = '6px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+', e.x, e.y + ENEMY_HEIGHT / 2 + 8);
          ctx.textAlign = 'left';
          break;
        case 'ghost_enemy': {
          const ghostAlpha = 0.3 + 0.3 * Math.sin(e.ghostPhase || time * 2);
          ctx.globalAlpha = ghostAlpha;
          ctx.fillStyle = '#aabbdd';
          ctx.fillRect(e.x - ENEMY_WIDTH / 2, e.y - ENEMY_HEIGHT / 2, ENEMY_WIDTH, ENEMY_HEIGHT);
          break;
        }
        case 'berserker': {
          const rage = e.hp <= 1 ? 0.8 : 0.3;
          ctx.globalAlpha = rage;
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(e.x - ENEMY_WIDTH / 2 - 1, e.y - ENEMY_HEIGHT / 2 - 1, ENEMY_WIDTH + 2, ENEMY_HEIGHT + 2);
          break;
        }
      }
      ctx.restore();
    }

    // Restore scale transform
    if (scale !== 1) {
      ctx.restore();
    }
    // Reset ghost alpha
    ctx.globalAlpha = 1;
  }
}
