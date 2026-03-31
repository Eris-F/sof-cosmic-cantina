/**
 * Zone — a named rectangular touch target on the canvas.
 *
 * Shared between renderers (draw here), scene handlers (detect taps here),
 * and tests (tap here). Single source of truth — never duplicate coordinates.
 *
 * @module zones/Zone
 */

export interface Zone {
  /** Human-readable name for debug overlay and logs */
  readonly name: string;
  /** Left edge x */
  readonly x: number;
  /** Top edge y */
  readonly y: number;
  /** Width */
  readonly w: number;
  /** Height */
  readonly h: number;
}

/** Create a zone with a name. */
export function zone(name: string, x: number, y: number, w: number, h: number): Zone {
  return Object.freeze({ name, x, y, w, h });
}

/** Center point of a zone. */
export function zoneCenter(z: Zone): { x: number; y: number } {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

/** Hit test: is (px, py) inside the zone? */
export function zoneHit(z: Zone, px: number, py: number): boolean {
  return px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h;
}

/** Get all 4 corners + center for boundary testing. */
export function zoneTestPoints(z: Zone): {
  center: { x: number; y: number };
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  outsideLeft: { x: number; y: number };
  outsideRight: { x: number; y: number };
  outsideTop: { x: number; y: number };
  outsideBottom: { x: number; y: number };
} {
  return {
    center: { x: z.x + z.w / 2, y: z.y + z.h / 2 },
    topLeft: { x: z.x + 1, y: z.y + 1 },
    topRight: { x: z.x + z.w - 1, y: z.y + 1 },
    bottomLeft: { x: z.x + 1, y: z.y + z.h - 1 },
    bottomRight: { x: z.x + z.w - 1, y: z.y + z.h - 1 },
    outsideLeft: { x: z.x - 2, y: z.y + z.h / 2 },
    outsideRight: { x: z.x + z.w + 2, y: z.y + z.h / 2 },
    outsideTop: { x: z.x + z.w / 2, y: z.y - 2 },
    outsideBottom: { x: z.x + z.w / 2, y: z.y + z.h + 2 },
  };
}
