/**
 * localStorage wrapper: every read/write is try/caught so the app keeps
 * working in private browsing, with blocked storage, or when the quota
 * is exceeded. Used only for per-device game-resume convenience, never
 * for anything the app can't function without.
 */

const PREFIX = 'classbingo:';

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full — silently no-op.
  }
}

export function loadState<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearState(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
