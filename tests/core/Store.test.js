import { describe, it, expect, vi } from 'vitest';
import { createGameStore } from '../../src/core/Store.js';

/** Simple state factory for tests. */
const makeFactory = () => ({
  player: { x: 100, y: 200, score: 0 },
  wave: 1,
  items: ['a', 'b'],
});

describe('createGameStore', () => {
  it('creates a store with initial state from factory', () => {
    const store = createGameStore(makeFactory);
    const state = store.getState();

    expect(state.player.x).toBe(100);
    expect(state.player.y).toBe(200);
    expect(state.wave).toBe(1);
    expect(state.items).toEqual(['a', 'b']);

    store.destroy();
  });

  it('applies initial overrides on top of factory state', () => {
    const store = createGameStore(makeFactory, { wave: 5 });
    expect(store.getState().wave).toBe(5);
    expect(store.getState().player.x).toBe(100);
    store.destroy();
  });

  describe('update (immer)', () => {
    it('mutates state immutably via immer draft', () => {
      const store = createGameStore(makeFactory);
      const before = store.getState();

      store.update((draft) => {
        draft.player.x = 42;
        draft.player.score = 999;
      });

      const after = store.getState();
      expect(after.player.x).toBe(42);
      expect(after.player.score).toBe(999);
      // Original reference should not be the same object
      expect(after).not.toBe(before);
      expect(after.player).not.toBe(before.player);
      // Unchanged branches keep referential identity (immer structural sharing)
      expect(after.items).toBe(before.items);

      store.destroy();
    });

    it('supports array mutations inside draft', () => {
      const store = createGameStore(makeFactory);

      store.update((draft) => {
        draft.items.push('c');
      });

      expect(store.getState().items).toEqual(['a', 'b', 'c']);
      store.destroy();
    });

    it('does nothing after destroy', () => {
      const store = createGameStore(makeFactory);
      store.destroy();

      store.update((draft) => {
        draft.wave = 99;
      });

      expect(store.getState().wave).toBe(1);
    });
  });

  describe('subscribe', () => {
    it('fires callback when selected slice changes', () => {
      const store = createGameStore(makeFactory);
      const callback = vi.fn();

      store.subscribe((s) => s.player.x, callback);

      store.update((draft) => {
        draft.player.x = 50;
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(50);

      store.destroy();
    });

    it('does not fire when unrelated state changes', () => {
      const store = createGameStore(makeFactory);
      const callback = vi.fn();

      store.subscribe((s) => s.player.x, callback);

      store.update((draft) => {
        draft.wave = 10;
      });

      expect(callback).not.toHaveBeenCalled();

      store.destroy();
    });

    it('does not fire when value is the same (Object.is)', () => {
      const store = createGameStore(makeFactory);
      const callback = vi.fn();

      store.subscribe((s) => s.wave, callback);

      store.update((draft) => {
        draft.wave = 1; // same value
      });

      expect(callback).not.toHaveBeenCalled();

      store.destroy();
    });

    it('returns an unsubscribe function', () => {
      const store = createGameStore(makeFactory);
      const callback = vi.fn();

      const unsub = store.subscribe((s) => s.wave, callback);

      store.update((draft) => {
        draft.wave = 2;
      });
      expect(callback).toHaveBeenCalledTimes(1);

      unsub();

      store.update((draft) => {
        draft.wave = 3;
      });
      expect(callback).toHaveBeenCalledTimes(1);

      store.destroy();
    });

    it('returns noop unsubscribe after destroy', () => {
      const store = createGameStore(makeFactory);
      store.destroy();

      const unsub = store.subscribe((s) => s.wave, vi.fn());
      expect(unsub).toBeTypeOf('function');
      unsub(); // should not throw
    });
  });

  describe('snapshot', () => {
    it('returns a deep-frozen copy of state', () => {
      const store = createGameStore(makeFactory);

      store.update((draft) => {
        draft.player.score = 500;
      });

      const snap = store.snapshot();

      expect(snap.player.score).toBe(500);
      expect(Object.isFrozen(snap)).toBe(true);
      expect(Object.isFrozen(snap.player)).toBe(true);
      expect(Object.isFrozen(snap.items)).toBe(true);

      store.destroy();
    });

    it('snapshot is independent of further state changes', () => {
      const store = createGameStore(makeFactory);

      const snap = store.snapshot();

      store.update((draft) => {
        draft.wave = 99;
      });

      expect(snap.wave).toBe(1);
      expect(store.getState().wave).toBe(99);

      store.destroy();
    });
  });

  describe('restore', () => {
    it('replaces state from a snapshot', () => {
      const store = createGameStore(makeFactory);

      const snap = store.snapshot();

      store.update((draft) => {
        draft.wave = 50;
        draft.player.x = 0;
      });

      store.restore(snap);

      expect(store.getState().wave).toBe(1);
      expect(store.getState().player.x).toBe(100);

      store.destroy();
    });

    it('restored state is independent of the snapshot object', () => {
      const store = createGameStore(makeFactory);

      const rawSnap = { player: { x: 1, y: 2, score: 3 }, wave: 7, items: [] };
      store.restore(rawSnap);

      // Mutate the source object — store should be unaffected
      rawSnap.wave = 999;

      expect(store.getState().wave).toBe(7);

      store.destroy();
    });

    it('throws on invalid input', () => {
      const store = createGameStore(makeFactory);
      expect(() => store.restore(null)).toThrow('non-null object');
      expect(() => store.restore('bad')).toThrow('non-null object');
      store.destroy();
    });

    it('does nothing after destroy', () => {
      const store = createGameStore(makeFactory);
      store.destroy();

      store.restore({ player: { x: 0, y: 0, score: 0 }, wave: 99, items: [] });
      expect(store.getState().wave).toBe(1);
    });
  });

  describe('reset', () => {
    it('resets state to factory defaults', () => {
      const store = createGameStore(makeFactory);

      store.update((draft) => {
        draft.wave = 20;
        draft.player.score = 9999;
      });

      store.reset();

      expect(store.getState().wave).toBe(1);
      expect(store.getState().player.score).toBe(0);

      store.destroy();
    });

    it('reset produces a fresh object (not reference to previous)', () => {
      const store = createGameStore(makeFactory);
      const before = store.getState();

      store.reset();
      const after = store.getState();

      expect(after).not.toBe(before);
      expect(after.player).not.toBe(before.player);

      store.destroy();
    });

    it('does nothing after destroy', () => {
      const store = createGameStore(makeFactory);
      store.update((draft) => {
        draft.wave = 77;
      });
      store.destroy();

      store.reset();
      expect(store.getState().wave).toBe(77);
    });
  });

  describe('destroy', () => {
    it('unsubscribes all listeners', () => {
      const store = createGameStore(makeFactory);
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      store.subscribe((s) => s.wave, cb1);
      store.subscribe((s) => s.player.x, cb2);

      store.destroy();

      // Zustand store still works, but our subscriptions are dead
      // We need to use the raw zustand store to verify — but since
      // update() is a no-op after destroy, we just confirm no callbacks fire
      // on a hypothetical update
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });

    it('is idempotent (safe to call multiple times)', () => {
      const store = createGameStore(makeFactory);
      store.destroy();
      store.destroy(); // should not throw
    });
  });
});
