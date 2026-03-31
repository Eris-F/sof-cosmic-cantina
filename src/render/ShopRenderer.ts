import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { getGameHeight } from '../core/Layout';
import { CATEGORIES, SHOP_ITEMS, isOwned } from '../shop';
import { drawCatShip } from '../sprites';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RarityInfo {
  readonly name: string;
  readonly color: string;
  readonly bgAlpha: number;
  readonly border: string | null;
}

interface ShopItem {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly price: number;
  readonly perk?: string;
  readonly glow?: string;
  readonly color?: string;
  readonly trail?: string;
  readonly color1?: string;
  readonly color2?: string;
  readonly rainbow?: boolean;
  readonly body?: string;
  readonly stripe?: string;
  readonly ear?: string;
  [key: string]: unknown;
}

interface ShopCategory {
  readonly id: string;
  readonly name: string;
}

interface ShopUIState {
  readonly categoryIndex: number;
  readonly itemIndex: number;
  readonly scrollOffset: number;
  readonly flashMessage: string;
  readonly flashTimer: number;
}

interface WalletState {
  readonly coins: number;
}

interface OwnedItems {
  readonly [category: string]: readonly string[];
}

interface EquippedItems {
  readonly [category: string]: string;
}

export interface ShopRenderState {
  readonly shop: ShopUIState;
  readonly wallet: WalletState;
  readonly owned: OwnedItems;
  readonly equipped: EquippedItems;
}

/**
 * Rarity tiers based on price — pure lookup, no side effects.
 */
function getRarity(price: number): RarityInfo {
  if (price === 0) return { name: 'BASIC', color: '#888888', bgAlpha: 0.03, border: null };
  if (price <= 300) return { name: 'COMMON', color: '#44cc44', bgAlpha: 0.05, border: '#44cc44' };
  if (price <= 600) return { name: 'RARE', color: '#4488ff', bgAlpha: 0.06, border: '#4488ff' };
  if (price <= 1000) return { name: 'EPIC', color: '#aa44ff', bgAlpha: 0.08, border: '#aa44ff' };
  if (price <= 2000) return { name: 'LEGENDARY', color: '#ff8800', bgAlpha: 0.1, border: '#ff8800' };
  return { name: 'MYTHIC', color: '#ff44aa', bgAlpha: 0.12, border: '#ff44aa' };
}

/**
 * Renders the shop screen. Pure read-only — draws pixels, returns nothing.
 */
export function renderShop(
  ctx: CanvasRenderingContext2D,
  state: ShopRenderState,
  gameTime: number,
): void {
  const cx = CANVAS_WIDTH / 2;
  const shop = state.shop;
  const time = gameTime;

  // Background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CANVAS_WIDTH, getGameHeight());

  // Animated background particles
  for (let i = 0; i < 15; i++) {
    const px = ((time * 8 + i * 137) % CANVAS_WIDTH);
    const py = ((time * 12 + i * 89) % getGameHeight());
    const alpha = 0.05 + 0.03 * Math.sin(time * 2 + i);
    ctx.fillStyle = `rgba(255, 204, 0, ${alpha})`;
    ctx.fillRect(px, py, 2, 2);
  }

  ctx.textAlign = 'center';

  // Title with glow
  const titleGlow = 0.3 + 0.1 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(255, 204, 0, ${titleGlow})`;
  ctx.fillRect(cx - 100, 12, 200, 26);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('COSMIC SHOP', cx, 30);

  // Coin balance with icon
  ctx.fillStyle = '#000';
  ctx.fillRect(cx - 50, 38, 100, 18);
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 50, 38, 100, 18);
  const coinPulse = 0.8 + 0.2 * Math.sin(time * 4);
  ctx.fillStyle = `rgba(255, 204, 0, ${coinPulse})`;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${state.wallet.coins}`, cx, 52);

  // Category tabs with active glow
  const tabY = 62;
  const categories = CATEGORIES as readonly ShopCategory[];
  const tabW = CANVAS_WIDTH / categories.length;
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]!;
    const tx = tabW * i + tabW / 2;
    const isActive = i === shop.categoryIndex;

    if (isActive) {
      const tabGlow = 0.15 + 0.05 * Math.sin(time * 4);
      ctx.fillStyle = `rgba(255, 204, 0, ${tabGlow})`;
      ctx.fillRect(tabW * i, tabY, tabW, 22);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(tabW * i, tabY + 20, tabW, 2);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(tabW * i, tabY, tabW, 22);
    }

    ctx.fillStyle = isActive ? '#ffcc00' : '#555555';
    ctx.font = isActive ? 'bold 11px monospace' : '10px monospace';
    ctx.fillText(cat.name, tx, tabY + 15);
  }

  // Items list
  const category = categories[shop.categoryIndex]!;
  const items = (SHOP_ITEMS as unknown as Record<string, readonly ShopItem[]>)[category.id] ?? [];
  const listY = 92;
  const itemH = 72;
  const visibleItems = 6;

  const scrollOffset = shop.scrollOffset;
  const maxScroll = Math.max(0, items.length - visibleItems);

  for (let vi = 0; vi < visibleItems && vi + scrollOffset < items.length; vi++) {
    const idx = vi + scrollOffset;
    const item = items[idx]!;
    const iy = listY + vi * itemH;
    const isSelected = idx === shop.itemIndex;
    const owned = isOwned(state.owned as unknown as Parameters<typeof isOwned>[0], category.id, item.id);
    const equipped = state.equipped[category.id] === item.id;
    const rarity = getRarity(item.price);

    // Item card background
    ctx.fillStyle = `rgba(255, 255, 255, ${rarity.bgAlpha})`;
    ctx.fillRect(8, iy, CANVAS_WIDTH - 16, itemH - 4);

    // Rarity stripe on left edge
    if (rarity.border) {
      const stripePulse = isSelected ? 0.8 + 0.2 * Math.sin(time * 5) : 0.6;
      ctx.fillStyle = rarity.border;
      ctx.globalAlpha = stripePulse;
      ctx.fillRect(8, iy, 3, itemH - 4);
      ctx.globalAlpha = 1;
    }

    // Selected card — animated border
    if (isSelected) {
      const selPulse = 0.6 + 0.4 * Math.sin(time * 4);
      ctx.strokeStyle = rarity.border || '#ffcc00';
      ctx.globalAlpha = selPulse;
      ctx.lineWidth = 2;
      ctx.strokeRect(8, iy, CANVAS_WIDTH - 16, itemH - 4);
      ctx.globalAlpha = 1;

      // Shimmer effect on selected card
      const shimmerX = ((time * 150) % (CANVAS_WIDTH + 40)) - 20;
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(shimmerX, iy);
      ctx.lineTo(shimmerX + 20, iy);
      ctx.lineTo(shimmerX + 10, iy + itemH - 4);
      ctx.lineTo(shimmerX - 10, iy + itemH - 4);
      ctx.fill();
      ctx.restore();
    }

    // Equipped badge — gold corner
    if (equipped) {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - 8, iy);
      ctx.lineTo(CANVAS_WIDTH - 8, iy + 20);
      ctx.lineTo(CANVAS_WIDTH - 28, iy);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 7px monospace';
      ctx.save();
      ctx.translate(CANVAS_WIDTH - 15, iy + 9);
      ctx.rotate(Math.PI / 4);
      ctx.fillText('E', -2, 2);
      ctx.restore();
    }

    // Preview area with glow background
    const previewX = 42;
    const previewY = iy + itemH / 2 - 4;

    // Preview glow
    if (item.glow || rarity.border) {
      const glowColor = item.glow || rarity.border;
      ctx.save();
      ctx.globalAlpha = 0.15 + (isSelected ? 0.1 * Math.sin(time * 3) : 0);
      ctx.fillStyle = glowColor as string;
      ctx.beginPath();
      ctx.arc(previewX, previewY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (category.id === 'skins') {
      // Rainbow skin special animation
      if (item.rainbow) {
        const hue = (time * 60) % 360;
        const rainbowItem = {
          ...item,
          body: `hsl(${hue}, 80%, 50%)`,
          stripe: `hsl(${(hue + 40) % 360}, 80%, 35%)`,
          ear: `hsl(${(hue + 120) % 360}, 80%, 60%)`,
        };
        drawCatShip(ctx, previewX, previewY, rainbowItem as Parameters<typeof drawCatShip>[3]);
      } else {
        drawCatShip(ctx, previewX, previewY, item as unknown as Parameters<typeof drawCatShip>[3]);
      }
    } else if (category.id === 'bullets') {
      // Animated bullet preview — shooting upward
      const bulletPhase = (time * 3 + idx) % 1;
      const by = previewY + 10 - bulletPhase * 20;
      ctx.fillStyle = item.color || '#fff';
      ctx.fillRect(previewX - 2, by - 4, 4, 8);
      if (item.trail) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = item.trail;
        ctx.fillRect(previewX - 1, by + 2, 2, 6);
        ctx.fillRect(previewX - 1, by + 6, 2, 4);
        ctx.globalAlpha = 1;
      }
      // Second bullet offset
      const by2 = previewY + 10 - ((bulletPhase + 0.5) % 1) * 20;
      ctx.fillStyle = item.color || '#fff';
      ctx.fillRect(previewX - 2, by2 - 3, 4, 6);
    } else if (category.id === 'trails') {
      // Animated trail preview — swirl
      if (item.id === 'none') {
        ctx.fillStyle = '#333';
        ctx.font = '14px monospace';
        ctx.fillText('-', previewX, previewY + 4);
      } else if (item.id === 'rainbow_t') {
        for (let j = 0; j < 8; j++) {
          const angle = time * 3 + j * 0.8;
          const trailX = previewX + Math.cos(angle) * (8 - j);
          const trailY = previewY + Math.sin(angle) * (8 - j);
          const hue = (time * 80 + j * 40) % 360;
          ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
          ctx.globalAlpha = 1 - j * 0.1;
          ctx.fillRect(trailX - 1, trailY - 1, 3, 3);
        }
        ctx.globalAlpha = 1;
      } else {
        for (let j = 0; j < 6; j++) {
          const angle = time * 2 + j * 1.0;
          const trailX = previewX + Math.cos(angle) * (7 - j);
          const trailY = previewY + Math.sin(angle) * (7 - j);
          ctx.fillStyle = item.color || '#fff';
          ctx.globalAlpha = 0.8 - j * 0.12;
          ctx.fillRect(trailX - 1, trailY - 1, 3, 3);
        }
        ctx.globalAlpha = 1;
      }
    } else if (category.id === 'barriers') {
      // Barrier preview — small arch
      if (item.id === 'flowers') {
        // Original tulip/lily colors
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#ee5577' : '#ffffee';
            ctx.fillRect(previewX - 10 + c * 4, previewY - 6 + r * 4, 3, 3);
          }
        }
      } else {
        const pulse = 0.7 + 0.3 * Math.sin(time * 3 + idx);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? (item.color1 || '#888') : (item.color2 || '#ccc');
            ctx.globalAlpha = pulse;
            ctx.fillRect(previewX - 10 + c * 4, previewY - 6 + r * 4, 3, 3);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // Item name with rarity color
    ctx.textAlign = 'left';
    const nameColor = equipped ? '#ffcc00' : owned ? '#ffffff' : rarity.color;
    ctx.fillStyle = nameColor;
    ctx.font = 'bold 11px monospace';
    ctx.fillText(item.name, 68, iy + 14);

    // Rarity tag + perk
    ctx.fillStyle = rarity.color;
    ctx.font = '8px monospace';
    ctx.fillText(rarity.name, 68, iy + 24);

    // Perk (gameplay benefit) — highlighted
    if (item.perk && item.perk !== 'No bonus') {
      ctx.fillStyle = '#44ffaa';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(item.perk, 68, iy + 36);
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '9px monospace';
      ctx.fillText(item.desc, 68, iy + 36);
    }

    // Description line 2
    ctx.fillStyle = '#555555';
    ctx.font = '8px monospace';
    ctx.fillText(item.desc, 68, iy + 48);

    // Price / status on right
    ctx.textAlign = 'right';
    if (equipped) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('EQUIPPED', CANVAS_WIDTH - 16, iy + 18);
      // Checkmark
      ctx.fillStyle = '#ffcc00';
      ctx.font = '16px monospace';
      ctx.fillText('\u2713', CANVAS_WIDTH - 16, iy + 38);
    } else if (owned) {
      ctx.fillStyle = '#44ff44';
      ctx.font = '11px monospace';
      ctx.fillText('OWNED', CANVAS_WIDTH - 16, iy + 18);
    } else {
      // Price with coin icon
      const canAfford = state.wallet.coins >= item.price;
      ctx.fillStyle = canAfford ? '#ffcc00' : '#ff4444';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${item.price}`, CANVAS_WIDTH - 16, iy + 20);
      ctx.fillStyle = canAfford ? '#cc9900' : '#993333';
      ctx.font = '9px monospace';
      ctx.fillText('COINS', CANVAS_WIDTH - 16, iy + 32);

      // Lock icon if can't afford
      if (!canAfford) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '12px monospace';
        ctx.fillText('\u{1F512}', CANVAS_WIDTH - 16, iy + 48);
      }
    }

    // Action button for selected item
    if (isSelected && !equipped) {
      const canAfford = state.wallet.coins >= item.price;
      const btnY = iy + 48;
      const btnText = owned ? '[ EQUIP ]' : canAfford ? `[ BUY ${item.price} ]` : 'NEED MORE COINS';
      const btnColor = owned ? '#44ff44' : canAfford ? '#ffcc00' : '#ff4444';

      // Button background
      if (owned || canAfford) {
        ctx.fillStyle = `rgba(${owned ? '68,255,68' : '255,204,0'}, 0.1)`;
        ctx.fillRect(cx - 60, btnY - 2, 120, 16);
      }

      ctx.fillStyle = btnColor;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btnText, cx, btnY + 10);
    }

    ctx.textAlign = 'center';
  }

  // Scroll indicators
  if (scrollOffset > 0) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = '14px monospace';
    ctx.fillText('\u25B2', cx, listY - 4);
  }
  if (scrollOffset < maxScroll) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = '14px monospace';
    ctx.fillText('\u25BC', cx, listY + visibleItems * itemH + 10);
  }

  // Flash message with glow
  if (shop.flashTimer > 0) {
    const alpha = Math.min(1, shop.flashTimer / 0.3);
    const isSuccess = shop.flashMessage.includes('PURCHASED') || shop.flashMessage.includes('EQUIPPED');

    ctx.save();
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = isSuccess ? '#44ff44' : '#ff4444';
    ctx.fillRect(0, CANVAS_HEIGHT - 55, CANVAS_WIDTH, 24);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = isSuccess ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(shop.flashMessage, cx, CANVAS_HEIGHT - 38);
    ctx.restore();
  }

  // Back button
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(cx - 40, CANVAS_HEIGHT - 24, 80, 20);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 40, CANVAS_HEIGHT - 24, 80, 20);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('< BACK', cx, CANVAS_HEIGHT - 10);

  ctx.textAlign = 'left';
}
