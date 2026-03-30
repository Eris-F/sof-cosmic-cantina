// All sprites drawn as pixel art on canvas — no emojis, no images

export function drawCatShip(ctx, x, y, skin) {
  const bodyColor = skin ? skin.body : '#ff9933';
  const stripeColor = skin ? skin.stripe : '#cc7722';
  const earColor = skin ? skin.ear : '#ff6688';

  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Skin glow effect
  if (skin && skin.glow) {
    ctx.globalAlpha = 0.15 + 0.05 * Math.sin(performance.now() / 200);
    ctx.fillStyle = skin.glow;
    ctx.fillRect(-18, -20, 36, 36);
    ctx.globalAlpha = 1;
  }

  // Bread/baguette base
  ctx.fillStyle = '#d4a24e';
  ctx.fillRect(-14, 6, 28, 8);
  ctx.fillStyle = '#c4912e';
  ctx.fillRect(-12, 10, 24, 4);
  ctx.fillStyle = '#e4b86e';
  ctx.fillRect(-10, 6, 20, 3);

  // Cannon barrel
  ctx.fillStyle = '#666';
  ctx.fillRect(-2, -4, 4, 12);
  ctx.fillStyle = '#888';
  ctx.fillRect(-1, -6, 2, 4);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(-1, -7, 2, 1);

  // Cat body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-8, -6, 6, 10);
  ctx.fillRect(2, -6, 6, 10);
  ctx.fillRect(-6, -4, 12, 8);

  // Tuxedo chest
  if (skin && skin.chest) {
    ctx.fillStyle = skin.chest;
    ctx.fillRect(-3, -2, 6, 6);
  }

  // Calico patches
  if (skin && skin.patches) {
    ctx.fillStyle = skin.patches[0];
    ctx.fillRect(-7, -5, 4, 3);
    ctx.fillStyle = skin.patches[1];
    ctx.fillRect(3, -3, 4, 3);
  }

  // Cat head
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-6, -12, 12, 8);

  // Cat ears
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-8, -16, 4, 5);
  ctx.fillRect(4, -16, 4, 5);
  // Inner ears
  ctx.fillStyle = earColor;
  ctx.fillRect(-7, -15, 2, 3);
  ctx.fillRect(5, -15, 2, 3);

  // Cat eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(-5, -11, 2, 2);
  ctx.fillRect(3, -11, 2, 2);

  // Cat nose
  ctx.fillStyle = earColor;
  ctx.fillRect(-1, -9, 2, 1);

  // Cat stripes
  ctx.fillStyle = stripeColor;
  ctx.fillRect(-5, -5, 2, 1);
  ctx.fillRect(3, -5, 2, 1);
  ctx.fillRect(-6, -3, 2, 1);
  ctx.fillRect(4, -3, 2, 1);

  ctx.restore();
}

export function drawCatLife(ctx, x, y) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  // Tiny cat face
  ctx.fillStyle = '#ff9933';
  ctx.fillRect(-4, -4, 8, 6);
  // Ears
  ctx.fillRect(-5, -7, 3, 3);
  ctx.fillRect(2, -7, 3, 3);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(-3, -3, 1, 1);
  ctx.fillRect(2, -3, 1, 1);
  ctx.restore();
}

export function drawBreadBullet(ctx, x, y) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  // Small bread roll
  ctx.fillStyle = '#e4b86e';
  ctx.fillRect(-2, -4, 4, 6);
  ctx.fillStyle = '#d4a24e';
  ctx.fillRect(-1, -3, 2, 4);
  ctx.fillStyle = '#f0cc88';
  ctx.fillRect(-1, -4, 2, 1);
  ctx.restore();
}

export function drawSmiski(ctx, x, y, frame) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Body (small green figurine)
  ctx.fillStyle = '#88cc88';
  ctx.fillRect(-4, -4, 8, 12);

  // Head
  ctx.fillStyle = '#a0e0a0';
  ctx.fillRect(-5, -10, 10, 8);

  // Eyes (closed, peaceful)
  ctx.fillStyle = '#446644';
  ctx.fillRect(-3, -7, 2, 1);
  ctx.fillRect(1, -7, 2, 1);

  // Mouth (small smile)
  ctx.fillStyle = '#446644';
  ctx.fillRect(-1, -5, 2, 1);

  // Arms (subtle pose based on frame)
  ctx.fillStyle = '#88cc88';
  if (frame === 0) {
    ctx.fillRect(-6, -2, 2, 4);
    ctx.fillRect(4, -2, 2, 4);
  } else {
    ctx.fillRect(-6, -3, 2, 4);
    ctx.fillRect(4, -1, 2, 4);
  }

  // Glow effect
  ctx.fillStyle = 'rgba(160, 255, 160, 0.15)';
  ctx.fillRect(-7, -12, 14, 18);

  ctx.restore();
}

export function drawJellycat(ctx, x, y, frame) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Round plush body
  ctx.fillStyle = '#cc88cc';
  ctx.fillRect(-8, -4, 16, 10);
  ctx.fillRect(-6, -6, 12, 14);

  // Ears (floppy)
  ctx.fillStyle = '#bb77bb';
  if (frame === 0) {
    ctx.fillRect(-8, -8, 4, 4);
    ctx.fillRect(4, -8, 4, 4);
  } else {
    ctx.fillRect(-9, -7, 4, 4);
    ctx.fillRect(5, -7, 4, 4);
  }

  // Inner ears
  ctx.fillStyle = '#ddaadd';
  ctx.fillRect(-7, -7, 2, 2);
  ctx.fillRect(5, -7, 2, 2);

  // Eyes (button eyes)
  ctx.fillStyle = '#222';
  ctx.fillRect(-4, -3, 2, 2);
  ctx.fillRect(2, -3, 2, 2);
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.fillRect(-4, -3, 1, 1);
  ctx.fillRect(2, -3, 1, 1);

  // Nose
  ctx.fillStyle = '#885588';
  ctx.fillRect(-1, 0, 2, 1);

  // Belly patch
  ctx.fillStyle = '#ddaadd';
  ctx.fillRect(-3, 2, 6, 4);

  ctx.restore();
}

export function drawTieFighter(ctx, x, y, frame) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Solar panel left
  ctx.fillStyle = '#556';
  ctx.fillRect(-12, -8, 5, 16);
  // Panel lines
  ctx.fillStyle = '#334';
  ctx.fillRect(-11, -8, 1, 16);
  ctx.fillRect(-9, -8, 1, 16);

  // Solar panel right
  ctx.fillStyle = '#556';
  ctx.fillRect(7, -8, 5, 16);
  ctx.fillStyle = '#334';
  ctx.fillRect(8, -8, 1, 16);
  ctx.fillRect(10, -8, 1, 16);

  // Struts
  ctx.fillStyle = '#778';
  ctx.fillRect(-7, -1, 4, 2);
  ctx.fillRect(3, -1, 4, 2);

  // Cockpit (hexagonal-ish)
  ctx.fillStyle = '#667';
  ctx.fillRect(-3, -5, 6, 10);
  ctx.fillRect(-5, -3, 10, 6);

  // Cockpit window
  ctx.fillStyle = frame === 0 ? '#4488cc' : '#55aaee';
  ctx.fillRect(-2, -3, 4, 4);
  ctx.fillStyle = '#66ccff';
  ctx.fillRect(-1, -2, 2, 2);

  ctx.restore();
}

export function drawTequilaUFO(ctx, x, y, time) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Saucer glow ring
  const glowAlpha = 0.3 + 0.15 * Math.sin(time * 6);
  ctx.fillStyle = `rgba(0, 255, 200, ${glowAlpha})`;
  ctx.fillRect(-16, 4, 32, 3);
  ctx.fillRect(-14, 3, 28, 1);
  ctx.fillRect(-14, 7, 28, 1);

  // Bottle body
  ctx.fillStyle = '#88aa66';
  ctx.fillRect(-4, -8, 8, 14);
  ctx.fillStyle = '#99bb77';
  ctx.fillRect(-3, -7, 2, 12);

  // Bottle neck
  ctx.fillStyle = '#88aa66';
  ctx.fillRect(-2, -12, 4, 5);

  // Cap
  ctx.fillStyle = '#cc9944';
  ctx.fillRect(-2, -14, 4, 3);

  // Label
  ctx.fillStyle = '#eedd99';
  ctx.fillRect(-3, -2, 6, 5);
  ctx.fillStyle = '#cc4444';
  ctx.fillRect(-2, 0, 4, 1);

  // Saucer base
  ctx.fillStyle = '#445566';
  ctx.fillRect(-10, 5, 20, 3);
  ctx.fillStyle = '#556677';
  ctx.fillRect(-8, 4, 16, 2);

  ctx.restore();
}

export function drawEnemyBullet(ctx, x, y) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(-1, -3, 2, 6);
  ctx.fillStyle = '#ff8866';
  ctx.fillRect(-1, -3, 1, 2);
  ctx.restore();
}

export function drawTulipBlock(ctx, x, y, hp) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  // Tulip block — 1 HP, red/pink
  ctx.fillStyle = hp > 0 ? '#ee5577' : '#882244';
  ctx.fillRect(0, 0, 4, 3);
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(1, 3, 2, 1);
  ctx.restore();
}

export function drawLilyBlock(ctx, x, y, hp) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  // Lily block — 2 HP, white/yellow
  if (hp === 2) {
    ctx.fillStyle = '#ffffee';
  } else if (hp === 1) {
    ctx.fillStyle = '#cccc99';
  } else {
    ctx.fillStyle = '#666644';
  }
  ctx.fillRect(0, 0, 4, 3);
  ctx.fillStyle = '#ffcc44';
  ctx.fillRect(1, 1, 2, 1);
  ctx.restore();
}

export function drawPetal(ctx, x, y, size, color, rotation, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.floor(x), Math.floor(y));
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  // Teardrop petal shape
  ctx.fillRect(-1, -size, 2, size);
  ctx.fillRect(-2, -size + 1, 1, size - 2);
  ctx.restore();
}
