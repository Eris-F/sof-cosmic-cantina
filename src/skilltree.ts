import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import type { Wallet } from './shop';

// Skill tree branches themed around Sofia's interests
// Each branch has 5 levels, getting progressively more OP

export type SkillStat =
  | 'fireRate' | 'bulletSpeed' | 'maxBullets' | 'allFire'
  | 'speed' | 'dodge' | 'allSpeed'
  | 'lives' | 'startShield' | 'invincTime' | 'livesDodge' | 'allSurvival'
  | 'coins' | 'score' | 'allMoney'
  | 'powerDur' | 'powerDrop' | 'startAlly' | 'allPower';

export type BranchId = 'tequila' | 'skiing' | 'diving' | 'photography' | 'music';

export interface SkillLevel {
  readonly name: string;
  readonly cost: number;
  readonly perk: string;
  readonly stat: SkillStat;
  readonly value: number;
}

export interface SkillBranch {
  readonly id: BranchId;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly desc: string;
  readonly levels: readonly SkillLevel[];
}

export type SkillLevels = Record<BranchId, number>;

export interface SkillBonuses {
  fireRateMul: number;
  bulletSpeedMul: number;
  maxBulletBonus: number;
  speedMul: number;
  dodgeChance: number;
  extraLives: number;
  startShield: number;
  invincTimeBonus: number;
  coinMul: number;
  scoreMul: number;
  powerupDurationMul: number;
  powerupDropBonus: number;
  startCompanions: number;
}

export interface SkillTreeState {
  selectedBranch: number;
  levels: SkillLevels;
  flashMessage: string;
  flashTimer: number;
}

export interface UpgradeResult {
  readonly success: boolean;
  readonly wallet: Wallet;
  readonly newLevel?: number;
}

export const SKILL_BRANCHES: readonly SkillBranch[] = [
  {
    id: 'tequila',
    name: 'TEQUILA TOLERANCE',
    icon: 'T',
    color: '#ccaa44',
    desc: 'Offensive power',
    levels: [
      { name: 'Sip', cost: 100, perk: 'Fire Rate +5%', stat: 'fireRate', value: 0.05 },
      { name: 'Shot', cost: 250, perk: 'Fire Rate +10%', stat: 'fireRate', value: 0.10 },
      { name: 'Double', cost: 500, perk: 'Bullet Speed +15%', stat: 'bulletSpeed', value: 0.15 },
      { name: 'Bottle', cost: 1000, perk: 'Extra Bullet +1', stat: 'maxBullets', value: 1 },
      { name: 'Barrel', cost: 2000, perk: 'All Fire Stats +20%', stat: 'allFire', value: 0.20 },
    ],
  },
  {
    id: 'skiing',
    name: 'SKI LEGS',
    icon: 'S',
    color: '#44ccff',
    desc: 'Speed & agility',
    levels: [
      { name: 'Bunny Slope', cost: 100, perk: 'Speed +5%', stat: 'speed', value: 0.05 },
      { name: 'Blue Run', cost: 250, perk: 'Speed +10%', stat: 'speed', value: 0.10 },
      { name: 'Red Run', cost: 500, perk: 'Dodge +5%', stat: 'dodge', value: 0.05 },
      { name: 'Black Diamond', cost: 1000, perk: 'Speed +15%', stat: 'speed', value: 0.15 },
      { name: 'Heli-Ski', cost: 2000, perk: 'Dodge +15% Speed +10%', stat: 'allSpeed', value: 0.15 },
    ],
  },
  {
    id: 'diving',
    name: 'DEEP LUNGS',
    icon: 'D',
    color: '#2288cc',
    desc: 'Survivability',
    levels: [
      { name: 'Snorkel', cost: 100, perk: '+1 Starting Life', stat: 'lives', value: 1 },
      { name: 'Scuba', cost: 300, perk: 'Shield on Spawn', stat: 'startShield', value: 1 },
      { name: 'Free Dive', cost: 600, perk: 'Invincibility +0.5s', stat: 'invincTime', value: 0.5 },
      { name: 'Saturation', cost: 1200, perk: '+1 Life, Dodge +5%', stat: 'livesDodge', value: 1 },
      { name: 'Mariana', cost: 2500, perk: '+2 Lives, Shield x2', stat: 'allSurvival', value: 2 },
    ],
  },
  {
    id: 'photography',
    name: 'SHARP EYE',
    icon: 'P',
    color: '#ff8844',
    desc: 'Coins & scoring',
    levels: [
      { name: 'Point & Shoot', cost: 100, perk: 'Coins +10%', stat: 'coins', value: 0.10 },
      { name: 'DSLR', cost: 250, perk: 'Score +10%', stat: 'score', value: 0.10 },
      { name: 'Mirrorless', cost: 500, perk: 'Coins +20%', stat: 'coins', value: 0.20 },
      { name: 'Medium Format', cost: 1000, perk: 'Score +20%', stat: 'score', value: 0.20 },
      { name: 'Hasselblad', cost: 2000, perk: 'Coins x2 Score +25%', stat: 'allMoney', value: 1.0 },
    ],
  },
  {
    id: 'music',
    name: 'RAVE ENERGY',
    icon: 'R',
    color: '#e94560',
    desc: 'Power-ups & allies',
    levels: [
      { name: 'Pre-game', cost: 150, perk: 'Power-Up Duration +10%', stat: 'powerDur', value: 0.10 },
      { name: 'Warm Up', cost: 350, perk: 'Power-Up Drop Rate +5%', stat: 'powerDrop', value: 0.05 },
      { name: 'Main Stage', cost: 700, perk: 'Start with 1 Companion', stat: 'startAlly', value: 1 },
      { name: 'Peak Hour', cost: 1500, perk: 'Power-Up Duration +25%', stat: 'powerDur', value: 0.25 },
      { name: 'After Party', cost: 3000, perk: '+2 Companions, Duration +50%', stat: 'allPower', value: 2 },
    ],
  },
] as const;

// --- Persistence ---

export function loadSkillLevels(): SkillLevels {
  try {
    const data = localStorage.getItem('sofia_cantina_skills');
    if (data) return JSON.parse(data) as SkillLevels;
  } catch (_) {}
  const levels: Record<string, number> = {};
  for (const branch of SKILL_BRANCHES) {
    levels[branch.id] = 0;
  }
  return levels as SkillLevels;
}

export function saveSkillLevels(levels: SkillLevels): void {
  try {
    localStorage.setItem('sofia_cantina_skills', JSON.stringify(levels));
  } catch (_) {}
}

export function upgradeSkill(branchId: BranchId, wallet: Wallet): UpgradeResult {
  const levels = loadSkillLevels();
  const branch = SKILL_BRANCHES.find((b) => b.id === branchId);
  if (!branch) return { success: false, wallet };

  const currentLevel = levels[branchId] || 0;
  if (currentLevel >= branch.levels.length) return { success: false, wallet };

  const next = branch.levels[currentLevel]!;
  if (wallet.coins < next.cost) return { success: false, wallet };

  const newWallet: Wallet = { ...wallet, coins: wallet.coins - next.cost };
  levels[branchId] = currentLevel + 1;

  saveSkillLevels(levels);

  return { success: true, wallet: newWallet, newLevel: currentLevel + 1 };
}

// --- Compute cumulative bonuses from all skill levels ---

export function getSkillBonuses(): SkillBonuses {
  const levels = loadSkillLevels();
  const bonuses: SkillBonuses = {
    fireRateMul: 1,
    bulletSpeedMul: 1,
    maxBulletBonus: 0,
    speedMul: 1,
    dodgeChance: 0,
    extraLives: 0,
    startShield: 0,
    invincTimeBonus: 0,
    coinMul: 1,
    scoreMul: 1,
    powerupDurationMul: 1,
    powerupDropBonus: 0,
    startCompanions: 0,
  };

  for (const branch of SKILL_BRANCHES) {
    const level = levels[branch.id] || 0;
    for (let i = 0; i < level; i++) {
      const skill = branch.levels[i]!;
      switch (skill.stat) {
        case 'fireRate':
          bonuses.fireRateMul *= (1 + skill.value);
          break;
        case 'bulletSpeed':
          bonuses.bulletSpeedMul *= (1 + skill.value);
          break;
        case 'maxBullets':
          bonuses.maxBulletBonus += skill.value;
          break;
        case 'allFire':
          bonuses.fireRateMul *= (1 + skill.value);
          bonuses.bulletSpeedMul *= (1 + skill.value);
          bonuses.maxBulletBonus += 1;
          break;
        case 'speed':
          bonuses.speedMul *= (1 + skill.value);
          break;
        case 'dodge':
          bonuses.dodgeChance += skill.value;
          break;
        case 'allSpeed':
          bonuses.speedMul *= (1 + skill.value);
          bonuses.dodgeChance += skill.value;
          break;
        case 'lives':
          bonuses.extraLives += skill.value;
          break;
        case 'startShield':
          bonuses.startShield += skill.value;
          break;
        case 'invincTime':
          bonuses.invincTimeBonus += skill.value;
          break;
        case 'livesDodge':
          bonuses.extraLives += skill.value;
          bonuses.dodgeChance += 0.05;
          break;
        case 'allSurvival':
          bonuses.extraLives += skill.value;
          bonuses.startShield += 2;
          bonuses.dodgeChance += 0.1;
          break;
        case 'coins':
          bonuses.coinMul *= (1 + skill.value);
          break;
        case 'score':
          bonuses.scoreMul *= (1 + skill.value);
          break;
        case 'allMoney':
          bonuses.coinMul *= 2;
          bonuses.scoreMul *= 1.25;
          break;
        case 'powerDur':
          bonuses.powerupDurationMul *= (1 + skill.value);
          break;
        case 'powerDrop':
          bonuses.powerupDropBonus += skill.value;
          break;
        case 'startAlly':
          bonuses.startCompanions += skill.value;
          break;
        case 'allPower':
          bonuses.startCompanions += skill.value;
          bonuses.powerupDurationMul *= 1.5;
          break;
      }
    }
  }

  return bonuses;
}

// --- Skill Tree UI ---

export function createSkillTreeState(): SkillTreeState {
  return {
    selectedBranch: 0,
    levels: loadSkillLevels(),
    flashMessage: '',
    flashTimer: 0,
  };
}

export function renderSkillTree(ctx: CanvasRenderingContext2D, skillState: SkillTreeState, wallet: Wallet, time: number): void {
  const cx = CANVAS_WIDTH / 2;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SKILL TREE', cx, 30);

  // Coins
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${wallet.coins} COINS`, cx, 50);

  // Branches
  const startY = 70;
  const branchH = 100;

  for (let bi = 0; bi < SKILL_BRANCHES.length; bi++) {
    const branch = SKILL_BRANCHES[bi]!;
    const by = startY + bi * branchH;
    const isSelected = bi === skillState.selectedBranch;
    const level = skillState.levels[branch.id] || 0;

    // Branch background
    ctx.fillStyle = isSelected ? 'rgba(255,204,0,0.08)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(8, by, CANVAS_WIDTH - 16, branchH - 6);

    if (isSelected) {
      ctx.strokeStyle = branch.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(8, by, CANVAS_WIDTH - 16, branchH - 6);
    }

    // Branch icon
    ctx.fillStyle = branch.color;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(branch.icon, 28, by + 24);

    // Branch name
    ctx.textAlign = 'left';
    ctx.fillStyle = branch.color;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(branch.name, 48, by + 16);

    // Branch description
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText(branch.desc, 48, by + 28);

    // Level nodes
    const nodeY = by + 50;
    const nodeSpacing = (CANVAS_WIDTH - 60) / branch.levels.length;

    for (let li = 0; li < branch.levels.length; li++) {
      const lx = 30 + li * nodeSpacing + nodeSpacing / 2;
      const unlocked = li < level;
      const isNext = li === level;

      // Connection line
      if (li > 0) {
        ctx.strokeStyle = unlocked ? branch.color : '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx - nodeSpacing + 8, nodeY);
        ctx.lineTo(lx - 8, nodeY);
        ctx.stroke();
      }

      // Node circle
      if (unlocked) {
        ctx.fillStyle = branch.color;
        const pulse = 0.8 + 0.2 * Math.sin(time * 3 + li);
        ctx.globalAlpha = pulse;
      } else if (isNext) {
        ctx.fillStyle = '#444';
        const pulse = 0.5 + 0.3 * Math.sin(time * 4);
        ctx.globalAlpha = pulse;
      } else {
        ctx.fillStyle = '#222';
        ctx.globalAlpha = 0.5;
      }
      ctx.beginPath();
      ctx.arc(lx, nodeY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Level number
      ctx.fillStyle = unlocked ? '#000' : '#555';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${li + 1}`, lx, nodeY + 3);

      // Name under node
      ctx.fillStyle = unlocked ? '#aaa' : '#444';
      ctx.font = '6px monospace';
      ctx.fillText(branch.levels[li]!.name, lx, nodeY + 18);
    }

    // Next upgrade info
    if (level < branch.levels.length) {
      const next = branch.levels[level]!;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#44ffaa';
      ctx.font = '8px monospace';
      ctx.fillText(`NEXT: ${next.perk}`, CANVAS_WIDTH - 16, by + 16);
      ctx.fillStyle = wallet.coins >= next.cost ? '#ffcc00' : '#ff4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${next.cost}`, CANVAS_WIDTH - 16, by + 30);
    } else {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('MAXED', CANVAS_WIDTH - 16, by + 20);
    }

    // Upgrade button for selected
    if (isSelected && level < branch.levels.length) {
      const next = branch.levels[level]!;
      const canAfford = wallet.coins >= next.cost;
      ctx.textAlign = 'center';
      ctx.fillStyle = canAfford ? '#ffcc00' : '#ff4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(canAfford ? '[ UPGRADE ]' : 'NEED MORE COINS', cx, by + branchH - 14);
    }

    ctx.textAlign = 'left';
  }

  // Flash message
  if (skillState.flashTimer > 0) {
    const alpha = Math.min(1, skillState.flashTimer / 0.3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(skillState.flashMessage, cx, CANVAS_HEIGHT - 40);
    ctx.restore();
  }

  // Back button
  ctx.fillStyle = '#aaaaaa';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('< BACK', cx, CANVAS_HEIGHT - 10);
  ctx.textAlign = 'left';
}
