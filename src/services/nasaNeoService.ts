import { MeteorObject } from '../types';
import { saveToCache, getFromCache, CachedResult } from './cacheService';
import { getCleanErrorMessage } from '../utils/errorUtils';

const NASA_NEO_CACHE_KEY = 'nasa_neo_feed';
const MAX_NEO_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface MeteorFeedResult extends CachedResult<MeteorObject[]> {
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches Near-Earth Object telemetry from NASA NEO API with persistent cache fallback.
 */
export async function fetchMeteorFeedWithMeta(): Promise<MeteorFeedResult> {
  const apiKey = process.env.EXPO_PUBLIC_NASA_API_KEY;

  if (!apiKey) {
    // Attempt cache fallback if API key missing
    const cached = await getFromCache<{ meteors: MeteorObject[]; startDate: string; endDate: string }>(
      NASA_NEO_CACHE_KEY
    );
    if (cached && cached.data && Array.isArray(cached.data.meteors) && cached.data.meteors.length > 0) {
      return {
        data: cached.data.meteors,
        source: 'cache',
        cachedAt: cached.cachedAt,
        isStale: Date.now() - cached.cachedAt > MAX_NEO_CACHE_AGE_MS,
        startDate: cached.data.startDate,
        endDate: cached.data.endDate,
      };
    }
    throw new Error(
      'NASA API key missing. Please configure EXPO_PUBLIC_NASA_API_KEY environment variable to access near-earth object telemetry.'
    );
  }

  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      const cached = await getFromCache<{ meteors: MeteorObject[]; startDate: string; endDate: string }>(
        NASA_NEO_CACHE_KEY
      );
      if (cached && cached.data && Array.isArray(cached.data.meteors) && cached.data.meteors.length > 0) {
        return {
          data: cached.data.meteors,
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_NEO_CACHE_AGE_MS,
          startDate: cached.data.startDate,
          endDate: cached.data.endDate,
        };
      }
      throw new Error(
        'NASA API rate limit exceeded. Please try again shortly.'
      );
    }

    if (!response.ok) {
      const cached = await getFromCache<{ meteors: MeteorObject[]; startDate: string; endDate: string }>(
        NASA_NEO_CACHE_KEY
      );
      if (cached && cached.data && Array.isArray(cached.data.meteors) && cached.data.meteors.length > 0) {
        return {
          data: cached.data.meteors,
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_NEO_CACHE_AGE_MS,
          startDate: cached.data.startDate,
          endDate: cached.data.endDate,
        };
      }
      throw new Error(`NASA NEO API error (HTTP ${response.status})`);
    }

    const data = await response.json();
    const nearEarthObjects = data.near_earth_objects;

    if (!nearEarthObjects || Object.keys(nearEarthObjects).length === 0) {
      return { data: [], source: 'live', cachedAt: Date.now() };
    }

    const meteorArrays: MeteorObject[][] = Object.keys(nearEarthObjects).map(
      (date) => nearEarthObjects[date]
    );
    let allMeteors: MeteorObject[] = Array.prototype.concat.apply([], meteorArrays);

    allMeteors.forEach((element) => {
      const currentApproach =
        element.close_approach_data?.find(
          (cad) =>
            cad.close_approach_date &&
            cad.close_approach_date >= startDate &&
            cad.close_approach_date <= endDate
        ) ||
        element.close_approach_data?.find(
          (cad) => cad.close_approach_date && cad.close_approach_date >= startDate
        ) ||
        element.close_approach_data?.[0];

      element.current_approach = currentApproach;

      let missDistance = parseFloat(
        currentApproach?.miss_distance?.kilometers || '1'
      );
      if (isNaN(missDistance) || missDistance <= 0) {
        missDistance = 1;
      }
      const minDia =
        element.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
      const maxDia =
        element.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
      const avgDiameter = (minDia + maxDia) / 2;

      const threatScore = (avgDiameter / missDistance) * 1000000000;
      element.threatScore = threatScore;
    });

    allMeteors.sort((a, b) => (b.threatScore || 0) - (a.threatScore || 0));
    const topMeteors = allMeteors.slice(0, 10);

    // Save to persistent cache WITHOUT API key or secrets
    saveToCache(NASA_NEO_CACHE_KEY, {
      meteors: topMeteors,
      startDate,
      endDate,
    });

    return {
      data: topMeteors,
      source: 'live',
      cachedAt: Date.now(),
      startDate,
      endDate,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    // Attempt cache fallback
    const cached = await getFromCache<{ meteors: MeteorObject[]; startDate: string; endDate: string }>(
      NASA_NEO_CACHE_KEY
    );
    if (cached && cached.data && Array.isArray(cached.data.meteors) && cached.data.meteors.length > 0) {
      return {
        data: cached.data.meteors,
        source: 'cache',
        cachedAt: cached.cachedAt,
        isStale: Date.now() - cached.cachedAt > MAX_NEO_CACHE_AGE_MS,
        startDate: cached.data.startDate,
        endDate: cached.data.endDate,
      };
    }

    const cleanMsg = getCleanErrorMessage(err, 'Near-Earth Object feed is');
    throw new Error(cleanMsg);
  }
}

/**
 * Backward-compatible helper returning MeteorObject[] directly.
 */
export async function fetchMeteorFeed(): Promise<MeteorObject[]> {
  const result = await fetchMeteorFeedWithMeta();
  return result.data;
}
