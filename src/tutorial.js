import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';
import { drawCatShip, drawSmiski, drawJellycat, drawTieFighter, drawBreadBullet } from './sprites.js';

const PAGES = [
  {
    title: 'MOVE & SHOOT',
    draw: (ctx, time) => {
      const fingerX = CANVAS_WIDTH / 2 + Math.sin(time * 2) * 80;
      const fingerY = CANVAS_HEIGHT * 0.82 + Math.cos(time * 1.5) * 20;
      drawCatShip(ctx, fingerX, fingerY);

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(fingerX, fingerY + 40, 12, 0, Math.PI * 2);
      ctx.fill();

      // Bullets
      const by = fingerY - 30 - ((time * 100) % 80);
      drawBreadBullet(ctx, fingerX, by);

      // Movement zone indicator
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT * 0.75);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT * 0.75);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Touch & drag anywhere', CANVAS_WIDTH / 2, 255);
      ctx.fillText('Cat follows your finger in 2D', CANVAS_WIDTH / 2, 272);
      ctx.fillText('Auto-fires while touching!', CANVAS_WIDTH / 2, 289);
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('Movement zone: bottom quarter', CANVAS_WIDTH / 2, 310);
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'ENEMIES',
    draw: (ctx, time) => {
      const frame = Math.floor(time * 2) % 2;

      // Enemies moving in patterns
      drawTieFighter(ctx, CANVAS_WIDTH / 2 + Math.sin(time) * 30, 270, frame);
      drawJellycat(ctx, CANVAS_WIDTH / 2 - 50 + Math.cos(time * 1.3) * 20, 300, frame);
      drawSmiski(ctx, CANVAS_WIDTH / 2 + 40 + Math.sin(time * 0.8) * 25, 330, frame);

      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Enemies move in fluid patterns', CANVAS_WIDTH / 2, 255);
      ctx.fillText('Each wave has unique formations', CANVAS_WIDTH / 2, 370);

      ctx.fillStyle = '#888';
      ctx.font = '9px monospace';
      ctx.fillText('Special types after wave 5:', CANVAS_WIDTH / 2, 395);
      ctx.fillStyle = '#4488ff';
      ctx.fillText('SHIELDED  HEALER  SPLITTER  TELEPORTER', CANVAS_WIDTH / 2, 410);
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'WEAPONS',
    draw: (ctx, time) => {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('Double-tap to swap weapons!', CANVAS_WIDTH / 2, 260);

      const weapons = [
        { name: 'STANDARD', desc: 'Single shot', color: '#fff' },
        { name: 'SHOTGUN', desc: '5-shot spread', color: '#ff8844' },
        { name: 'SNIPER', desc: 'Piercing shots', color: '#44ccff' },
        { name: 'MINIGUN', desc: 'Rapid tiny shots', color: '#44ff44' },
      ];

      for (let i = 0; i < weapons.length; i++) {
        const y = 290 + i * 30;
        ctx.fillStyle = weapons[i].color;
        ctx.font = 'bold 10px monospace';
        ctx.fillText(weapons[i].name, CANVAS_WIDTH / 2 - 30, y);
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText(weapons[i].desc, CANVAS_WIDTH / 2 + 60, y);
      }
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'POWER-UPS',
    draw: (ctx, time) => {
      const items = [
        { letter: 'S', color: '#ff8844', label: 'SPREAD — Multi-shot' },
        { letter: 'R', color: '#44ccff', label: 'RAPID — Faster fire' },
        { letter: 'H', color: '#44ff44', label: 'SHIELD — Block hits' },
        { letter: 'B', color: '#ff4444', label: 'BOMB — Clear screen' },
        { letter: 'W', color: '#ffff44', label: 'RICOCHET — Bounce off walls' },
        { letter: 'C', color: '#ff88ff', label: 'COMPANION — Cat ally' },
      ];

      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('Dropped by enemies — they STACK!', CANVAS_WIDTH / 2, 255);

      for (let i = 0; i < items.length; i++) {
        const y = 280 + i * 26;
        ctx.fillStyle = '#111';
        ctx.fillRect(CANVAS_WIDTH / 2 - 90, y - 9, 16, 16);
        ctx.strokeStyle = items[i].color;
        ctx.lineWidth = 1;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 90, y - 9, 16, 16);
        ctx.fillStyle = items[i].color;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(items[i].letter, CANVAS_WIDTH / 2 - 82, y + 3);
        ctx.fillStyle = '#ccc';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(items[i].label, CANVAS_WIDTH / 2 - 65, y + 3);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('Stack same type for OP combos!', CANVAS_WIDTH / 2, 445);
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'AUTO ABILITIES',
    draw: (ctx, time) => {
      ctx.textAlign = 'center';

      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('TEQUILA BOMB', CANVAS_WIDTH / 2, 270);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('Kill 5 enemies rapidly (5x combo)', CANVAS_WIDTH / 2, 290);
      ctx.fillText('= NUKE all enemies on screen!', CANVAS_WIDTH / 2, 306);

      ctx.fillStyle = '#333';
      ctx.fillRect(CANVAS_WIDTH / 2 - 60, 320, 120, 1);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('PHOTO FLASH', CANVAS_WIDTH / 2, 340);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('When a bullet nearly hits you', CANVAS_WIDTH / 2, 360);
      ctx.fillText('= FREEZE all enemies briefly!', CANVAS_WIDTH / 2, 376);

      ctx.fillStyle = '#44ffaa';
      ctx.font = '9px monospace';
      ctx.fillText('Both are fully automatic', CANVAS_WIDTH / 2, 410);
      ctx.fillText('Just play and they trigger!', CANVAS_WIDTH / 2, 426);
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'WAVE MODIFIERS',
    draw: (ctx, time) => {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('Each wave gets a random modifier!', CANVAS_WIDTH / 2, 260);

      const mods = [
        { name: 'HYPERSPEED', color: '#ff4444', desc: '2x enemy speed' },
        { name: 'GOLD RUSH', color: '#ffcc00', desc: '5x coins' },
        { name: 'BULLET HELL', color: '#ff2222', desc: '3x enemy fire rate' },
        { name: 'POWER RAIN', color: '#44ffaa', desc: 'Every kill = powerup' },
        { name: 'JACKPOT', color: '#ffdd00', desc: '10x coins + 2x speed' },
        { name: 'GLASS CANNON', color: '#ff44ff', desc: '3x damage, 1-hit death' },
      ];

      for (let i = 0; i < mods.length; i++) {
        const y = 285 + i * 24;
        const pulse = 0.6 + 0.4 * Math.sin(time * 3 + i);
        ctx.fillStyle = mods[i].color;
        ctx.globalAlpha = pulse;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(mods[i].name, CANVAS_WIDTH / 2 - 40, y);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#888';
        ctx.font = '8px monospace';
        ctx.fillText(mods[i].desc, CANVAS_WIDTH / 2 + 55, y);
      }

      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('+ 9 more modifiers!', CANVAS_WIDTH / 2, 440);
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'BOSSES & HAZARDS',
    draw: (ctx, time) => {
      ctx.textAlign = 'center';

      ctx.fillStyle = '#ff6644';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('BOSS EVERY 5 WAVES', CANVAS_WIDTH / 2, 265);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('HP bar + attack patterns', CANVAS_WIDTH / 2, 283);
      ctx.fillText('3 boss types that cycle', CANVAS_WIDTH / 2, 298);

      ctx.fillStyle = '#333';
      ctx.fillRect(CANVAS_WIDTH / 2 - 60, 312, 120, 1);

      ctx.fillStyle = '#ff8844';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('ENVIRONMENTAL HAZARDS', CANVAS_WIDTH / 2, 332);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('Asteroids drift across', CANVAS_WIDTH / 2, 352);
      ctx.fillText('Laser beams sweep (WARNING!)', CANVAS_WIDTH / 2, 368);
      ctx.fillText('Black holes pull your bullets', CANVAS_WIDTH / 2, 384);

      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('Hazards appear from wave 4+', CANVAS_WIDTH / 2, 410);
      ctx.textAlign = 'left';
    },
  },
  {
    title: 'SHOP & SKILLS',
    draw: (ctx, time) => {
      ctx.textAlign = 'center';

      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('EARN COINS BY PLAYING', CANVAS_WIDTH / 2, 260);
      ctx.fillStyle = '#aaa';
      ctx.font = '10px monospace';
      ctx.fillText('Kills + combos + waves = coins', CANVAS_WIDTH / 2, 280);

      ctx.fillStyle = '#333';
      ctx.fillRect(CANVAS_WIDTH / 2 - 60, 295, 120, 1);

      ctx.fillStyle = '#44ffaa';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SHOP — 4 categories', CANVAS_WIDTH / 2, 315);
      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText('Cat skins, bullets, trails, barriers', CANVAS_WIDTH / 2, 332);
      ctx.fillText('Every item has gameplay perks!', CANVAS_WIDTH / 2, 348);
      ctx.fillText('From +10% speed to 3x coins', CANVAS_WIDTH / 2, 364);

      ctx.fillStyle = '#333';
      ctx.fillRect(CANVAS_WIDTH / 2 - 60, 378, 120, 1);

      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SKILL TREE — 5 branches', CANVAS_WIDTH / 2, 398);
      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText('Tequila / Skiing / Diving', CANVAS_WIDTH / 2, 414);
      ctx.fillText('Photography / Rave Energy', CANVAS_WIDTH / 2, 430);
      ctx.fillText('Permanent upgrades between runs!', CANVAS_WIDTH / 2, 446);

      ctx.textAlign = 'left';
    },
  },
];

export function createTutorialState() {
  return {
    page: 0,
  };
}

export function renderTutorial(ctx, tutorial, time) {
  const cx = CANVAS_WIDTH / 2;
  const page = PAGES[tutorial.page];

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', cx, 28);

  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText(`${tutorial.page + 1} / ${PAGES.length}`, cx, 46);

  for (let i = 0; i < PAGES.length; i++) {
    ctx.fillStyle = i === tutorial.page ? '#ffcc00' : '#333';
    ctx.beginPath();
    ctx.arc(cx - (PAGES.length * 6) + i * 12 + 6, 56, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(page.title, cx, 230);

  ctx.fillStyle = 'rgba(255,204,0,0.3)';
  ctx.fillRect(cx - 80, 236, 160, 1);

  page.draw(ctx, time);

  if (tutorial.page > 0) {
    ctx.fillStyle = '#888';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('\u25C0 PREV', 60, CANVAS_HEIGHT - 14);
  }
  if (tutorial.page < PAGES.length - 1) {
    ctx.fillStyle = '#888';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('NEXT \u25B6', CANVAS_WIDTH - 60, CANVAS_HEIGHT - 14);
  } else {
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('GOT IT!', CANVAS_WIDTH - 55, CANVAS_HEIGHT - 14);
  }

  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('< BACK', cx, CANVAS_HEIGHT - 14);

  ctx.textAlign = 'left';
}

export function getTutorialPageCount() {
  return PAGES.length;
}
