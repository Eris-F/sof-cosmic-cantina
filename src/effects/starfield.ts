import { CANVAS_WIDTH, CANVAS_HEIGHT, STAR_LAYERS } from '../constants';

export interface Star {
  x: number;
  y: number;
  readonly size: number;
  readonly alpha: number;
  readonly color: string;
  readonly speed: number;
}

export interface Nebula {
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly alpha: number;
  readonly speed: number;
}

export interface Starfield {
  readonly stars: Star[];
  readonly nebulae: Nebula[];
}

interface StarLayer {
  readonly count: number;
  readonly speed: number;
  readonly sizeMin: number;
  readonly sizeMax: number;
  readonly alpha: number;
}

interface SkyTheme {
  readonly top: string;
  readonly bottom: string;
}

function createStar(layer: StarLayer): Star {
  const size = layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin);
  const tintRoll = Math.random();
  let color: string;
  if (tintRoll < 0.05) {
    color = '#aaccff'; // blue tint
  } else if (tintRoll < 0.1) {
    color = '#ffffaa'; // yellow tint
  } else {
    color = '#ffffff';
  }
  return {
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    size: Math.floor(size),
    alpha: layer.alpha * (0.6 + Math.random() * 0.4),
    color,
    speed: layer.speed,
  };
}

export function createStarfield(): Starfield {
  const stars: Star[] = [];
  for (const layer of STAR_LAYERS) {
    for (let i = 0; i < layer.count; i++) {
      stars.push(createStar(layer));
    }
  }

  // Nebula wisps
  const nebulae: Nebula[] = [];
  for (let i = 0; i < 3; i++) {
    nebulae.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      width: 60 + Math.random() * 100,
      height: 30 + Math.random() * 50,
      color: Math.random() > 0.5 ? 'rgba(60, 20, 80,' : 'rgba(20, 30, 80,',
      alpha: 0.06 + Math.random() * 0.06,
      speed: 3 + Math.random() * 3,
    });
  }

  return { stars, nebulae };
}

export function updateStarfield(starfield: Starfield, dt: number): void {
  for (const star of starfield.stars) {
    star.y += star.speed * dt;
    if (star.y > CANVAS_HEIGHT) {
      star.y = -2;
      star.x = Math.random() * CANVAS_WIDTH;
    }
  }
  for (const neb of starfield.nebulae) {
    neb.y += neb.speed * dt;
    if (neb.y > CANVAS_HEIGHT + neb.height) {
      neb.y = -neb.height;
      neb.x = Math.random() * CANVAS_WIDTH;
    }
  }
}

// Day/night color themes that cycle every few waves
const SKY_THEMES: readonly SkyTheme[] = [
  { top: '#000011', bottom: '#000833' },       // deep night (default)
  { top: '#0a0020', bottom: '#1a0044' },       // purple nebula
  { top: '#001122', bottom: '#002244' },       // deep blue
  { top: '#110808', bottom: '#220011' },       // crimson void
  { top: '#081108', bottom: '#002200' },       // emerald space
  { top: '#111100', bottom: '#332200' },       // golden dusk
];

export function renderStarfield(
  ctx: CanvasRenderingContext2D,
  starfield: Starfield,
  wave?: number,
): void {
  const themeIdx = Math.floor(((wave || 1) - 1) / 3) % SKY_THEMES.length;
  const nextIdx = (themeIdx + 1) % SKY_THEMES.length;
  const blend = ((wave || 1) - 1) % 3 / 3; // blend between themes

  const theme = SKY_THEMES[themeIdx]!;
  const next = SKY_THEMES[nextIdx]!;

  const topColor = lerpColor(theme.top, next.top, blend);
  const bottomColor = lerpColor(theme.bottom, next.bottom, blend);

  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Nebula wisps
  for (const neb of starfield.nebulae) {
    ctx.fillStyle = neb.color + neb.alpha + ')';
    ctx.beginPath();
    ctx.ellipse(neb.x, neb.y, neb.width / 2, neb.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stars
  for (const star of starfield.stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = star.color;
    ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
