import { SpaceNewsArticle } from '../types';
import { saveToCache, getFromCache, CachedResult } from './cacheService';
import { getCleanErrorMessage } from '../utils/errorUtils';

const SNAPI_URL = 'https://api.spaceflightnewsapi.net/v4/articles/';
const NEWS_CACHE_KEY_PREFIX = 'space_news_feed_';
const MAX_NEWS_CACHE_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

interface SNAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SpaceNewsArticle[];
}

export interface SpaceNewsResult extends CachedResult<SpaceNewsArticle[]> {}

/**
 * Fetches recent live spaceflight news articles with persistent cache fallback & metadata.
 */
export async function fetchSpaceNewsWithMeta(
  limit: number = 10,
  search?: string
): Promise<SpaceNewsResult> {
  const cacheKey = `${NEWS_CACHE_KEY_PREFIX}${search ? search.trim().toLowerCase() : 'all'}`;

  try {
    let url = `${SNAPI_URL}?limit=${limit}&ordering=-published_at`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 429) {
      const cached = await getFromCache<SpaceNewsArticle[]>(cacheKey);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return {
          data: cached.data.slice(0, limit),
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_NEWS_CACHE_AGE_MS,
        };
      }
      throw new Error('Space news is temporarily unavailable.');
    }

    if (!response.ok) {
      const cached = await getFromCache<SpaceNewsArticle[]>(cacheKey);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return {
          data: cached.data.slice(0, limit),
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_NEWS_CACHE_AGE_MS,
        };
      }
      throw new Error(`Space news server error (HTTP ${response.status})`);
    }

    const data: SNAPIResponse = await response.json();
    if (!data || !Array.isArray(data.results)) {
      const cached = await getFromCache<SpaceNewsArticle[]>(cacheKey);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        return {
          data: cached.data.slice(0, limit),
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: Date.now() - cached.cachedAt > MAX_NEWS_CACHE_AGE_MS,
        };
      }
      throw new Error('Invalid space news response received.');
    }

    // Save successful live response to persistent disk cache
    saveToCache(cacheKey, data.results);

    return {
      data: data.results.slice(0, limit),
      source: 'live',
      cachedAt: Date.now(),
      isStale: false,
    };
  } catch (err: any) {
    // Attempt persistent cache fallback
    const cached = await getFromCache<SpaceNewsArticle[]>(cacheKey);
    if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
      return {
        data: cached.data.slice(0, limit),
        source: 'cache',
        cachedAt: cached.cachedAt,
        isStale: Date.now() - cached.cachedAt > MAX_NEWS_CACHE_AGE_MS,
      };
    }

    // No cache available — throw clean, user-friendly error string
    const cleanMsg = getCleanErrorMessage(err, 'Space news is');
    throw new Error(cleanMsg);
  }
}

/**
 * Fetches recent live spaceflight news articles from Spaceflight News API (SNAPI v4).
 */
export async function fetchSpaceNews(
  limit: number = 10,
  search?: string
): Promise<SpaceNewsArticle[]> {
  const result = await fetchSpaceNewsWithMeta(limit, search);
  return result.data;
}
