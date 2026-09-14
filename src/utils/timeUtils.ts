/**
 * OrbitPulse Time & Data Freshness Formatting Utilities
 */

/**
 * Converts a Unix timestamp (ms) or Date string/number into a concise relative time string.
 * Examples:
 * - < 1 minute: "just now"
 * - 1-59 minutes: "12 min ago"
 * - 1-23 hours: "4h ago"
 * - 24+ hours: "2d ago"
 */
export function formatRelativeTime(timestamp?: number | string | Date | null): string {
  if (!timestamp) return 'recently';

  let timeMs: number;
  if (typeof timestamp === 'number') {
    timeMs = timestamp;
  } else if (typeof timestamp === 'string') {
    timeMs = new Date(timestamp).getTime();
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else {
    return 'recently';
  }

  if (isNaN(timeMs) || timeMs <= 0) {
    return 'recently';
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timeMs);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export interface FreshnessOptions {
  source?: 'live' | 'cache';
  cachedAt?: number | null;
  lastUpdated?: number | null;
  isStale?: boolean;
  prefix?: string;
}

/**
 * Returns a standardized freshness string for UI indicators.
 * Examples:
 * - Live: "Updated 5 min ago" or "Live • Updated just now"
 * - Cached: "Cached • Updated 3h ago"
 * - Stale: "Cached • Stale (2d ago)"
 */
export function formatFreshnessLabel({
  source = 'live',
  cachedAt,
  lastUpdated,
  isStale = false,
  prefix = 'Updated',
}: FreshnessOptions): string {
  const targetTime = source === 'cache' ? cachedAt : (lastUpdated || cachedAt || Date.now());
  const relTime = formatRelativeTime(targetTime);

  if (source === 'cache') {
    if (isStale) {
      return `Cached • Stale (${relTime})`;
    }
    return `Cached • ${prefix} ${relTime}`;
  }

  if (relTime === 'just now') {
    return `${prefix} just now`;
  }

  return `${prefix} ${relTime}`;
}
