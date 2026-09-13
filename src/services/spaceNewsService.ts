import { SpaceNewsArticle } from '../types';

const SNAPI_URL = 'https://api.spaceflightnewsapi.net/v4/articles/';

interface SNAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SpaceNewsArticle[];
}

/**
 * Fetches recent live spaceflight news articles from Spaceflight News API (SNAPI v4).
 * @param limit Number of articles to retrieve (default: 10)
 * @param search Optional search query string to filter articles (e.g. "ISRO" or "India")
 * @returns Array of SpaceNewsArticle objects sorted by newest publication date
 */
export async function fetchSpaceNews(
  limit: number = 10,
  search?: string
): Promise<SpaceNewsArticle[]> {
  try {
    let url = `${SNAPI_URL}?limit=${limit}&ordering=-published_at`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SNAPI HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data: SNAPIResponse = await response.json();

    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid response structure received from Spaceflight News API.');
    }

    return data.results;
  } catch (error: any) {
    console.error('Error fetching live space news from SNAPI:', error.message || error);
    throw new Error(error.message || 'Unable to connect to live space news service.');
  }
}
