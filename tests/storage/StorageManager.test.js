/**
 * Tests for StorageManager — the coordinator between local and remote storage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageManager } from '../../src/storage/StorageManager.js';
import { WALLET, OWNED_ITEMS, DIRTY_FLAG, GAME_DATA_KEYS } from '../../src/config/storage-keys.js';
import { STATE_SYNCED } from '../../src/core/events.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function createMockLocal() {
  const store = new Map();
  return {
    get: vi.fn(async (key) => store.get(key) ?? null),
    set: vi.fn(async (key, value) => { store.set(key, value); }),
    remove: vi.fn(async (key) => { store.delete(key); }),
    clear: vi.fn(async () => { store.clear(); }),
    getAll: vi.fn(async () => Object.fromEntries(store)),
    setAll: vi.fn(async (data) => {
      for (const [k, v] of Object.entries(data)) {
        store.set(k, v);
      }
    }),
    _store: store,
  };
}

function createMockRemote(serverState = null) {
  return {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    getAll: vi.fn(async () => serverState),
    setAll: vi.fn(async () => serverState),
  };
}

function createMockEventBus() {
  return {
    emit: vi.fn(),
    on: vi.fn(() => () => {}),
  };
}

function createFakeLocalStorage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('StorageManager', () => {
  /** @type {StorageManager} */
  let manager;
  let local;
  let remote;
  let eventBus;
  let origLocalStorage;

  beforeEach(() => {
    origLocalStorage = globalThis.localStorage;
    // Provide a fake so _hydrateFromDirtyFlag and _persistDirtyFlag work
    Object.defineProperty(globalThis, 'localStorage', {
      value: createFakeLocalStorage(),
      writable: true,
      configurable: true,
    });

    local = createMockLocal();
    remote = createMockRemote();
    eventBus = createMockEventBus();
    manager = new StorageManager(local, remote, eventBus);
  });

  afterEach(() => {
    manager.dispose();
    Object.defineProperty(globalThis, 'localStorage', {
      value: origLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // ── load ─────────────────────────────────────────────────────────────

  it('load() reads from local adapter', async () => {
    const wallet = { coins: 100, totalEarned: 200 };
    local._store.set(WALLET, wallet);

    const result = await manager.load(WALLET);
    expect(result).toEqual(wallet);
    expect(local.get).toHaveBeenCalledWith(WALLET);
  });

  it('load() returns null when key is missing', async () => {
    const result = await manager.load(WALLET);
    expect(result).toBeNull();
  });

  // ── save ─────────────────────────────────────────────────────────────

  it('save() writes to local immediately', async () => {
    const wallet = { coins: 50, totalEarned: 50 };
    await manager.save(WALLET, wallet);

    expect(local.set).toHaveBeenCalledWith(WALLET, wallet);
    expect(local._store.get(WALLET)).toEqual(wallet);
  });

  it('save() marks state as dirty', async () => {
    await manager.save(WALLET, { coins: 1, totalEarned: 1 });
    expect(manager.isDirty()).toBe(true);
  });

  it('save() persists dirty flag to localStorage', async () => {
    await manager.save(WALLET, { coins: 1, totalEarned: 1 });
    expect(globalThis.localStorage.getItem(DIRTY_FLAG)).toBe('1');
  });

  // ── sync ─────────────────────────────────────────────────────────────

  it('sync() pushes local data and writes server response back', async () => {
    const localWallet = { coins: 50, totalEarned: 50 };
    local._store.set(WALLET, localWallet);

    const serverResponse = { [WALLET]: { coins: 100, totalEarned: 200 } };
    remote.setAll.mockResolvedValue(serverResponse);

    manager.markDirty();
    const success = await manager.sync();

    expect(success).toBe(true);
    expect(remote.setAll).toHaveBeenCalled();
    expect(local.setAll).toHaveBeenCalledWith(serverResponse);
  });

  it('sync() emits STATE_SYNCED on success', async () => {
    const serverResponse = { [WALLET]: { coins: 100, totalEarned: 200 } };
    remote.setAll.mockResolvedValue(serverResponse);

    manager.markDirty();
    await manager.sync();

    expect(eventBus.emit).toHaveBeenCalledWith(STATE_SYNCED, serverResponse);
  });

  it('sync() clears dirty flag on success', async () => {
    remote.setAll.mockResolvedValue({ [WALLET]: { coins: 0, totalEarned: 0 } });

    manager.markDirty();
    expect(manager.isDirty()).toBe(true);

    await manager.sync();
    expect(manager.isDirty()).toBe(false);
    expect(globalThis.localStorage.getItem(DIRTY_FLAG)).toBeNull();
  });

  it('sync() returns false when remote returns null (offline)', async () => {
    remote.setAll.mockResolvedValue(null);
    manager.markDirty();

    const success = await manager.sync();

    expect(success).toBe(false);
    expect(manager.isDirty()).toBe(true);
  });

  it('sync() returns false when remote throws', async () => {
    remote.setAll.mockRejectedValue(new Error('Network error'));
    manager.markDirty();

    const success = await manager.sync();

    expect(success).toBe(false);
    expect(manager.isDirty()).toBe(true);
  });

  it('concurrent sync() calls are coalesced', async () => {
    remote.setAll.mockResolvedValue({});

    manager.markDirty();
    const [a, b] = await Promise.all([manager.sync(), manager.sync()]);

    // One succeeds, the other is rejected as already syncing
    expect([a, b]).toContain(true);
    expect([a, b]).toContain(false);
    expect(remote.setAll).toHaveBeenCalledTimes(1);
  });

  // ── dirty tracking ───────────────────────────────────────────────────

  it('isDirty() is false initially', () => {
    expect(manager.isDirty()).toBe(false);
  });

  it('markDirty() flags all game keys', () => {
    manager.markDirty();
    expect(manager.isDirty()).toBe(true);
  });

  it('clearDirty() resets dirty state', () => {
    manager.markDirty();
    manager.clearDirty();
    expect(manager.isDirty()).toBe(false);
  });

  // ── offline reconnect ────────────────────────────────────────────────

  it('auto-syncs when browser goes online and state is dirty', async () => {
    const serverResponse = { [WALLET]: { coins: 200, totalEarned: 200 } };
    remote.setAll.mockResolvedValue(serverResponse);
    manager.markDirty();

    // Simulate coming online
    globalThis.dispatchEvent(new Event('online'));

    // The sync is async — give it a tick
    await vi.waitFor(() => {
      expect(remote.setAll).toHaveBeenCalled();
    });
  });

  it('does NOT sync on online event when clean', async () => {
    globalThis.dispatchEvent(new Event('online'));

    // Give it a tick to ensure nothing fires
    await new Promise((r) => setTimeout(r, 50));
    expect(remote.setAll).not.toHaveBeenCalled();
  });

  // ── debounce ─────────────────────────────────────────────────────────

  it('batches rapid saves into a single sync', async () => {
    vi.useFakeTimers();
    remote.setAll.mockResolvedValue({});

    await manager.save(WALLET, { coins: 1, totalEarned: 1 });
    await manager.save(WALLET, { coins: 2, totalEarned: 2 });
    await manager.save(WALLET, { coins: 3, totalEarned: 3 });

    // No sync yet — debounce hasn't fired
    expect(remote.setAll).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);

    expect(remote.setAll).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  // ── hydration from dirty flag ────────────────────────────────────────

  it('hydrates dirty state from localStorage on construction', () => {
    manager.dispose();

    globalThis.localStorage.setItem(DIRTY_FLAG, '1');
    const fresh = new StorageManager(local, remote, eventBus);

    expect(fresh.isDirty()).toBe(true);
    fresh.dispose();
  });

  // ── dispose ──────────────────────────────────────────────────────────

  it('dispose() clears debounce timer', async () => {
    vi.useFakeTimers();

    await manager.save(WALLET, { coins: 1, totalEarned: 1 });
    manager.dispose();

    await vi.advanceTimersByTimeAsync(500);
    expect(remote.setAll).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
