interface KillStats {
  readonly smiski: number;
  readonly jellycat: number;
  readonly tie: number;
  readonly boss: number;
  readonly ufo: number;
}

export interface GameStats {
  readonly shotsFired: number;
  readonly shotsHit: number;
  readonly kills: KillStats;
  readonly timeSurvived: number;
  readonly powerupsCollected: number;
  readonly maxCombo: number;
}

interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly check: ((stats: GameStats, wave: number) => boolean) | null;
}

export interface AchievementDisplay {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  readonly check: ((stats: GameStats, wave: number) => boolean) | null;
  readonly unlocked: boolean;
}

interface AchievementPopup {
  name: string;
  desc: string;
  timer: number;
}

type UnlockedMap = Record<string, boolean>;

let checkCooldown = 0;

const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first_blood', name: 'FIRST BLOOD', desc: 'Kill your first enemy', check: (s) => totalKills(s) >= 1 },
  { id: 'wave_5', name: 'WARMING UP', desc: 'Reach wave 5', check: (_s, w) => w >= 5 },
  { id: 'wave_10', name: 'VETERAN', desc: 'Reach wave 10', check: (_s, w) => w >= 10 },
  { id: 'wave_20', name: 'LEGEND', desc: 'Reach wave 20', check: (_s, w) => w >= 20 },
  { id: 'perfect_wave', name: 'PERFECT WAVE', desc: 'Clear a wave without taking damage', check: null }, // special
  { id: 'tequila_1', name: 'CHEERS!', desc: 'Shoot down a tequila UFO', check: (s) => s.kills.ufo >= 1 },
  { id: 'tequila_5', name: 'TEQUILA HUNTER', desc: 'Shoot down 5 tequila UFOs', check: (s) => s.kills.ufo >= 5 },
  { id: 'boss_1', name: 'BOSS SLAYER', desc: 'Defeat a boss', check: (s) => s.kills.boss >= 1 },
  { id: 'accuracy_80', name: 'SHARPSHOOTER', desc: 'Finish with 80%+ accuracy', check: (s) => s.shotsFired > 10 && (s.shotsHit / s.shotsFired) >= 0.8 },
  { id: 'kills_100', name: 'CENTURION', desc: 'Kill 100 enemies in one game', check: (s) => totalKills(s) >= 100 },
  { id: 'score_10k', name: 'HIGH ROLLER', desc: 'Score 10,000 points', check: null }, // checked via score
  { id: 'powerup_5', name: 'POWERED UP', desc: 'Collect 5 power-ups in one game', check: (s) => s.powerupsCollected >= 5 },
] as const;

function totalKills(s: GameStats): number {
  return s.kills.smiski + s.kills.jellycat + s.kills.tie + s.kills.boss + s.kills.ufo;
}

// Popup queue
const popups: AchievementPopup[] = [];

export function checkAchievements(stats: GameStats, wave: number, score: number, dt: number): void {
  // Only check once per second, not every frame
  checkCooldown -= dt;
  if (checkCooldown > 0) return;
  checkCooldown = 1.0;

  const unlocked = loadUnlocked();
  const newlyUnlocked: Achievement[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked[ach.id]) continue;
    if (ach.id === 'score_10k' && score >= 10000) {
      unlocked[ach.id] = true;
      newlyUnlocked.push(ach);
    } else if (ach.check && ach.check(stats, wave)) {
      unlocked[ach.id] = true;
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlocked(unlocked);
    for (const ach of newlyUnlocked) {
      popups.push({ name: ach.name, desc: ach.desc, timer: 3.0 });
    }
  }
}

export function unlockPerfectWave(): void {
  const unlocked = loadUnlocked();
  if (!unlocked.perfect_wave) {
    unlocked.perfect_wave = true;
    saveUnlocked(unlocked);
    const ach = ACHIEVEMENTS.find((a) => a.id === 'perfect_wave');
    if (ach) {
      popups.push({ name: ach.name, desc: ach.desc, timer: 3.0 });
    }
  }
}

export function updateAchievementPopups(dt: number): void {
  for (let i = popups.length - 1; i >= 0; i--) {
    const popup = popups[i];
    if (!popup) continue;
    popup.timer -= dt;
    if (popup.timer <= 0) {
      popups.splice(i, 1);
    }
  }
}

export function renderAchievementPopups(ctx: CanvasRenderingContext2D, canvasW: number): void {
  for (let i = 0; i < popups.length; i++) {
    const p = popups[i];
    if (!p) continue;
    const fadeAlpha = p.timer < 0.5 ? p.timer / 0.5 : 1;

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    const boxW = 180;
    const boxH = 30;
    const boxX = (canvasW - boxW) / 2;
    const boxY = 40 + i * 36;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Star icon
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('\u2605', boxX + 10, boxY + 14);

    // Name
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(p.name, boxX + 24, boxY + 12);

    // Description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText(p.desc, boxX + 24, boxY + 23);

    ctx.restore();
  }
}

export function getUnlockedList(): AchievementDisplay[] {
  const unlocked = loadUnlocked();
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: !!unlocked[a.id],
  }));
}

function loadUnlocked(): UnlockedMap {
  try {
    const data = localStorage.getItem('sofia_cantina_achievements');
    if (data) return JSON.parse(data) as UnlockedMap;
  } catch (_) {}
  return {};
}

function saveUnlocked(unlocked: UnlockedMap): void {
  try {
    localStorage.setItem('sofia_cantina_achievements', JSON.stringify(unlocked));
  } catch (_) {}
}
