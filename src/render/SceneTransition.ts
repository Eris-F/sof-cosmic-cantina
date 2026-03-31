/**
 * Scene transition effects — crossfade between scenes.
 *
 * On scene change: captures current frame, then blends from captured
 * frame to the new scene's render over a short duration.
 *
 * @module render/SceneTransition
 */

type TransitionType = 'fade' | 'slide-left' | 'slide-right';

interface ActiveTransition {
  type: TransitionType;
  fromImage: ImageBitmap | HTMLCanvasElement | null;
  elapsed: number;
  duration: number;
}

let transition: ActiveTransition | null = null;

const DEFAULT_DURATION = 0.25; // seconds

/**
 * Start a scene transition. Call BEFORE the scene change happens.
 * Captures the current canvas as the "from" image.
 */
export function startTransition(
  canvas: HTMLCanvasElement,
  type: TransitionType = 'fade',
  duration = DEFAULT_DURATION,
): void {
  // Capture current frame
  let fromImage: HTMLCanvasElement | null = null;
  try {
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const copyCtx = copy.getContext('2d');
    if (copyCtx) {
      copyCtx.drawImage(canvas, 0, 0);
      fromImage = copy;
    }
  } catch {
    // Canvas tainted or unavailable — skip transition
  }

  transition = {
    type,
    fromImage,
    elapsed: 0,
    duration,
  };
}

/**
 * Update the transition timer. Returns true if a transition is active.
 */
export function updateTransition(dt: number): boolean {
  if (!transition) return false;
  transition.elapsed += dt;
  if (transition.elapsed >= transition.duration) {
    transition = null;
    return false;
  }
  return true;
}

/**
 * Render the transition effect. Call AFTER the new scene has been rendered.
 * Blends the captured "from" image over the current frame.
 */
export function renderTransition(ctx: CanvasRenderingContext2D): void {
  if (!transition || !transition.fromImage) return;

  const progress = Math.min(1, transition.elapsed / transition.duration);
  const alpha = 1 - progress; // from image fades out

  ctx.save();

  switch (transition.type) {
    case 'fade':
      ctx.globalAlpha = alpha;
      ctx.drawImage(transition.fromImage, 0, 0);
      break;

    case 'slide-left': {
      const offsetX = -progress * ctx.canvas.width;
      ctx.globalAlpha = 1;
      ctx.drawImage(transition.fromImage, offsetX, 0);
      break;
    }

    case 'slide-right': {
      const offsetX = progress * ctx.canvas.width;
      ctx.globalAlpha = 1;
      ctx.drawImage(transition.fromImage, offsetX, 0);
      break;
    }
  }

  ctx.restore();
}

/**
 * Check if a transition is currently active.
 */
export function isTransitioning(): boolean {
  return transition !== null;
}

/**
 * Cancel any active transition.
 */
export function cancelTransition(): void {
  transition = null;
}
