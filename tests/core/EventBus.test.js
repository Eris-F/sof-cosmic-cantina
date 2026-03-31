import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus, createEventBus } from '../../src/core/EventBus.js';

describe('EventBus', () => {
  /** @type {EventBus} */
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  // ── on / emit ───────────────────────────────────────────────────────────

  describe('on / emit', () => {
    it('delivers data to a subscriber', () => {
      const handler = vi.fn();
      bus.on('player:hit', handler);
      bus.emit('player:hit', { damage: 10 });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ damage: 10 });
    });

    it('delivers to multiple subscribers in order', () => {
      const order = [];
      bus.on('tick', () => order.push('a'));
      bus.on('tick', () => order.push('b'));
      bus.emit('tick');

      expect(order).toEqual(['a', 'b']);
    });

    it('does not fire handlers for other events', () => {
      const handler = vi.fn();
      bus.on('player:hit', handler);
      bus.emit('enemy:hit');

      expect(handler).not.toHaveBeenCalled();
    });

    it('binds context when provided', () => {
      const ctx = { name: 'Sofia' };
      /** @type {unknown} */
      let captured;
      bus.on('test', function () { captured = this; }, ctx);
      bus.emit('test');

      expect(captured).toBe(ctx);
    });

    it('returns an unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.on('x', handler);
      unsub();
      bus.emit('x');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── once ────────────────────────────────────────────────────────────────

  describe('once', () => {
    it('fires only on the first emission', () => {
      const handler = vi.fn();
      bus.once('flash', handler);
      bus.emit('flash', 1);
      bus.emit('flash', 2);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(1);
    });

    it('can be manually unsubscribed before firing', () => {
      const handler = vi.fn();
      const unsub = bus.once('flash', handler);
      unsub();
      bus.emit('flash');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ── off ─────────────────────────────────────────────────────────────────

  describe('off', () => {
    it('removes a specific callback', () => {
      const a = vi.fn();
      const b = vi.fn();
      bus.on('x', a);
      bus.on('x', b);
      bus.off('x', a);
      bus.emit('x');

      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalledOnce();
    });

    it('removes all listeners for an event when callback is omitted', () => {
      bus.on('x', vi.fn());
      bus.on('x', vi.fn());
      bus.off('x');

      expect(bus.getListenerCount('x')).toBe(0);
    });

    it('is a no-op for unknown event', () => {
      expect(() => bus.off('unknown')).not.toThrow();
    });
  });

  // ── wildcard ────────────────────────────────────────────────────────────

  describe('wildcard (*)', () => {
    it('receives all events with event name as first arg', () => {
      const spy = vi.fn();
      bus.on('*', spy);
      bus.emit('player:move', { x: 1 });
      bus.emit('enemy:hit', { id: 5 });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('player:move', { x: 1 });
      expect(spy).toHaveBeenCalledWith('enemy:hit', { id: 5 });
    });

    it('does not double-fire when emitting the wildcard event itself', () => {
      const spy = vi.fn();
      bus.on('*', spy);
      bus.emit('*', 'meta');

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // ── error isolation ─────────────────────────────────────────────────────

  describe('error isolation', () => {
    it('continues calling remaining handlers when one throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const good = vi.fn();

      bus.on('boom', () => { throw new Error('kaboom'); });
      bus.on('boom', good);
      bus.emit('boom');

      expect(good).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // ── emitAsync ───────────────────────────────────────────────────────────

  describe('emitAsync', () => {
    it('awaits async handlers', async () => {
      const order = [];
      bus.on('load', async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push('async');
      });
      bus.on('load', () => order.push('sync'));

      await bus.emitAsync('load');

      expect(order).toContain('async');
      expect(order).toContain('sync');
    });

    it('isolates errors from async handlers', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const good = vi.fn();

      bus.on('err', async () => { throw new Error('async fail'); });
      bus.on('err', good);

      await bus.emitAsync('err');

      expect(good).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('calls wildcard listeners during async emit', async () => {
      const spy = vi.fn();
      bus.on('*', spy);
      await bus.emitAsync('ping', 42);

      expect(spy).toHaveBeenCalledWith('ping', 42);
    });
  });

  // ── clear ───────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all listeners', () => {
      bus.on('a', vi.fn());
      bus.on('b', vi.fn());
      bus.clear();

      expect(bus.getListenerCount()).toBe(0);
    });
  });

  // ── getListenerCount ────────────────────────────────────────────────────

  describe('getListenerCount', () => {
    it('returns count for a specific event', () => {
      bus.on('x', vi.fn());
      bus.on('x', vi.fn());
      bus.on('y', vi.fn());

      expect(bus.getListenerCount('x')).toBe(2);
      expect(bus.getListenerCount('y')).toBe(1);
    });

    it('returns total count when no event specified', () => {
      bus.on('x', vi.fn());
      bus.on('y', vi.fn());

      expect(bus.getListenerCount()).toBe(2);
    });

    it('returns 0 for unknown event', () => {
      expect(bus.getListenerCount('nope')).toBe(0);
    });
  });

  // ── debug mode ──────────────────────────────────────────────────────────

  describe('debug mode', () => {
    it('logs events when debug is enabled', () => {
      const debugBus = new EventBus({ debug: true });
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      debugBus.emit('test', 'payload');

      expect(spy).toHaveBeenCalledWith('[EventBus] test', 'payload');
      spy.mockRestore();
    });

    it('does not log when debug is disabled', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      bus.emit('test');

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ── validation ──────────────────────────────────────────────────────────

  describe('validation', () => {
    it('throws on non-string event in on()', () => {
      expect(() => bus.on(123, vi.fn())).toThrow(TypeError);
    });

    it('throws on non-function callback in on()', () => {
      expect(() => bus.on('x', 'notAFn')).toThrow(TypeError);
    });

    it('throws on non-string event in emit()', () => {
      expect(() => bus.emit(null)).toThrow(TypeError);
    });
  });

  // ── singleton factory ───────────────────────────────────────────────────

  describe('createEventBus', () => {
    it('returns the same instance on repeated calls', () => {
      const a = createEventBus({ fresh: true });
      const b = createEventBus();

      expect(a).toBe(b);
    });

    it('returns a fresh instance when requested', () => {
      const a = createEventBus({ fresh: true });
      const b = createEventBus({ fresh: true });

      expect(a).not.toBe(b);
    });
  });
});
