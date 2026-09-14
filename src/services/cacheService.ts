import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  key: string;
}

export interface CachedResult<T> {
  data: T;
  source: 'live' | 'cache';
  cachedAt?: number;
  isStale?: boolean;
}

const CACHE_PREFIX = '@orbitpulse_cache_';

/**
 * Saves data into persistent AsyncStorage with timestamp metadata.
 */
export async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      key,
    };
    const storageKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
  } catch (error) {
    console.warn(`[CacheService] Failed to save key "${key}":`, error);
  }
}

/**
 * Retrieves cached data and timestamp metadata from persistent storage.
 */
export async function getFromCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const storageKey = `${CACHE_PREFIX}${key}`;
    const jsonString = await AsyncStorage.getItem(storageKey);
    if (!jsonString) return null;

    const entry: CacheEntry<T> = JSON.parse(jsonString);
    if (!entry || typeof entry.cachedAt !== 'number' || entry.data === undefined) {
      return null;
    }
    return entry;
  } catch (error) {
    console.warn(`[CacheService] Failed to read key "${key}":`, error);
    return null;
  }
}

/**
 * Removes cached data for a specific key.
 */
export async function removeFromCache(key: string): Promise<void> {
  try {
    const storageKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`[CacheService] Failed to remove key "${key}":`, error);
  }
}

/**
 * Returns the age of a cached entry in milliseconds, or null if not found.
 */
export async function getCacheAgeMs(key: string): Promise<number | null> {
  const entry = await getFromCache(key);
  if (!entry) return null;
  return Date.now() - entry.cachedAt;
}
