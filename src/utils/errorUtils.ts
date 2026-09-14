/**
 * Error Handling Utility for OrbitPulse
 * Sanitizes technical, network, Java exceptions, and raw API errors
 * into clean, user-friendly messages for UI display.
 */

export function getCleanErrorMessage(error: unknown, fallbackMessage?: string): string {
  if (!error) {
    return fallbackMessage || 'Data temporarily unavailable.';
  }

  let errorStr = '';
  if (typeof error === 'string') {
    errorStr = error;
  } else if (error instanceof Error) {
    errorStr = error.message || error.toString();
  } else if (typeof error === 'object') {
    errorStr = JSON.stringify(error);
  }

  const lower = errorStr.toLowerCase();

  // Network / Host Resolution / Offline Failures
  if (
    lower.includes('unknownhostexception') ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('network request failed') ||
    lower.includes('networkerror') ||
    lower.includes('net::err') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('socket') ||
    lower.includes('offline') ||
    lower.includes('no internet') ||
    lower.includes('abort-error') ||
    lower.includes('abort error') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return 'No internet connection. Please check your network.';
  }

  // Rate Limiting (HTTP 429) & Server Errors (HTTP 5xx)
  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('server error')
  ) {
    return fallbackMessage
      ? `${fallbackMessage} temporarily unavailable.`
      : 'Service temporarily unavailable. Please try again shortly.';
  }

  // API Key / Auth Config Issues
  if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('401') || lower.includes('403')) {
    return fallbackMessage
      ? `${fallbackMessage} unavailable due to API configuration.`
      : 'Service unavailable. Please check API configuration.';
  }

  // Generic fallback without technical details or raw exception strings
  if (fallbackMessage) {
    return fallbackMessage;
  }

  return 'Data temporarily unavailable. Please try again later.';
}
