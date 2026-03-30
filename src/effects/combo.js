import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants.js';

const COMBO_WINDOW = 0.8;
const COMBO_LABELS = ['', '', 'DOUBLE!', 'TRIPLE!', 'QUAD!', 'PENTA!', 'MEGA!', 'ULTRA!', 'INSANE!'];

const STREAK_MILESTONES = [
  { kills: 10, text: 'KILLING SPREE!', color: '#ff8844' },
  { kills: 20, text: 'UNSTOPPABLE!', color: '#ff4488' },
  { kills: 35, text: 'RAMPAGE!', color: '#ff2222' },
  { kills: 50, text: 'GODLIKE!', color: '#ffcc00' },
  { kills: 75, text: 'LEGENDARY!', color: '#ff44ff' },
  { kills: 100, text: 'BEYOND GODLIKE!', color: '#44ffff' },
];

let comboCount = 0;
let comboTimer = 0;
let streakKills = 0;
let lastStreakMilestone = 0;

const popups = [];

// Big center-screen streak announcement
let streakAnnouncement = null;

export function registerKill(x, y) {
  comboTimer = COMBO_WINDOW;
  comboCount += 1;
  streakKills += 1;

  if (comboCount >= 2) {
    const label = comboCount < COMBO_LABELS.length
      ? COMBO_LABELS[comboCount]
      : `${comboCount}x COMBO!`;

    popups.push({
      x,
      y: y - 10,
      text: label,
      timer: 1.0,
      lifetime: 1.0,
    });
  }

  // Check streak milestones
  for (const m of STREAK_MILESTONES) {
    if (streakKills >= m.kills && lastStreakMilestone < m.kills) {
      lastStreakMilestone = m.kills;
      streakAnnouncement = { text: m.text, color: m.color, timer: 2.0 };
    }
  }
}

export function resetStreak() {
  streakKills = 0;
  lastStreakMilestone = 0;
}

export function getComboCount() {
  return comboCount;
}

export function getComboMultiplier() {
  return comboCount >= 2 ? 1 + (comboCount - 1) * 0.1 : 1;
}

export function updateCombo(dt) {
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      comboCount = 0;
    }
  }

  for (let i = popups.length - 1; i >= 0; i--) {
    popups[i].timer -= dt;
    popups[i].y -= 30 * dt;
    if (popups[i].timer <= 0) {
      popups.splice(i, 1);
    }
  }

  if (streakAnnouncement) {
    streakAnnouncement.timer -= dt;
    if (streakAnnouncement.timer <= 0) {
      streakAnnouncement = null;
    }
  }
}

export function renderCombo(ctx) {
  for (const p of popups) {
    const alpha = Math.min(1, p.timer / 0.3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff44ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

export function renderStreakAnnouncement(ctx) {
  if (!streakAnnouncement) return;

  const a = streakAnnouncement;
  const fadeIn = a.timer > 1.7 ? (2.0 - a.timer) / 0.3 : 1;
  const fadeOut = a.timer < 0.5 ? a.timer / 0.5 : 1;
  const alpha = Math.min(fadeIn, fadeOut);
  const scale = a.timer > 1.7 ? 1 + (2.0 - a.timer) * 2 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';

  // Flash background
  ctx.fillStyle = a.color;
  ctx.globalAlpha = alpha * 0.08;
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH, 60);

  // Text shadow
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.floor(20 * scale)}px monospace`;
  ctx.fillText(a.text, CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 + 2);

  // Text
  ctx.globalAlpha = alpha;
  ctx.fillStyle = a.color;
  ctx.fillText(a.text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  // Kill count
  ctx.font = '10px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${streakKills} KILLS`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 18);

  ctx.textAlign = 'left';
  ctx.restore();
}

export function resetCombo() {
  comboCount = 0;
  comboTimer = 0;
  popups.length = 0;
}
