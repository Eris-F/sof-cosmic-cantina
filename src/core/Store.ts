import { createStore } from 'zustand/vanilla';
import { produce, type Draft } from 'immer';
import type { IStore } from '../types/systems';

type Unsubscribe = () => void;

/**
 * Deep-freezes an object recursively (for snapshot immutability).
 */
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj;
  }
  Object.freeze(obj);
  const keys = Object.getOwnPropertyNames(obj);
  for (let i = 0; i < keys.length; i++) {
    deepFreeze((obj as Record<string, unknown>)[keys[i]!]);
  }
  return obj;
}

/**
 * Deep-clones a plain object via structured clone.
 */
function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Creates a game store backed by zustand/vanilla with immer-based updates.
 *
 * @param stateFactory    - Factory that returns fresh initial state
 * @param initialOverrides - Optional partial overrides merged on top
 */
export function createGameStore<T extends object>(
  stateFactory: () => T,
  initialOverrides?: Partial<T>,
): IStore<T> {
  const buildInitial = (): T => {
    const base = stateFactory();
    if (initialOverrides) {
      return { ...base, ...initialOverrides };
    }
    return base;
  };

  const zustandStore = createStore<T>(() => buildInitial());

  const unsubscribers = new Set<Unsubscribe>();
  let destroyed = false;

  /**
   * Immer-based state update. Mutations inside `fn` are applied immutably.
   */
  function update(fn: (draft: Draft<T>) => void): void {
    if (destroyed) return;
    zustandStore.setState(produce(fn) as (state: T) => T);
  }

  /**
   * Subscribe to a selected slice of state. Callback fires only when the
   * selected value changes (shallow equality).
   */
  function subscribe<S>(selector: (state: T) => S, callback: (slice: S) => void): Unsubscribe {
    if (destroyed) {
      return () => {};
    }

    let prev: S = selector(zustandStore.getState());

    const unsub: Unsubscribe = zustandStore.subscribe((state: T) => {
      const next = selector(state);
      if (!Object.is(prev, next)) {
        prev = next;
        callback(next);
      }
    });

    unsubscribers.add(unsub);

    return () => {
      unsub();
      unsubscribers.delete(unsub);
    };
  }

  /**
   * Returns a deep-frozen clone of the current state.
   * Safe for debugging, logging, or network serialization.
   */
  function snapshot(): Readonly<T> {
    return deepFreeze(deepClone(zustandStore.getState()));
  }

  /**
   * Replaces current state with a deep clone of the provided snapshot.
   */
  function restore(snap: Readonly<T>): void {
    if (destroyed) return;
    if (snap === null || typeof snap !== 'object') {
      throw new Error('Store.restore expects a non-null object');
    }
    zustandStore.setState(deepClone(snap), true);
  }

  /**
   * Resets state to initial values (re-invokes the factory).
   */
  function reset(): void {
    if (destroyed) return;
    zustandStore.setState(buildInitial(), true);
  }

  /**
   * Destroys the store: unsubscribes all listeners and prevents further updates.
   */
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    for (const unsub of unsubscribers) {
      unsub();
    }
    unsubscribers.clear();
  }

  return {
    getState: zustandStore.getState,
    update,
    subscribe,
    snapshot,
    restore,
    reset,
    destroy,
  };
}
