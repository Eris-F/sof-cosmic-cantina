/**
 * API client for Sofia's Cosmic Cantina backend.
 * Handles auth, token refresh, offline fallback, and all game API calls.
 */

import type { PlayerInfo, PlayerMeResponse, ShopResponse, EquipResponse, SkillResponse, ScoresResponse, AchievementsResponse, SyncResponse, FullPlayerState } from './schemas/api.schema';
import {
  AuthResponseSchema,
  PlayerMeResponseSchema,
  ShopResponseSchema,
  EquipResponseSchema,
  SkillResponseSchema,
  ScoresResponseSchema,
  AchievementsResponseSchema,
  SyncResponseSchema,
} from './schemas/api.schema';
import type { ZodType } from 'zod';

const API_BASE: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STORAGE = {
  ACCESS_TOKEN: 'sofia_cantina_access_token',
  REFRESH_TOKEN: 'sofia_cantina_refresh_token',
  PLAYER: 'sofia_cantina_player',
  DIRTY: 'sofia_cantina_dirty',
} as const;

// --- Validation helper ---

/**
 * Validates data against a Zod schema using safeParse.
 * Logs validation errors but returns the data regardless to avoid blocking.
 */
function validateResponse<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[API] ${label} validation failed:`, result.error.issues);
  }
  return data as T;
}

// --- Token management ---

function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE.ACCESS_TOKEN);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE.REFRESH_TOKEN);
}

function storeTokens(access: string, refresh?: string): void {
  localStorage.setItem(STORAGE.ACCESS_TOKEN, access);
  if (refresh) localStorage.setItem(STORAGE.REFRESH_TOKEN, refresh);
}

function storePlayer(player: PlayerInfo): void {
  localStorage.setItem(STORAGE.PLAYER, JSON.stringify(player));
}

export function getStoredPlayer(): PlayerInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE.PLAYER);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerInfo;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getAccessToken() && !!getStoredPlayer();
}

function clearAuth(): void {
  localStorage.removeItem(STORAGE.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE.PLAYER);
}

function markDirty(): void {
  localStorage.setItem(STORAGE.DIRTY, '1');
}

function clearDirty(): void {
  localStorage.removeItem(STORAGE.DIRTY);
}

function isDirty(): boolean {
  return localStorage.getItem(STORAGE.DIRTY) === '1';
}

// --- HTTP helpers ---

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      return fetch(url, { ...options, headers });
    }
    clearAuth();
    return res;
  }

  return res;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { access_token: string };
    localStorage.setItem(STORAGE.ACCESS_TOKEN, data.access_token);
    return true;
  } catch {
    return false;
  }
}

async function apiPost(path: string, body: Record<string, unknown>): Promise<Response> {
  return apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function apiPut(path: string, body: Record<string, unknown>): Promise<Response> {
  return apiFetch(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function apiGet(path: string): Promise<Response> {
  return apiFetch(path);
}

// --- Auth ---

export async function register(email: string, username: string, password: string): Promise<PlayerInfo> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail || 'Registration failed');
  }
  const raw = await res.json();
  const data = validateResponse(AuthResponseSchema, raw, 'register') as { access_token: string; refresh_token: string; player: PlayerInfo };
  storeTokens(data.access_token, data.refresh_token);
  storePlayer(data.player);
  return data.player;
}

export async function login(email: string, password: string): Promise<PlayerInfo> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail || 'Login failed');
  }
  const raw = await res.json();
  const data = validateResponse(AuthResponseSchema, raw, 'login') as { access_token: string; refresh_token: string; player: PlayerInfo };
  storeTokens(data.access_token, data.refresh_token);
  storePlayer(data.player);
  return data.player;
}

export async function googleAuth(idToken: string): Promise<PlayerInfo> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail || 'Google auth failed');
  }
  const raw = await res.json();
  const data = validateResponse(AuthResponseSchema, raw, 'googleAuth') as { access_token: string; refresh_token: string; player: PlayerInfo };
  storeTokens(data.access_token, data.refresh_token);
  storePlayer(data.player);
  return data.player;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await apiPost('/auth/logout', { refresh_token: refresh });
    } catch { /* ignore */ }
  }
  clearAuth();
}

// --- Game API calls (with offline fallback) ---

export async function fetchPlayerState(): Promise<PlayerMeResponse | null> {
  try {
    const res = await apiGet('/players/me');
    if (!res.ok) return null;
    const raw = await res.json();
    return validateResponse(PlayerMeResponseSchema, raw, 'fetchPlayerState');
  } catch {
    return null;
  }
}

export async function buyItem(category: string, itemId: string): Promise<ShopResponse | null> {
  try {
    const res = await apiPost('/shop/buy', { category, itemId });
    if (!res.ok) { markDirty(); return null; }
    const raw = await res.json();
    return validateResponse(ShopResponseSchema, raw, 'buyItem');
  } catch {
    markDirty();
    return null;
  }
}

export async function equipItem(category: string, itemId: string): Promise<EquipResponse | null> {
  try {
    const res = await apiPut('/shop/equip', { category, itemId });
    if (!res.ok) { markDirty(); return null; }
    const raw = await res.json();
    return validateResponse(EquipResponseSchema, raw, 'equipItem');
  } catch {
    markDirty();
    return null;
  }
}

export async function upgradeSkill(branchId: string): Promise<SkillResponse | null> {
  try {
    const res = await apiPost('/skills/upgrade', { branchId });
    if (!res.ok) { markDirty(); return null; }
    const raw = await res.json();
    return validateResponse(SkillResponseSchema, raw, 'upgradeSkill');
  } catch {
    markDirty();
    return null;
  }
}

export async function submitScore(
  name: string,
  score: number,
  wave: number,
  difficulty: string,
  gameMode: string,
): Promise<ScoresResponse | null> {
  try {
    const res = await apiPost('/scores', { name, score, wave, difficulty, gameMode });
    if (!res.ok) { markDirty(); return null; }
    const raw = await res.json();
    return validateResponse(ScoresResponseSchema, raw, 'submitScore');
  } catch {
    markDirty();
    return null;
  }
}

export async function getLeaderboard(limit: number = 20): Promise<ScoresResponse | null> {
  try {
    const res = await apiGet(`/scores?limit=${limit}`);
    if (!res.ok) return null;
    const raw = await res.json();
    return validateResponse(ScoresResponseSchema, raw, 'getLeaderboard');
  } catch {
    return null;
  }
}

export async function unlockAchievements(achievementIds: string[]): Promise<AchievementsResponse | null> {
  try {
    const res = await apiPost('/achievements', { achievementIds });
    if (!res.ok) { markDirty(); return null; }
    const raw = await res.json();
    return validateResponse(AchievementsResponseSchema, raw, 'unlockAchievements');
  } catch {
    markDirty();
    return null;
  }
}

export async function syncState(localState: FullPlayerState): Promise<SyncResponse | null> {
  try {
    const res = await apiPost('/sync', { state: localState });
    if (!res.ok) return null;
    clearDirty();
    const raw = await res.json();
    return validateResponse(SyncResponseSchema, raw, 'syncState');
  } catch {
    return null;
  }
}

// --- Auto-sync on reconnect ---

export function initAutoSync(onSyncComplete?: (result: SyncResponse) => void): void {
  window.addEventListener('online', async () => {
    if (isLoggedIn() && isDirty()) {
      const result = await syncState(buildLocalState());
      if (result && onSyncComplete) onSyncComplete(result);
    }
  });
}

// Build the local state payload from localStorage for sync
function buildLocalState(): FullPlayerState {
  const parse = <T>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return (raw ? JSON.parse(raw) as T : fallback) || fallback;
    } catch {
      return fallback;
    }
  };

  return {
    wallet: parse('sofia_cantina_wallet', { coins: 0, totalEarned: 0 }),
    owned: parse('sofia_cantina_owned', { skins: ['default'], bullets: ['bread'], trails: ['none'], barriers: ['flowers'] }),
    equipped: parse('sofia_cantina_equipped', { skins: 'default', bullets: 'bread', trails: 'none', barriers: 'flowers' }),
    skills: parse('sofia_cantina_skills', { tequila: 0, skiing: 0, diving: 0, photography: 0, music: 0 }),
    achievements: parse<string[]>('sofia_cantina_achievements', []),
    highScores: parse('sofia_cantina_scores', []),
  };
}
