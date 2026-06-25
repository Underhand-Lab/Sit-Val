const CACHE_VERSION = 'v2';
const CACHE_PREFIX = `sit_val_cache_${CACHE_VERSION}_`;
const DEFAULT_TTL_MS = 1000 * 60 * 30;
const memoryCache: Record<string, CacheEnvelope<unknown>> = {};

interface CacheEnvelope<T> {
  expiresAt: number;
  value: T;
}

export const cacheStore = {
  get<T>(key: string): T | null {
    const cached = memoryCache[key];
    if (cached) {
      if (cached.expiresAt > Date.now()) return cached.value as T;
      delete memoryCache[key];
    }

    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored) as CacheEnvelope<T>;
      if (parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      memoryCache[key] = parsed as CacheEnvelope<unknown>;
      return parsed.value;
    } catch {
      return null;
    }
  },

  set(key: string, data: unknown, ttlMs = DEFAULT_TTL_MS) {
    const envelope: CacheEnvelope<unknown> = {
      expiresAt: Date.now() + ttlMs,
      value: data,
    };
    memoryCache[key] = envelope;
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  },

  clear(key: string) {
    delete memoryCache[key];
    localStorage.removeItem(CACHE_PREFIX + key);
  },

  clearAll() {
    Object.keys(memoryCache).forEach((key) => delete memoryCache[key]);
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
};
