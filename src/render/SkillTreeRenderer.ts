import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { getGameHeight } from '../core/Layout';
import { SKILL_BRANCHES } from '../skilltree';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillLevel {
  readonly name: string;
  readonly perk: string;
  readonly cost: number;
}

interface SkillBranch {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly icon: string;
  readonly color: string;
  readonly levels: readonly SkillLevel[];
}

interface SkillTreeUIState {
  readonly selectedBranch: number;
  readonly levels: Readonly<Record<string, number>>;
  readonly flashMessage: string;
  readonly flashTimer: number;
}

interface WalletState {
  readonly coins: number;
}

export interface SkillTreeRenderState {
  readonly skillTree: SkillTreeUIState;
  readonly wallet: WalletState;
}

/**
 * Renders the skill tree screen. Pure read-only — draws pixels, returns nothing.
 */
export function renderSkillTree(
  ctx: CanvasRenderingContext2D,
  state: SkillTreeRenderState,
  gameTime: number,
): void {
  const cx = CANVAS_WIDTH / 2;
  const skillState = state.skillTree;
  const wallet = state.wallet;
  const time = gameTime;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());

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
  const branches = SKILL_BRANCHES as readonly SkillBranch[];

  for (let bi = 0; bi < branches.length; bi++) {
    const branch = branches[bi]!;
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
