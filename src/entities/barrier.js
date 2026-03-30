import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BARRIER_COUNT,
  BARRIER_BLOCK_SIZE,
  BARRIER_Y,
} from '../constants.js';
import { drawTulipBlock, drawLilyBlock } from '../sprites.js';
import { spawnBarrierCrumble } from '../effects/particles.js';

// Arch shape template (1 = block, 0 = empty)
const ARCH_TEMPLATE = [
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
];

const ARCH_ROWS = ARCH_TEMPLATE.length;
const ARCH_COLS = ARCH_TEMPLATE[0].length;

export function createBarriers() {
  const barriers = [];
  const totalWidth = CANVAS_WIDTH - 40;
  const spacing = totalWidth / BARRIER_COUNT;

  // Inverted U shape — outer barriers higher, inner barriers lower
  const yOffsets = [-30, 0, 0, -30]; // for 4 barriers

  for (let i = 0; i < BARRIER_COUNT; i++) {
    const centerX = 20 + spacing * i + spacing / 2;
    const yOff = yOffsets[i] || 0;
    const barrierBlocks = [];

    for (let row = 0; row < ARCH_ROWS; row++) {
      for (let col = 0; col < ARCH_COLS; col++) {
        if (ARCH_TEMPLATE[row][col] === 0) continue;

        const isLily = Math.random() < 0.3;
        barrierBlocks.push({
          x: centerX + (col - ARCH_COLS / 2) * BARRIER_BLOCK_SIZE,
          y: BARRIER_Y + row * BARRIER_BLOCK_SIZE + yOff,
          hp: isLily ? 2 : 1,
          maxHp: isLily ? 2 : 1,
          type: isLily ? 'lily' : 'tulip',
          alive: true,
        });
      }
    }

    barriers.push({
      blocks: barrierBlocks,
      centerX,
      yOffset: yOff,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  return barriers;
}

export function updateBarriers(barriers, bullets, playerX, dt) {
  // Gentle bob animation only — no following player
  if (dt !== undefined) {
    for (let i = 0; i < barriers.length; i++) {
      const group = barriers[i];
      group.bobPhase += dt * 0.8;
      const bobY = Math.sin(group.bobPhase) * 3;

      let blockIdx = 0;
      for (let row = 0; row < ARCH_ROWS; row++) {
        for (let col = 0; col < ARCH_COLS; col++) {
          if (ARCH_TEMPLATE[row][col] === 0) continue;
          if (blockIdx < group.blocks.length) {
            group.blocks[blockIdx].x = group.centerX + (col - ARCH_COLS / 2) * BARRIER_BLOCK_SIZE;
            group.blocks[blockIdx].y = BARRIER_Y + row * BARRIER_BLOCK_SIZE + (group.yOffset || 0) + bobY;
            blockIdx++;
          }
        }
      }
    }
  }
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    let hit = false;

    for (const group of barriers) {
      if (hit) break;
      for (const block of group.blocks) {
        if (!block.alive) continue;

        const bx = block.x;
        const by = block.y;
        const bs = BARRIER_BLOCK_SIZE;

        if (
          b.x >= bx &&
          b.x <= bx + bs &&
          b.y >= by &&
          b.y <= by + bs
        ) {
          block.hp -= 1;
          if (block.hp <= 0) {
            block.alive = false;
            spawnBarrierCrumble(bx + bs / 2, by + bs / 2, block.type);
          }
          bullets.splice(bi, 1);
          hit = true;
          break;
        }
      }
    }
  }
}

export function renderBarriers(ctx, barriers) {
  for (const group of barriers) {
    for (const block of group.blocks) {
      if (!block.alive) continue;

      if (block.type === 'tulip') {
        drawTulipBlock(ctx, block.x, block.y, block.hp);
      } else {
        drawLilyBlock(ctx, block.x, block.y, block.hp);
      }
    }
  }
}
