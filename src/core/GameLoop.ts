/**
 * Fixed-timestep game loop decoupled from requestAnimationFrame.
 *
 * @module core/GameLoop
 */

import type { IGameLoop, GameLoopOptions } from '../types/index';

/**
 * Creates a fixed-timestep game loop.
 */
export function createGameLoop(options: GameLoopOptions): IGameLoop {
  const { onUpdate, onRender, targetFPS = 60 } = options;
  const FIXED_DT: number = 1 / targetFPS;
  const MAX_DT: number = 0.1; // prevent spiral of death
  let accumulator = 0;
  let lastTime = 0;
  let rafId: number | null = null;
  let running = false;

  function frame(timestamp: number): void {
    if (!running) return;
    const rawDt: number = Math.min((timestamp - lastTime) / 1000, MAX_DT);
    lastTime = timestamp;
    accumulator += rawDt;

    while (accumulator >= FIXED_DT) {
      onUpdate(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    const alpha: number = accumulator / FIXED_DT; // interpolation factor for rendering
    onRender(alpha);
    rafId = requestAnimationFrame(frame);
  }

  return {
    start(): void {
      running = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    isRunning(): boolean {
      return running;
    },
    /** Manually step one update + render. For testing. */
    tick(dt?: number): void {
      onUpdate(dt ?? FIXED_DT);
      onRender(0);
    },
  };
}
