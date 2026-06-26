type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const memoryStorage = new Map<string, string>();

const createMemoryStorage = (): StorageLike => ({
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, value) => {
    memoryStorage.set(key, value);
  },
  removeItem: (key) => {
    memoryStorage.delete(key);
  }
});

export const runtimeStorage: StorageLike =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage
    : createMemoryStorage();

export const readJson = <T>(key: string, fallback: T): T => {
  const raw = runtimeStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeJson = (key: string, value: unknown) => {
  runtimeStorage.setItem(key, JSON.stringify(value));
};

export const readString = (key: string, fallback = '') => runtimeStorage.getItem(key) ?? fallback;
export const writeString = (key: string, value: string) => runtimeStorage.setItem(key, value);
