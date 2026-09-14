import { LaunchItem } from '../types';
import { saveToCache, getFromCache, CachedResult } from './cacheService';
import { getCleanErrorMessage } from '../utils/errorUtils';

const LAUNCH_API_URL = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=20';
const LAUNCHES_CACHE_KEY = 'launches_upcoming';
const MAX_LAUNCHES_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RawLaunchResult {
  id: string;
  name: string;
  net?: string;
  status?: {
    name?: string;
    abbrev?: string;
  };
  launch_service_provider?: {
    name?: string;
  };
  rocket?: {
    configuration?: {
      full_name?: string;
      name?: string;
    };
  };
  pad?: {
    name?: string;
    location?: {
      name?: string;
    };
  };
  mission?: {
    description?: string;
    type?: string;
    info_urls?: Array<{ priority?: number; url?: string }>;
    vid_urls?: Array<{ priority?: number; url?: string }>;
  };
  image?: string;
  vid_urls?: Array<{ priority?: number; url?: string }>;
  url?: string;
}

interface RawLaunchResponse {
  results?: RawLaunchResult[];
}

export interface LaunchesResult extends CachedResult<LaunchItem[]> {}

/**
 * Fetches real upcoming launches from Launch Library 2 with persistent cache fallback and sanitized error handling.
 */
export async function fetchUpcomingLaunchesWithMeta(): Promise<LaunchesResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(LAUNCH_API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const cached = await getFromCache<LaunchItem[]>(LAUNCHES_CACHE_KEY);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return {
          data: cached.data,
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_LAUNCHES_CACHE_AGE_MS,
        };
      }
      throw new Error(`Launch API error (HTTP ${response.status})`);
    }

    const data: RawLaunchResponse = await response.json();
    if (!data.results || !Array.isArray(data.results)) {
      const cached = await getFromCache<LaunchItem[]>(LAUNCHES_CACHE_KEY);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return {
          data: cached.data,
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_LAUNCHES_CACHE_AGE_MS,
        };
      }
      return { data: [], source: 'live', cachedAt: Date.now() };
    }

    const launches: LaunchItem[] = data.results.map((item) => {
      const rocketName =
        item.rocket?.configuration?.full_name ||
        item.rocket?.configuration?.name ||
        'Not available';

      const providerName = item.launch_service_provider?.name || 'Not available';
      const statusName = item.status?.name || 'Upcoming';
      const statusAbbrev = item.status?.abbrev || 'TBC';
      const padName = item.pad?.name || 'Not available';
      const locationName = item.pad?.location?.name || 'Not available';
      const missionDescription = item.mission?.description || 'No mission summary available.';
      const missionType = item.mission?.type || 'Space Flight';
      const imageUrl = item.image || null;

      let webcastUrl: string | null = null;
      if (item.vid_urls && item.vid_urls.length > 0 && item.vid_urls[0].url) {
        webcastUrl = item.vid_urls[0].url;
      } else if (item.mission?.vid_urls && item.mission.vid_urls.length > 0 && item.mission.vid_urls[0].url) {
        webcastUrl = item.mission.vid_urls[0].url;
      }

      return {
        id: item.id || String(Math.random()),
        name: item.name || 'Unknown Launch',
        net: item.net || new Date().toISOString(),
        statusName,
        statusAbbrev,
        providerName,
        rocketName,
        locationName,
        padName,
        missionDescription,
        missionType,
        imageUrl,
        webcastUrl,
      };
    });

    // Save to persistent cache
    saveToCache(LAUNCHES_CACHE_KEY, launches);

    return {
      data: launches,
      source: 'live',
      cachedAt: Date.now(),
      isStale: false,
    };
  } catch (error: any) {
    // Attempt cache fallback
    const cached = await getFromCache<LaunchItem[]>(LAUNCHES_CACHE_KEY);
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      return {
        data: cached.data,
        source: 'cache',
        cachedAt: cached.cachedAt,
        isStale: Date.now() - cached.cachedAt > MAX_LAUNCHES_CACHE_AGE_MS,
      };
    }
    const cleanMsg = getCleanErrorMessage(error, 'Launch schedule is');
    throw new Error(cleanMsg);
  }
}

/**
 * Backward-compatible helper returning LaunchItem[] directly.
 */
export async function fetchUpcomingLaunches(): Promise<LaunchItem[]> {
  const result = await fetchUpcomingLaunchesWithMeta();
  return result.data;
}

/**
 * Helper to calculate dynamic countdown string given an ISO 8601 target launch time
 */
export function calculateLaunchCountdown(netIsoString: string, nowMs: number = Date.now()): {
  countdownText: string;
  isPastOrLive: boolean;
  statusLabel: string;
} {
  const targetMs = new Date(netIsoString).getTime();
  if (isNaN(targetMs)) {
    return { countdownText: 'T - --:--:--', isPastOrLive: false, statusLabel: 'UPCOMING' };
  }

  const diffMs = targetMs - nowMs;

  if (diffMs <= 0) {
    // Launch time reached or past
    const minutesPast = Math.abs(diffMs) / (1000 * 60);
    if (minutesPast <= 120) {
      return { countdownText: 'LIVE / LAUNCHING', isPastOrLive: true, statusLabel: 'LIVE' };
    } else {
      return { countdownText: 'LAUNCHED', isPastOrLive: true, statusLabel: 'COMPLETED' };
    }
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const daysStr = days > 0 ? `${days}d ` : '';
  const hoursStr = `${hours.toString().padStart(2, '0')}h `;
  const minutesStr = `${minutes.toString().padStart(2, '0')}m `;
  const secondsStr = `${seconds.toString().padStart(2, '0')}s`;

  return {
    countdownText: `T - ${daysStr}${hoursStr}${minutesStr}${secondsStr}`,
    isPastOrLive: false,
    statusLabel: days === 0 && hours < 24 ? 'IMMINENT' : 'UPCOMING',
  };
}
