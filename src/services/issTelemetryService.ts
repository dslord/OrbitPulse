import { ISSTelemetry } from '../types';
import { saveToCache, getFromCache, CachedResult } from './cacheService';
import { getCleanErrorMessage } from '../utils/errorUtils';

const ISS_TELEMETRY_ENDPOINT = 'https://api.wheretheiss.at/v1/satellites/25544';
const ISS_SNAPSHOT_CACHE_KEY = 'iss_telemetry_snapshot';
const MAX_ISS_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour max fallback window

export interface ISSTelemetryResult extends CachedResult<ISSTelemetry> {}

/**
 * Fetches real live ISS telemetry from WhereTheISS API with persistent cache snapshot fallback and sanitized error handling.
 */
export async function fetchISSTelemetryWithMeta(
  timeoutMs: number = 10000
): Promise<ISSTelemetryResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(ISS_TELEMETRY_ENDPOINT, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const cached = await getFromCache<ISSTelemetry>(ISS_SNAPSHOT_CACHE_KEY);
      if (cached && cached.data && typeof cached.data.latitude === 'number') {
        return {
          data: {
            ...cached.data,
            isCached: true,
          },
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_ISS_CACHE_AGE_MS,
        };
      }
      throw new Error(`ISS Satellite API error (HTTP ${response.status})`);
    }

    const data = await response.json();
    const liveTelemetry: ISSTelemetry = {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      velocity: data.velocity,
      visibility: data.visibility || 'N/A',
      timestamp: data.timestamp,
      isCached: false,
    };

    // Save snapshot to persistent cache
    saveToCache(ISS_SNAPSHOT_CACHE_KEY, liveTelemetry);

    return {
      data: liveTelemetry,
      source: 'live',
      cachedAt: Date.now(),
      isStale: false,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Attempt snapshot fallback
    const cached = await getFromCache<ISSTelemetry>(ISS_SNAPSHOT_CACHE_KEY);
    if (cached && cached.data && typeof cached.data.latitude === 'number') {
      return {
        data: {
          ...cached.data,
          isCached: true,
        },
        source: 'cache',
        cachedAt: cached.cachedAt,
        isStale: Date.now() - cached.cachedAt > MAX_ISS_CACHE_AGE_MS,
      };
    }

    const cleanMsg = getCleanErrorMessage(err, 'ISS telemetry is');
    throw new Error(cleanMsg);
  }
}

/**
 * Backward-compatible helper returning ISSTelemetry directly.
 */
export async function fetchISSTelemetry(timeoutMs: number = 10000): Promise<ISSTelemetry> {
  const result = await fetchISSTelemetryWithMeta(timeoutMs);
  return result.data;
}
