// ============================================
// SHOP SYSTEM — Coins, Items, Buy/Equip
// ============================================

// --- ITEM CATALOG ---

export const CATEGORIES = [
  { id: 'skins', name: 'CATS' },
  { id: 'bullets', name: 'AMMO' },
  { id: 'trails', name: 'TRAILS' },
  { id: 'barriers', name: 'SHIELDS' },
];

export const SHOP_ITEMS = {
  skins: [
    // --- CATS ---
    {
      id: 'default', name: 'ORANGE TABBY', price: 0,
      body: '#ff9933', stripe: '#cc7722', ear: '#ff6688',
      desc: 'The classic cantina cat',
      perk: 'No bonus', stats: {},
    },
    {
      id: 'tuxedo', name: 'TUXEDO', price: 200,
      body: '#333333', stripe: '#111111', ear: '#ff6688', chest: '#ffffff',
      desc: 'Dressed for the photo booth',
      perk: 'SCORE +10%', stats: { scoreMul: 1.1 },
    },
    {
      id: 'calico', name: 'CALICO', price: 350,
      body: '#ffcc88', stripe: '#cc6633', ear: '#ff6688', patches: ['#ffffff', '#333333'],
      desc: 'Patchwork coin magnet',
      perk: 'COINS +15%', stats: { coinMul: 1.15 },
    },
    // --- SMISKI THEMED ---
    {
      id: 'smiski_cat', name: 'SMISKI CAT', price: 500,
      body: '#88cc88', stripe: '#66aa66', ear: '#aaddaa', glow: '#aaffaa',
      desc: 'Glows in the dark like a Smiski',
      perk: 'HITBOX -15%', stats: { hitboxMul: 0.85 },
    },
    // --- JELLYCAT THEMED ---
    {
      id: 'jellycat_cat', name: 'JELLYCAT PLUSH', price: 750,
      body: '#cc88cc', stripe: '#aa66aa', ear: '#ddaadd', glow: '#eeccee',
      desc: 'So soft, enemies feel bad shooting',
      perk: 'DODGE 20%', stats: { dodgeChance: 0.2 },
    },
    // --- SKIING ---
    {
      id: 'ski_cat', name: 'SKI CAT', price: 600,
      body: '#ffffff', stripe: '#ccddee', ear: '#ff4444', chest: '#4488ff',
      desc: 'Fresh off the slopes, lightning fast',
      perk: 'SPEED +30%', stats: { speedMul: 1.3 },
    },
    // --- DIVING ---
    {
      id: 'diver_cat', name: 'DIVER CAT', price: 800,
      body: '#225588', stripe: '#113366', ear: '#44aadd', glow: '#44ccff',
      desc: 'Deep sea pressure = tough skin',
      perk: 'EXTRA LIFE +1', stats: { extraStartLife: 1 },
    },
    // --- PHOTOGRAPHY ---
    {
      id: 'photo_cat', name: 'PHOTOG CAT', price: 1000,
      body: '#444444', stripe: '#222222', ear: '#ff6600', glow: '#ffffff',
      desc: 'Flash blinds enemies on kill',
      perk: 'COINS x2', stats: { coinMul: 2.0 },
    },
    // --- STAR WARS ---
    {
      id: 'jedi_cat', name: 'JEDI CAT', price: 1500,
      body: '#886644', stripe: '#664422', ear: '#aabb88', glow: '#44ff44',
      desc: 'The Force guides your shots',
      perk: 'FIRE +30% DODGE 15%', stats: { fireRateMul: 0.7, dodgeChance: 0.15 },
    },
    {
      id: 'sith_cat', name: 'SITH CAT', price: 2000,
      body: '#220000', stripe: '#110000', ear: '#ff0000', glow: '#ff2200',
      desc: 'Unlimited power!',
      perk: 'FIRE +50% DMG +25%', stats: { fireRateMul: 0.5, scoreMul: 1.25 },
    },
    // --- TEQUILA ---
    {
      id: 'tequila_cat', name: 'TEQUILA CAT', price: 2500,
      body: '#ccaa44', stripe: '#aa8822', ear: '#88aa44', glow: '#eedd44',
      desc: 'One shot, one kill (mostly)',
      perk: 'SHIELD+2 COINS x2.5', stats: { startShield: 2, coinMul: 2.5 },
    },
    // --- FRED AGAIN ---
    {
      id: 'fred_cat', name: 'FRED AGAIN CAT', price: 3000,
      body: '#1a1a2e', stripe: '#0f0f1a', ear: '#e94560', glow: '#e94560',
      desc: 'Turn it up. Again. Again. Again.',
      perk: 'ALLY+2 POWERUP+50%', stats: { startCompanion: 2, powerupDurationMul: 1.5 },
    },
    // --- BOARD GAME ---
    {
      id: 'boardgame_cat', name: 'DICE MASTER', price: 3500,
      body: '#ffffff', stripe: '#000000', ear: '#ff0000',
      patches: ['#000000', '#ff0000'], glow: '#ffcc00',
      desc: 'Rolls natural 20s on every turn',
      perk: 'ALL +20% DODGE 25%', stats: { scoreMul: 1.2, speedMul: 1.2, dodgeChance: 0.25 },
    },
    // --- ULTIMATE ---
    {
      id: 'rainbow', name: 'RAINBOW', price: 5000,
      body: '#ff0000', stripe: '#ff8800', ear: '#ffff00', glow: '#ff44ff',
      rainbow: true,
      desc: 'Maximum Sofia energy achieved',
      perk: 'ALL +25% COINS x3', stats: { scoreMul: 1.25, coinMul: 3.0, speedMul: 1.25, fireRateMul: 0.75 },
    },
  ],
  bullets: [
    { id: 'bread', name: 'BREAD ROLL', price: 0, color: '#e4b86e',
      desc: 'Classic baguette ammo', perk: 'No bonus', stats: {} },
    // --- BREAD VARIANTS ---
    { id: 'croissant', name: 'CROISSANT', price: 200, color: '#dda855', trail: '#eebb66',
      desc: 'Flaky French projectile', perk: 'SPEED +10%', stats: { bulletSpeedMul: 1.1 } },
    { id: 'baguette', name: 'BAGUETTE', price: 400, color: '#c49040', trail: '#d4a050',
      desc: 'Long and piercing', perk: 'PIERCE +1', stats: { pierce: 1 } },
    { id: 'pretzel', name: 'PRETZEL', price: 600, color: '#aa7733', trail: '#bb8844',
      desc: 'Twisted trajectory', perk: 'RICOCHET +1', stats: { ricochetBonus: 1 } },
    // --- TEQUILA ---
    { id: 'lime', name: 'LIME WEDGE', price: 500, color: '#88cc44', trail: '#aaee66',
      desc: 'Tequila chaser', perk: 'SLOW +COINS', stats: { slowOnHit: true, coinMul: 1.1 } },
    { id: 'salt_shot', name: 'SALT SHOT', price: 800, color: '#ffffff', trail: '#dddddd',
      desc: 'Salt rim shrapnel', perk: 'SPEED+20% CAP+1', stats: { bulletSpeedMul: 1.2, maxBulletBonus: 1 } },
    // --- STAR WARS ---
    { id: 'blaster', name: 'BLASTER BOLT', price: 1000, color: '#ff2200', trail: '#ff6644',
      desc: 'Pew pew pew!', perk: 'SPEED+30% CAP+2', stats: { bulletSpeedMul: 1.3, maxBulletBonus: 2 } },
    { id: 'lightsaber', name: 'SABER THROW', price: 2000, color: '#44ff44', trail: '#88ff88',
      desc: 'An elegant weapon for a civilized cat', perk: 'PIERCE+2 DMG+50%', stats: { pierce: 2, damageMul: 1.5 } },
    // --- PHOTOGRAPHY ---
    { id: 'flash', name: 'CAMERA FLASH', price: 1500, color: '#ffffff', trail: '#ffffaa',
      desc: 'Say cheese!', perk: 'PIERCE+1 SLOW', stats: { pierce: 1, slowOnHit: true } },
    // --- FLOWERS ---
    { id: 'tulip_toss', name: 'TULIP TOSS', price: 300, color: '#ee5577', trail: '#ff88aa',
      desc: 'Thorny projectile', perk: 'DMG +20%', stats: { damageMul: 1.2 } },
    // --- MUSIC ---
    { id: 'bass_drop', name: 'BASS DROP', price: 3000, color: '#e94560', trail: '#ff6680',
      desc: 'Fred Again inspired sonic boom', perk: 'PIERCE+3 SPEED+40%', stats: { pierce: 3, bulletSpeedMul: 1.4 } },
  ],
  trails: [
    { id: 'none', name: 'NONE', price: 0,
      desc: 'No trail bonus', perk: 'No bonus', stats: {} },
    // --- FLOWERS ---
    { id: 'petals', name: 'PETAL TRAIL', price: 200, color: '#ff88aa',
      desc: 'Tulip petals follow you', perk: 'COINS +5%', stats: { coinMul: 1.05 } },
    { id: 'lily_dust', name: 'LILY DUST', price: 350, color: '#ffffcc',
      desc: 'Golden lily pollen', perk: 'SCORE +10%', stats: { scoreMul: 1.1 } },
    // --- SKIING ---
    { id: 'powder', name: 'POWDER SNOW', price: 400, color: '#ddeeff',
      desc: 'Fresh tracks in the cosmos', perk: 'SPEED +10%', stats: { speedMul: 1.1 } },
    // --- DIVING ---
    { id: 'bubbles', name: 'BUBBLE TRAIL', price: 400, color: '#88ddff',
      desc: 'Deep space diving', perk: 'SLOW BULLETS -15%', stats: { enemyBulletSlowMul: 0.85 } },
    // --- TEQUILA ---
    { id: 'margarita', name: 'MARGARITA MIST', price: 600, color: '#88ff44',
      desc: 'Salt-rimmed wake', perk: 'DODGE 10%', stats: { dodgeChance: 0.1 } },
    // --- PHOTOGRAPHY ---
    { id: 'film_strip', name: 'FILM STRIP', price: 800, color: '#444444',
      desc: 'Every frame is a memory', perk: 'COMBO +25%', stats: { comboScoreMul: 1.25 } },
    // --- BOARD GAMES ---
    { id: 'dice_trail', name: 'DICE ROLL', price: 1000, color: '#ffffff',
      desc: 'Rolling natural 20s', perk: 'MISS 15% COINS+15%', stats: { enemyMissChance: 0.15, coinMul: 1.15 } },
    // --- MUSIC ---
    { id: 'soundwave', name: 'SOUNDWAVE', price: 1500, color: '#e94560',
      desc: 'Bass frequencies trail behind', perk: 'POWERUP +30%', stats: { powerupDurationMul: 1.3 } },
    // --- STAR WARS ---
    { id: 'hyperspace', name: 'HYPERSPACE', price: 2500, color: '#aaccff',
      desc: 'Stars streak past at lightspeed', perk: 'SPEED+20% MISS 20%', stats: { speedMul: 1.2, enemyMissChance: 0.2 } },
  ],
  barriers: [
    { id: 'flowers', name: 'FLOWERS', price: 0,
      desc: 'Classic tulips & lilies', perk: 'No bonus', stats: {} },
    // --- BREAD ---
    { id: 'bread_wall', name: 'BREAD WALL', price: 300, color1: '#d4a24e', color2: '#e4b86e',
      desc: 'Fortified with carbs', perk: 'HP +1', stats: { barrierHpBonus: 1 } },
    // --- DIVING ---
    { id: 'coral', name: 'CORAL REEF', price: 500, color1: '#ff6644', color2: '#ff88aa',
      desc: 'Deep sea defense', perk: 'HP+1 REGEN', stats: { barrierHpBonus: 1, barrierRegen: true } },
    // --- SKIING ---
    { id: 'snow_fort', name: 'SNOW FORT', price: 500, color1: '#ddeeff', color2: '#ffffff',
      desc: 'Packed powder walls', perk: 'HP+2', stats: { barrierHpBonus: 2 } },
    // --- STAR WARS ---
    { id: 'ray_shield', name: 'RAY SHIELD', price: 800, color1: '#4488ff', color2: '#88bbff',
      desc: 'Deflector shield generator', perk: 'HP+1 REFLECT', stats: { barrierHpBonus: 1, barrierReflect: true } },
    // --- CARD GAMES ---
    { id: 'card_house', name: 'CARD HOUSE', price: 600, color1: '#ffffff', color2: '#ff4444',
      desc: 'Fragile but lucky', perk: 'REGEN COINS+20%', stats: { barrierRegen: true, coinMul: 1.2 } },
    // --- SMISKI ---
    { id: 'smiski_wall', name: 'SMISKI WALL', price: 1000, color1: '#88cc88', color2: '#aaffaa',
      desc: 'Tiny glowing guardians', perk: 'HP+2 REGEN', stats: { barrierHpBonus: 2, barrierRegen: true } },
    // --- TEQUILA ---
    { id: 'bottle_wall', name: 'BOTTLE WALL', price: 1200, color1: '#88aa66', color2: '#ccdd44',
      desc: 'Empty bottles make great walls', perk: 'HP+2 BURN', stats: { barrierHpBonus: 2, barrierDamage: true } },
    // --- JELLYCAT ---
    { id: 'plush_fort', name: 'PLUSH FORT', price: 1500, color1: '#cc88cc', color2: '#ffccff',
      desc: 'Stuffed with love and HP', perk: 'HP+3 REGEN', stats: { barrierHpBonus: 3, barrierRegen: true } },
    // --- PHOTO BOOTH ---
    { id: 'photo_booth', name: 'PHOTO BOOTH', price: 2000, color1: '#ffcc00', color2: '#ff6644',
      desc: 'Strike a pose behind the curtain', perk: 'HP+3 REGEN REFLECT', stats: { barrierHpBonus: 3, barrierRegen: true, barrierReflect: true } },
  ],
};

// --- Collect all stats from equipped items ---
export function getEquippedStats() {
  const equipped = loadEquipped();
  const combined = {};

  for (const category of Object.keys(equipped)) {
    const itemId = equipped[category];
    const items = SHOP_ITEMS[category];
    if (!items) continue;
    const item = items.find((i) => i.id === itemId);
    if (!item || !item.stats) continue;

    for (const [key, val] of Object.entries(item.stats)) {
      if (typeof val === 'boolean') {
        combined[key] = val;
      } else if (typeof val === 'number') {
        // Multipliers stack multiplicatively, flat bonuses add
        if (key.endsWith('Mul') || key.endsWith('Chance')) {
          combined[key] = (combined[key] || 1) * val;
        } else {
          combined[key] = (combined[key] || 0) + val;
        }
      }
    }
  }

  return combined;
}

// --- COIN WALLET ---

export function loadWallet() {
  try {
    const data = localStorage.getItem('sofia_cantina_wallet');
    if (data) return JSON.parse(data);
  } catch (_) {}
  return { coins: 0, totalEarned: 0 };
}

export function saveWallet(wallet) {
  try {
    localStorage.setItem('sofia_cantina_wallet', JSON.stringify(wallet));
  } catch (_) {}
}

export function addCoins(wallet, amount) {
  return {
    coins: wallet.coins + amount,
    totalEarned: wallet.totalEarned + amount,
  };
}

// --- COIN EARNINGS ---

export const COIN_REWARDS = {
  kill: 4,
  eliteKill: 20,
  bossKill: 200,
  ufoKill: 40,
  waveClear: 60,
  perfectWave: 120,
  combo3: 12,
  combo5: 32,
  combo8: 60,
};

// --- OWNED ITEMS ---

export function loadOwned() {
  try {
    const data = localStorage.getItem('sofia_cantina_owned');
    if (data) return JSON.parse(data);
  } catch (_) {}
  // Default items are always owned
  return {
    skins: ['default'],
    bullets: ['bread'],
    trails: ['none'],
    barriers: ['flowers'],
  };
}

export function saveOwned(owned) {
  try {
    localStorage.setItem('sofia_cantina_owned', JSON.stringify(owned));
  } catch (_) {}
}

export function isOwned(owned, category, itemId) {
  return owned[category] && owned[category].includes(itemId);
}

export function buyItem(wallet, owned, category, itemId) {
  const items = SHOP_ITEMS[category];
  if (!items) return { success: false, wallet, owned };

  const item = items.find((i) => i.id === itemId);
  if (!item) return { success: false, wallet, owned };

  if (isOwned(owned, category, itemId)) {
    return { success: false, wallet, owned };
  }

  if (wallet.coins < item.price) {
    return { success: false, wallet, owned };
  }

  const newWallet = { ...wallet, coins: wallet.coins - item.price };
  const newOwned = { ...owned };
  newOwned[category] = [...(newOwned[category] || []), itemId];

  saveWallet(newWallet);
  saveOwned(newOwned);

  return { success: true, wallet: newWallet, owned: newOwned };
}

// --- EQUIPPED ITEMS ---

export function loadEquipped() {
  try {
    const data = localStorage.getItem('sofia_cantina_equipped');
    if (data) return JSON.parse(data);
  } catch (_) {}
  return {
    skins: 'default',
    bullets: 'bread',
    trails: 'none',
    barriers: 'flowers',
  };
}

export function saveEquipped(equipped) {
  try {
    localStorage.setItem('sofia_cantina_equipped', JSON.stringify(equipped));
  } catch (_) {}
}

export function equipItem(equipped, category, itemId) {
  const newEquipped = { ...equipped, [category]: itemId };
  saveEquipped(newEquipped);
  return newEquipped;
}

export function getEquippedSkin() {
  const equipped = loadEquipped();
  const skins = SHOP_ITEMS.skins;
  return skins.find((s) => s.id === equipped.skins) || skins[0];
}

export function getEquippedBullet() {
  const equipped = loadEquipped();
  const bullets = SHOP_ITEMS.bullets;
  return bullets.find((b) => b.id === equipped.bullets) || bullets[0];
}

export function getEquippedTrail() {
  const equipped = loadEquipped();
  const trails = SHOP_ITEMS.trails;
  return trails.find((t) => t.id === equipped.trails) || trails[0];
}

export function getEquippedBarrier() {
  const equipped = loadEquipped();
  const barriers = SHOP_ITEMS.barriers;
  return barriers.find((b) => b.id === equipped.barriers) || barriers[0];
}
