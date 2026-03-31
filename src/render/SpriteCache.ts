/**
 * SpriteCache — renders sprites to OffscreenCanvas once, then draws
 * cached bitmaps via drawImage each frame. Sprites only re-render
 * when their cache key changes (skin, flash, elite glow, etc.).
 *
 * Reduces draw calls from ~500/frame to ~50/frame for a grid of 30 enemies.
 *
 * @module render/SpriteCache
 */

interface CacheEntry {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
}

const cache: Map<string, CacheEntry> = new Map();

/** Maximum cache entries before LRU eviction. */
const MAX_CACHE = 128;
const accessOrder: string[] = [];

function touchKey(key: string): void {
  const idx = accessOrder.indexOf(key);
  if (idx !== -1) accessOrder.splice(idx, 1);
  accessOrder.push(key);
}

function evictIfNeeded(): void {
  while (cache.size > MAX_CACHE && accessOrder.length > 0) {
    const oldest = accessOrder.shift()!;
    cache.delete(oldest);
  }
}

/**
 * Get or create a cached sprite. If the key doesn't exist, calls renderFn
 * to draw the sprite onto a fresh OffscreenCanvas, then caches it.
 *
 * @param key Unique cache key (e.g. "enemy:smiski:normal:0" or "cat:default:flash")
 * @param width Sprite width in logical pixels
 * @param height Sprite height in logical pixels
 * @param renderFn Called with (ctx, 0, 0) to draw the sprite if not cached
 */
export function getCachedSprite(
  key: string,
  width: number,
  height: number,
  renderFn: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void,
): CacheEntry {
  const existing = cache.get(key);
  if (existing) {
    touchKey(key);
    return existing;
  }

  evictIfNeeded();

  // Use OffscreenCanvas where available (Chrome, Firefox), fallback to regular canvas
  let cvs: OffscreenCanvas | HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  if (typeof OffscreenCanvas !== 'undefined') {
    cvs = new OffscreenCanvas(width, height);
    ctx = cvs.getContext('2d')!;
  } else {
    cvs = document.createElement('canvas');
    cvs.width = width;
    cvs.height = height;
    ctx = cvs.getContext('2d')!;
  }

  renderFn(ctx);

  const entry: CacheEntry = { canvas: cvs, ctx, width, height };
  cache.set(key, entry);
  touchKey(key);
  return entry;
}

/**
 * Draw a cached sprite onto the main canvas context.
 */
export function drawCached(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
  renderFn: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void,
): void {
  const entry = getCachedSprite(key, width, height, renderFn);
  ctx.drawImage(entry.canvas as unknown as CanvasImageSource, x, y);
}

/**
 * Invalidate a specific cache key (e.g. when skin changes).
 */
export function invalidateSprite(key: string): void {
  cache.delete(key);
  const idx = accessOrder.indexOf(key);
  if (idx !== -1) accessOrder.splice(idx, 1);
}

/**
 * Invalidate all cache entries matching a prefix (e.g. "enemy:" to clear all enemies).
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire sprite cache (call on game reset or skin change).
 */
export function clearSpriteCache(): void {
  cache.clear();
  accessOrder.length = 0;
}

/**
 * Current cache size (for debugging/perf monitoring).
 */
export function spriteCacheSize(): number {
  return cache.size;
}
