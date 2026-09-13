import { SpaceNewsArticle } from '../types';

const SNAPI_URL = 'https://api.spaceflightnewsapi.net/v4/articles/';

interface SNAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SpaceNewsArticle[];
}

// In-memory cache & rate limit protection
let newsCache: {
  articles: SpaceNewsArticle[];
  timestamp: number;
} | null = null;

let rateLimitCooldownUntil = 0;
const CACHE_TTL_MS = 60 * 1000; // 60-second cache window
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // 60-second rate-limit cooldown

/**
 * Fetches recent live spaceflight news articles from Spaceflight News API (SNAPI v4).
 * @param limit Number of articles to retrieve (default: 10)
 * @param search Optional search query string to filter articles
 * @param forceRefresh Force a new network request bypassing cache
 * @returns Array of SpaceNewsArticle objects sorted by newest publication date
 */
export async function fetchSpaceNews(
  limit: number = 10,
  search?: string,
  forceRefresh: boolean = false
): Promise<SpaceNewsArticle[]> {
  const now = Date.now();

  // 1. Check in-memory cache if not forcing refresh
  if (!forceRefresh && newsCache && now - newsCache.timestamp < CACHE_TTL_MS) {
    return newsCache.articles.slice(0, limit);
  }

  // 2. Check active 429 rate limit cooldown
  if (!forceRefresh && now < rateLimitCooldownUntil) {
    if (newsCache && newsCache.articles.length > 0) {
      return newsCache.articles.slice(0, limit);
    }
    throw new Error('Space news is temporarily unavailable.');
  }

  try {
    let url = `${SNAPI_URL}?limit=${limit}&ordering=-published_at`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const response = await fetch(url);

    if (response.status === 429) {
      rateLimitCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      if (newsCache && newsCache.articles.length > 0) {
        return newsCache.articles.slice(0, limit);
      }
      throw new Error('Space news is temporarily unavailable.');
    }

    if (!response.ok) {
      if (newsCache && newsCache.articles.length > 0) {
        return newsCache.articles.slice(0, limit);
      }
      throw new Error('Space news is temporarily unavailable.');
    }

    const data: SNAPIResponse = await response.json();

    if (!data || !Array.isArray(data.results)) {
      if (newsCache && newsCache.articles.length > 0) {
        return newsCache.articles.slice(0, limit);
      }
      throw new Error('Space news is temporarily unavailable.');
    }

    // Cache successful results
    newsCache = {
      articles: data.results,
      timestamp: Date.now(),
    };

    return data.results.slice(0, limit);
  } catch (error: any) {
    if (newsCache && newsCache.articles.length > 0) {
      return newsCache.articles.slice(0, limit);
    }
    throw new Error(error.message || 'Space news is temporarily unavailable.');
  }
}
