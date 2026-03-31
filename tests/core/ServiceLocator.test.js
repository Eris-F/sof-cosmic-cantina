import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ServiceLocator,
  createServiceLocator,
} from '../../src/core/ServiceLocator.js';

describe('ServiceLocator', () => {
  /** @type {ServiceLocator} */
  let container;

  beforeEach(() => {
    container = new ServiceLocator();
  });

  // ── register / resolve ──────────────────────────────────────────────────

  describe('register / resolve', () => {
    it('stores and retrieves a service', () => {
      const audio = { play() {} };
      container.register('audio', audio);

      expect(container.resolve('audio')).toBe(audio);
    });

    it('overwrites a previous registration', () => {
      container.register('x', 'old');
      container.register('x', 'new');

      expect(container.resolve('x')).toBe('new');
    });

    it('throws when resolving an unregistered service', () => {
      expect(() => container.resolve('missing')).toThrow(
        /service "missing" is not registered/,
      );
    });
  });

  // ── registerFactory ─────────────────────────────────────────────────────

  describe('registerFactory', () => {
    it('lazily instantiates on first resolve', () => {
      const factory = vi.fn(() => ({ type: 'renderer' }));
      container.registerFactory('renderer', factory);

      expect(factory).not.toHaveBeenCalled();

      const result = container.resolve('renderer');

      expect(factory).toHaveBeenCalledOnce();
      expect(result).toEqual({ type: 'renderer' });
    });

    it('caches the result — factory is called only once', () => {
      const factory = vi.fn(() => ({}));
      container.registerFactory('svc', factory);

      const first = container.resolve('svc');
      const second = container.resolve('svc');

      expect(first).toBe(second);
      expect(factory).toHaveBeenCalledOnce();
    });

    it('throws when factory is not a function', () => {
      expect(() => container.registerFactory('bad', 'notFn')).toThrow(
        TypeError,
      );
    });
  });

  // ── has ─────────────────────────────────────────────────────────────────

  describe('has', () => {
    it('returns true for registered instance', () => {
      container.register('x', 1);
      expect(container.has('x')).toBe(true);
    });

    it('returns true for registered factory', () => {
      container.registerFactory('y', () => 2);
      expect(container.has('y')).toBe(true);
    });

    it('returns false for unregistered name', () => {
      expect(container.has('nope')).toBe(false);
    });
  });

  // ── freeze ──────────────────────────────────────────────────────────────

  describe('freeze', () => {
    it('prevents register after freeze', () => {
      container.freeze();

      expect(() => container.register('x', 1)).toThrow(/frozen/);
    });

    it('prevents registerFactory after freeze', () => {
      container.freeze();

      expect(() => container.registerFactory('x', () => 1)).toThrow(/frozen/);
    });

    it('still allows resolve after freeze', () => {
      container.register('x', 42);
      container.freeze();

      expect(container.resolve('x')).toBe(42);
    });

    it('still allows factory resolve after freeze', () => {
      container.registerFactory('lazy', () => 'value');
      container.freeze();

      expect(container.resolve('lazy')).toBe('value');
    });
  });

  // ── reset ───────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all services and unfreezes', () => {
      container.register('a', 1);
      container.registerFactory('b', () => 2);
      container.freeze();
      container.reset();

      expect(container.has('a')).toBe(false);
      expect(container.has('b')).toBe(false);
      // Can register again after reset
      expect(() => container.register('c', 3)).not.toThrow();
    });
  });

  // ── validation ──────────────────────────────────────────────────────────

  describe('validation', () => {
    it('throws on empty string name', () => {
      expect(() => container.register('', 1)).toThrow(TypeError);
    });

    it('throws on non-string name', () => {
      expect(() => container.register(123, 1)).toThrow(TypeError);
    });
  });

  // ── singleton factory ───────────────────────────────────────────────────

  describe('createServiceLocator', () => {
    it('returns the same instance on repeated calls', () => {
      const a = createServiceLocator({ fresh: true });
      const b = createServiceLocator();

      expect(a).toBe(b);
    });

    it('returns a fresh instance when requested', () => {
      const a = createServiceLocator({ fresh: true });
      const b = createServiceLocator({ fresh: true });

      expect(a).not.toBe(b);
    });
  });
});
